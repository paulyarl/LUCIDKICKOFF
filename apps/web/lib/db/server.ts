import { createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SessionContext = {
  userId: string;
  role: string;
};

export type ChildProfileRow = {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
  auth_user_id: string | null;
  birthdate: string | null;
  active?: boolean;
};

export type FamilyChild = {
  id: string;
  childProfileId: string;
  email: string;
  avatarUrl: string | null;
  birthdate: string | null;
};

export type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  image_path: string | null;
  is_active: boolean | null;
  kind: string;
  sort_order: number;
  parent_id: string | null;
};

export type DiscoveryRow = {
  // the view only emits these four; artwork categorization exists in the
  // join table but artworks keep their own feed path for now
  content_type: "pack" | "lesson" | "template" | "tutorial";
  content_id: string;
  title: string;
  slug: string | null;
  image_path: string | null;
  is_free: boolean;
  age_band: string;
  category_id: string;
  position: number;
};

export type ContentType = DiscoveryRow["content_type"] | "artwork";

async function categoriesQuery(supabase: SupabaseClient<any>): Promise<CategoryRow[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, description, icon, image_path, is_active, kind, sort_order, parent_id")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as CategoryRow[];
}

async function discoveryQuery(
  supabase: SupabaseClient<any>,
  opts: { categoryId?: string | null; type?: ContentType | null } = {},
): Promise<DiscoveryRow[]> {
  let query = supabase.from("content_discovery").select("*");
  if (opts.categoryId) query = query.eq("category_id", opts.categoryId);
  if (opts.type) query = query.eq("content_type", opts.type);
  const { data, error } = await query.order("position");
  if (error) throw new Error(error.message);
  return (data ?? []) as DiscoveryRow[];
}

async function categoriesForQuery(
  supabase: SupabaseClient<any>,
  type: ContentType,
  contentId: string,
): Promise<CategoryRow[]> {
  const { data, error } = await supabase
    .from("content_categories")
    .select("categories(id, slug, name, description, icon, image_path, is_active, kind, sort_order, parent_id)")
    .eq("content_type", type)
    .eq("content_id", contentId)
    .order("position");
  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((row: any) => (Array.isArray(row.categories) ? row.categories[0] : row.categories))
    .filter(Boolean) as CategoryRow[];
}

async function childrenForGuardianQuery(
  supabase: SupabaseClient<any>,
  guardianId: string,
): Promise<FamilyChild[]> {
  const { data, error } = await supabase
    .from("child_guardians")
    .select("child_profile_id, child_profiles!inner(id, nickname, avatar_url, auth_user_id, birthdate)")
    .eq("guardian_id", guardianId);
  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row: any) => {
      const profile = Array.isArray(row.child_profiles)
        ? row.child_profiles[0]
        : row.child_profiles;
      if (!profile) return null;
      return {
        id: profile.auth_user_id ?? profile.id,
        childProfileId: profile.id,
        email: profile.nickname ?? "Learner",
        avatarUrl: profile.avatar_url ?? null,
        birthdate: profile.birthdate ?? null,
      };
    })
    .filter((c): c is FamilyChild => Boolean(c));
}

async function childContextQuery(
  supabase: SupabaseClient<any>,
  opts: { profileId?: string | null; userId?: string | null; anyId?: string | null },
): Promise<ChildProfileRow | null> {
  let query: any = supabase
    .from("child_profiles")
    .select("id, nickname, avatar_url, auth_user_id, birthdate, active");
  if (opts.anyId) query = query.or(`id.eq.${opts.anyId},auth_user_id.eq.${opts.anyId}`);
  else if (opts.profileId) query = query.eq("id", opts.profileId);
  else if (opts.userId) query = query.eq("auth_user_id", opts.userId);
  else return null;
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ChildProfileRow | null) ?? null;
}

function forbidden(): never {
  throw new Error("Forbidden scope");
}

/**
 * User-scoped repository. Every method is bound to the session context and
 * can only reach data that context is entitled to. Queries run on the
 * request-scoped server client (RLS enforced) or, where a privileged write
 * is unavoidable, are hard-scoped to ctx.userId.
 */
class UserDatabase {
  constructor(private ctx: SessionContext) {}

  // database.types.ts is stale (missing child_* tables) — widen to the
  // untyped client here; the facade's method signatures provide the contract.
  private client(): SupabaseClient {
    return createServerClient() as SupabaseClient;
  }

  private get isAdmin() {
    return this.ctx.role === "admin";
  }

  family = {
    childrenForGuardian: (guardianId: string): Promise<FamilyChild[]> => {
      if (!this.isAdmin && guardianId !== this.ctx.userId) forbidden();
      return childrenForGuardianQuery(this.client(), guardianId);
    },

    isGuardianOf: async (childProfileId: string): Promise<boolean> => {
      if (this.isAdmin) return true;
      const { data } = await this.client()
        .from("child_guardians")
        .select("child_profile_id")
        .eq("guardian_id", this.ctx.userId)
        .eq("child_profile_id", childProfileId)
        .maybeSingle();
      return Boolean(data);
    },

    childContext: (opts: {
      profileId?: string | null;
      userId?: string | null;
      anyId?: string | null;
    }): Promise<ChildProfileRow | null> => {
      if (opts.userId && !this.isAdmin && opts.userId !== this.ctx.userId) {
        forbidden();
      }
      // profileId lookups rely on RLS (guardians see own children only).
      return childContextQuery(this.client(), opts);
    },
  };

  children = {
    // Security-definer RPC enforces is_admin() or is_guardian_of(p_child) at
    // the DB and resets attempts/lockout atomically — works for parents and
    // admins under their own JWT, no service key involved.
    setPin: async (childProfileId: string, pinHash: string, pinLength: number) => {
      const { error } = await this.client().rpc("set_child_pin", {
        p_child: childProfileId,
        p_pin_hash: pinHash,
        p_pin_length: pinLength,
      });
      if (error) throw new Error(error.message);
    },
  };

  catalog = {
    categories: (): Promise<CategoryRow[]> => categoriesQuery(this.client()),
    content: (opts?: { categoryId?: string | null; type?: ContentType | null }) =>
      discoveryQuery(this.client(), opts),
    categoriesFor: (type: ContentType, contentId: string) =>
      categoriesForQuery(this.client(), type, contentId),

    // Security-definer RPCs: DB enforces is_admin() or, for lessons,
    // owner_id = auth.uid() — lesson authors categorize their own work
    // under their own JWT, no service key involved.
    categorize: async (type: ContentType, contentId: string, categoryId: string, position = 0) => {
      const { error } = await this.client().rpc("categorize_content", {
        p_type: type,
        p_content: contentId,
        p_category: categoryId,
        p_position: position,
      });
      if (error) throw new Error(error.message);
    },

    uncategorize: async (type: ContentType, contentId: string, categoryId: string) => {
      const { error } = await this.client().rpc("uncategorize_content", {
        p_type: type,
        p_content: contentId,
        p_category: categoryId,
      });
      if (error) throw new Error(error.message);
    },
  };

  settings = {
    get: async (): Promise<Record<string, unknown>> => {
      const { data, error } = await this.client()
        .from("profiles")
        .select("settings")
        .eq("id", this.ctx.userId)
        .single();
      if (error) throw new Error(error.message);
      return ((data as any)?.settings as Record<string, unknown>) ?? {};
    },

    update: async (patch: Record<string, unknown>) => {
      const settings = { ...(await this.settings.get()), ...patch };
      const { error } = await this.client()
        .from("profiles")
        .update({ settings } as any)
        .eq("id", this.ctx.userId);
      if (error) throw new Error(error.message);
      return settings;
    },
  };
}

/**
 * Service repository — bypasses RLS. Only for admin impersonation views and
 * system jobs; never expose directly from a request handler without an
 * explicit admin check upstream.
 */
class ServiceDatabase {
  private client(): SupabaseClient {
    return createServiceClient() as SupabaseClient;
  }

  family = {
    childrenForGuardian: (guardianId: string) =>
      childrenForGuardianQuery(this.client(), guardianId),
    childContext: (opts: {
      profileId?: string | null;
      userId?: string | null;
      anyId?: string | null;
    }) => childContextQuery(this.client(), opts),
  };

  children = {
    updateProfile: async (
      childProfileId: string,
      patch: { nickname?: string | null; birthdate?: string | null; avatar_url?: string | null; active?: boolean },
    ) => {
      const { error } = await this.client()
        .from("child_profiles")
        .update(patch as any)
        .eq("id", childProfileId);
      if (error) throw new Error(error.message);
    },
  };

  catalog = {
    categories: (): Promise<CategoryRow[]> => categoriesQuery(this.client()),
    content: (opts?: { categoryId?: string | null; type?: ContentType | null }) =>
      discoveryQuery(this.client(), opts),
    categoriesFor: (type: ContentType, contentId: string) =>
      categoriesForQuery(this.client(), type, contentId),

    // Direct writes — RLS bypass. Upstream handler must have already
    // established admin (the categorize RPC can't be used under the service
    // key: it checks auth.uid(), which is null there).
    categorize: async (type: ContentType, contentId: string, categoryId: string, position = 0) => {
      const { error } = await this.client()
        .from("content_categories")
        .upsert(
          { content_type: type, content_id: contentId, category_id: categoryId, position },
          { onConflict: "content_type,content_id,category_id" },
        );
      if (error) throw new Error(error.message);
    },

    uncategorize: async (type: ContentType, contentId: string, categoryId: string) => {
      const { error } = await this.client()
        .from("content_categories")
        .delete()
        .eq("content_type", type)
        .eq("content_id", contentId)
        .eq("category_id", categoryId);
      if (error) throw new Error(error.message);
    },

    upsertCategory: async (row: Partial<CategoryRow> & { slug: string; name: string }) => {
      const { error } = await this.client()
        .from("categories")
        .upsert(row as any, { onConflict: "slug" });
      if (error) throw new Error(error.message);
    },

    deleteCategory: async (id: string) => {
      const { error } = await this.client().from("categories").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
  };
}

/**
 * Public read-only repository for catalog surfaces. Everything it reads is
 * already public under RLS (categories, content_categories, the discovery
 * view) — it exists so public/server pages don't need a session context.
 */
class PublicDatabase {
  private client(): SupabaseClient {
    return createServerClient() as SupabaseClient;
  }

  categories(): Promise<CategoryRow[]> {
    return categoriesQuery(this.client());
  }
  content(opts?: { categoryId?: string | null; type?: DiscoveryRow["content_type"] | null }) {
    return discoveryQuery(this.client(), opts);
  }
  categoriesFor(type: ContentType, contentId: string) {
    return categoriesForQuery(this.client(), type, contentId);
  }
}

/**
 * Singleton entry point. Obtain a scoped repository per request:
 *   db.user({ userId, role })  — RLS-enforced, scope-checked
 *   db.service()               — privileged, admin paths only
 *   db.catalog()               — public read-only catalog queries
 */
class ServerDatabase {
  user(ctx: SessionContext) {
    return new UserDatabase(ctx);
  }
  service() {
    return new ServiceDatabase();
  }
  catalog() {
    return new PublicDatabase();
  }
}

export const db = new ServerDatabase();

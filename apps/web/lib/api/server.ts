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

// ── S4.1 shared query helpers ─────────────────────────────────────

export type PackRow = {
  id: string;
  slug: string | null;
  title: string;
  title_i18n?: Record<string, string> | null;
  description_i18n?: Record<string, string> | null;
  cover_path?: string | null;
  is_free?: boolean | null;
  age_band?: string | null;
  rating_avg?: number | null;
  rating_count?: number | null;
  status?: string | null;
  owner_id?: string | null;
};

export type TemplateRow = {
  id: string;
  title: string;
  image_path: string;
  is_free?: boolean | null;
  tags?: string[] | null;
  rating_avg?: number | null;
  rating_count?: number | null;
  pack_id?: string | null;
  guide?: unknown;
};

async function packsQuery(
  supabase: SupabaseClient<any>,
  opts: { columns?: string; order?: string; status?: string } = {},
): Promise<PackRow[]> {
  let q = supabase
    .from("packs")
    .select(
      opts.columns ??
        "id, slug, title, title_i18n, description_i18n, cover_path, is_free, age_band, rating_avg, rating_count, status, owner_id",
    )
    .order(opts.order ?? "created_at", { ascending: false });
  if (opts.status) q = q.eq("status", opts.status);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as PackRow[];
}

async function packByIdQuery(supabase: SupabaseClient<any>, id: string): Promise<PackRow | null> {
  const { data, error } = await supabase.from("packs").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as PackRow | null) ?? null;
}

async function packBySlugQuery(supabase: SupabaseClient<any>, slug: string): Promise<PackRow | null> {
  const { data, error } = await supabase.from("packs").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as PackRow | null) ?? null;
}

async function packsByIdsQuery(
  supabase: SupabaseClient<any>,
  ids: string[],
  columns?: string,
): Promise<PackRow[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("packs").select(columns ?? "*").in("id", ids);
  if (error) throw new Error(error.message);
  return (data ?? []) as PackRow[];
}

async function packItemsQuery(
  supabase: SupabaseClient<any>,
  packId: string,
  kind?: string,
): Promise<any[]> {
  let q = supabase.from("pack_items").select("*").eq("pack_id", packId);
  if (kind) q = q.eq("kind", kind);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as any[];
}

async function templatesQuery(
  supabase: SupabaseClient<any>,
  opts: { freeOnly?: boolean; packId?: string; ids?: string[]; columns?: string } = {},
): Promise<TemplateRow[]> {
  if (opts.ids && opts.ids.length === 0) return [];
  let q = supabase
    .from("templates")
    .select(opts.columns ?? "*")
    .order("created_at", { ascending: false });
  if (opts.freeOnly) q = q.eq("is_free", true);
  if (opts.packId) q = q.eq("pack_id", opts.packId);
  if (opts.ids?.length) q = q.in("id", opts.ids);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as TemplateRow[];
}

async function carouselsByIdsQuery(supabase: SupabaseClient<any>, ids: string[]): Promise<any[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("carousels").select("id, title").in("id", ids);
  if (error) throw new Error(error.message);
  return (data ?? []) as any[];
}

async function lessonByIdQuery(supabase: SupabaseClient<any>, id: string) {
  const { data, error } = await supabase
    .from("lessons")
    .select("id, title, est_minutes, coloring_template_id")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}

async function lessonStepsQuery(supabase: SupabaseClient<any>, lessonId: string) {
  const { data, error } = await supabase
    .from("lesson_steps")
    .select("id, order_index, type, title, guide, rubric, hints")
    .eq("lesson_id", lessonId)
    .order("order_index");
  if (error) throw new Error(error.message);
  return (data ?? []) as any[];
}

async function packSlugForLessonQuery(supabase: SupabaseClient<any>, lessonId: string) {
  const { data: item } = await supabase
    .from("pack_items")
    .select("pack_id")
    .eq("kind", "lesson")
    .eq("ref_id", lessonId)
    .limit(1)
    .maybeSingle();
  if (!item) return null;
  const { data: pack } = await supabase
    .from("packs")
    .select("slug")
    .eq("id", item.pack_id as string)
    .maybeSingle();
  return ((pack?.slug as string | undefined) ?? null);
}

function storageUrl(supabase: SupabaseClient<any>, bucket: string, path: string | null | undefined) {
  if (!path) return null;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
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

    packs: (opts?: { columns?: string; order?: string; status?: string }) =>
      packsQuery(this.client(), opts),
    packById: (id: string) => packByIdQuery(this.client(), id),
    packBySlug: (slug: string) => packBySlugQuery(this.client(), slug),
    packsByIds: (ids: string[], columns?: string) => packsByIdsQuery(this.client(), ids, columns),
    packItems: (packId: string, kind?: string) => packItemsQuery(this.client(), packId, kind),
    templates: (opts?: { freeOnly?: boolean; packId?: string; ids?: string[]; columns?: string }) =>
      templatesQuery(this.client(), opts),
    carouselsByIds: (ids: string[]) => carouselsByIdsQuery(this.client(), ids),
    lessonById: (id: string) => lessonByIdQuery(this.client(), id),
    lessonSteps: (lessonId: string) => lessonStepsQuery(this.client(), lessonId),
    packSlugForLesson: (lessonId: string) => packSlugForLessonQuery(this.client(), lessonId),
    packCoverUrl: (path: string | null | undefined) => storageUrl(this.client(), "packs", path),
    templateImageUrl: (path: string | null | undefined) =>
      storageUrl(this.client(), "templates", path),
    storageUrl: (bucket: string, path: string | null | undefined) =>
      storageUrl(this.client(), bucket, path),

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

  library = {
    favorites: async (entityType?: string) => {
      let q = this.client()
        .from("user_favorites")
        .select("entity_type, entity_id")
        .eq("user_id", this.ctx.userId);
      if (entityType) q = q.eq("entity_type", entityType);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return (data ?? []) as Array<{ entity_type: string; entity_id: string }>;
    },

    artworksForUser: async (userId?: string) => {
      const target = userId ?? this.ctx.userId;
      if (!this.isAdmin && target !== this.ctx.userId) forbidden();
      const { data, error } = await this.client()
        .from("artworks")
        .select("id, title, image_url, thumbnail_url, like_count, created_at, child_profile_id")
        .eq("user_id", target)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as any[];
    },
  };

  assignments = {
    assignPack: async (childId: string, packId: string) => {
      const { error } = await this.client()
        .from("child_pack_assignments")
        .insert({ child_id: childId, pack_id: packId });
      if (error) throw new Error(error.message);
    },
    assignTemplate: async (childId: string, storageRef: string) => {
      const { error } = await this.client()
        .from("child_template_assignments")
        .insert({ child_id: childId, storage_ref: storageRef });
      if (error) throw new Error(error.message);
    },
    countsForProfiles: async (profileIds: string[]) => {
      if (profileIds.length === 0) return { packs: 0, lessons: 0, artworks: 0, packRows: [] as any[] };
      const client = this.client();
      const [packs, lessons, artworks, packRows] = await Promise.all([
        client.from("child_pack_assignments").select("*", { count: "exact", head: true }).in("child_profile_id", profileIds),
        client.from("user_lesson_progress").select("*", { count: "exact", head: true }).in("child_profile_id", profileIds),
        client.from("artworks").select("*", { count: "exact", head: true }).in("child_profile_id", profileIds),
        client.from("child_pack_assignments").select("child_profile_id").in("child_profile_id", profileIds),
      ]);
      return {
        packs: packs.count ?? 0,
        lessons: lessons.count ?? 0,
        artworks: artworks.count ?? 0,
        packRows: (packRows.data ?? []) as any[],
      };
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

    packs: (opts?: { columns?: string; order?: string; status?: string }) =>
      packsQuery(this.client(), opts),
    packById: (id: string) => packByIdQuery(this.client(), id),
    packBySlug: (slug: string) => packBySlugQuery(this.client(), slug),
    packsByIds: (ids: string[], columns?: string) => packsByIdsQuery(this.client(), ids, columns),
    packItems: (packId: string, kind?: string) => packItemsQuery(this.client(), packId, kind),
    templates: (opts?: { freeOnly?: boolean; packId?: string; ids?: string[]; columns?: string }) =>
      templatesQuery(this.client(), opts),
    carouselsByIds: (ids: string[]) => carouselsByIdsQuery(this.client(), ids),
    lessonById: (id: string) => lessonByIdQuery(this.client(), id),
    lessonSteps: (lessonId: string) => lessonStepsQuery(this.client(), lessonId),
    packSlugForLesson: (lessonId: string) => packSlugForLessonQuery(this.client(), lessonId),
    packCoverUrl: (path: string | null | undefined) => storageUrl(this.client(), "packs", path),
    templateImageUrl: (path: string | null | undefined) =>
      storageUrl(this.client(), "templates", path),
    storageUrl: (bucket: string, path: string | null | undefined) =>
      storageUrl(this.client(), bucket, path),

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
  packs(opts?: { columns?: string; order?: string; status?: string }) {
    return packsQuery(this.client(), opts);
  }
  packById(id: string) {
    return packByIdQuery(this.client(), id);
  }
  packBySlug(slug: string) {
    return packBySlugQuery(this.client(), slug);
  }
  packsByIds(ids: string[], columns?: string) {
    return packsByIdsQuery(this.client(), ids, columns);
  }
  packItems(packId: string, kind?: string) {
    return packItemsQuery(this.client(), packId, kind);
  }
  templates(opts?: { freeOnly?: boolean; packId?: string; ids?: string[]; columns?: string } = {}) {
    return templatesQuery(this.client(), opts);
  }
  carouselsByIds(ids: string[]) {
    return carouselsByIdsQuery(this.client(), ids);
  }
  lessonById(id: string) {
    return lessonByIdQuery(this.client(), id);
  }
  lessonSteps(lessonId: string) {
    return lessonStepsQuery(this.client(), lessonId);
  }
  packSlugForLesson(lessonId: string) {
    return packSlugForLessonQuery(this.client(), lessonId);
  }
  packCoverUrl(path: string | null | undefined) {
    return storageUrl(this.client(), "packs", path);
  }
  templateImageUrl(path: string | null | undefined) {
    return storageUrl(this.client(), "templates", path);
  }
  storageUrl(bucket: string, path: string | null | undefined) {
    return storageUrl(this.client(), bucket, path);
  }
}

/**
 * Singleton entry point. Obtain a scoped repository per request:
 *   db.user({ userId, role })  — RLS-enforced, scope-checked
 *   db.service()               — privileged, admin paths only
 *   db.catalog()               — public read-only catalog queries
 */
class ServerDatabase {
  /** Auth/session reads — not table access, but kept behind the facade so
   *  views never touch a Supabase client directly. */
  auth() {
    const supabase = createServerClient();
    return {
      session: async () => (await supabase.auth.getSession()).data.session,
      user: async () => (await supabase.auth.getUser()).data.user,
    };
  }
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

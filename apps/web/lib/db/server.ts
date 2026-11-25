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

async function childrenForGuardianQuery(
  supabase: SupabaseClient<any>,
  guardianId: string,
): Promise<FamilyChild[]> {
  const { data, error } = await supabase
    .from("child_guardians")
    .select("child_profile_id, child_profiles!inner(id, nickname, avatar_url, auth_user_id, birthdate)")
    .eq("guardian_id", guardianId);
  if (error) throw error;

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
  if (error) throw error;
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
      if (error) throw error;
    },
  };

  settings = {
    get: async (): Promise<Record<string, unknown>> => {
      const { data, error } = await this.client()
        .from("profiles")
        .select("settings")
        .eq("id", this.ctx.userId)
        .single();
      if (error) throw error;
      return ((data as any)?.settings as Record<string, unknown>) ?? {};
    },

    update: async (patch: Record<string, unknown>) => {
      const settings = { ...(await this.settings.get()), ...patch };
      const { error } = await this.client()
        .from("profiles")
        .update({ settings } as any)
        .eq("id", this.ctx.userId);
      if (error) throw error;
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
      if (error) throw error;
    },
  };
}

/**
 * Singleton entry point. Obtain a scoped repository per request:
 *   db.user({ userId, role })  — RLS-enforced, scope-checked
 *   db.service()               — privileged, admin paths only
 */
class ServerDatabase {
  user(ctx: SessionContext) {
    return new UserDatabase(ctx);
  }
  service() {
    return new ServiceDatabase();
  }
}

export const db = new ServerDatabase();

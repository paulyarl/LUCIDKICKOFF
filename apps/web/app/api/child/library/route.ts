import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireApiUser } from "@/lib/auth/api-auth";
import { db } from "@/lib/db/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyImpersonation, IMPERSONATION_COOKIE } from "@/lib/auth/impersonation";

// Returns the resolved child's assigned packs, assigned templates, and
// artworks. Works for real child sessions (own auth uid) and impersonated
// views (admin or guardian viewing as a child).
export async function GET() {
  try {
    const auth = await requireApiUser();
    if (auth instanceof NextResponse) return auth;

    const cookieStore = await cookies();
    const payload = verifyImpersonation(cookieStore.get(IMPERSONATION_COOKIE)?.value);
    const isAdminImpersonation = !!payload?.admin;

    const profile = payload?.profileId
      ? await (isAdminImpersonation
          ? db.service()
          : db.user({ userId: auth.userId, role: auth.role })
        ).family.childContext({ profileId: payload.profileId })
      : payload?.admin && payload.userId
        ? await db.service().family.childContext({ userId: payload.userId })
        : await db
            .user({ userId: auth.userId, role: auth.role })
            .family.childContext({ userId: auth.userId });

    if (!profile) {
      return NextResponse.json({ child: null, packs: [], templates: [], artworks: [] });
    }

    const child = {
      id: profile.id,
      nickname: profile.nickname,
      avatarUrl: profile.avatar_url ?? null,
      authUserId: profile.auth_user_id ?? null,
    };

    const childUid = profile.auth_user_id;
    if (!childUid) {
      return NextResponse.json({ child, packs: [], templates: [], artworks: [] });
    }

    // Pick the read client: own session -> RLS; admin impersonation -> service;
    // guardian impersonation -> verify guardianship, then service (the
    // assignment tables' parent policies predate child_profiles).
    let client: any = auth.supabase;
    if (isAdminImpersonation) {
      client = createServiceClient();
    } else if (payload && childUid !== auth.userId) {
      const { data: isGuardian } = await (auth.supabase as any).rpc("is_guardian_of", {
        p_child: profile.id,
      });
      if (!isGuardian) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
      client = createServiceClient();
    }

    const [packRes, tplAssignRes, artRes] = await Promise.all([
      client
        .from("child_pack_assignments")
        .select("pack_id, packs(id, slug, title, cover_path, is_free)")
        .eq("child_id", childUid),
      client
        .from("child_template_assignments")
        .select("storage_ref")
        .eq("child_id", childUid),
      client
        .from("artworks")
        .select("id, title, image_url, thumbnail_url, created_at, like_count")
        .eq("user_id", childUid)
        .order("created_at", { ascending: false }),
    ]);

    const refs = ((tplAssignRes.data ?? []) as { storage_ref: string | null }[])
      .map((r) => r.storage_ref)
      .filter((r): r is string => !!r);

    let templates: { id: string; title: string; image_path: string }[] = [];
    if (refs.length > 0) {
      const { data } = await client
        .from("templates")
        .select("id, title, image_path")
        .in("image_path", refs);
      templates = (data ?? []) as typeof templates;
    }

    const packs = ((packRes.data ?? []) as { packs: unknown }[])
      .map((r) => r.packs)
      .filter(Boolean);

    return NextResponse.json({
      child,
      packs,
      templates,
      artworks: artRes.data ?? [],
    });
  } catch (error) {
    const message =
      (error as { message?: string } | null)?.message ?? "Child library failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

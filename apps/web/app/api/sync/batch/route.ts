import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireApiUser } from "@/lib/auth/api-auth";
import { resolveEffectiveChild } from "@/lib/learn/learner";
import { evaluateBadges } from "@/lib/learn/badges";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * S3.3 — idempotent outbox ingest. The client drains its IndexedDB outbox
 * here in batches; each op carries a client-generated opId recorded in
 * sync_operations so replays are reported as duplicates, never re-applied.
 *
 * D32: ops are rejected when no guardian holds a non-withdrawn cloud_sync
 * consent for the learner (has_sync_consent RPC).
 */

const SUPPORTED_VERSION = 1;
const MAX_OPS = 50;

type OpResult = {
  opId: string;
  status: "applied" | "duplicate" | "rejected" | "error";
  reason?: string;
  serverUpdatedAt?: string;
};

export async function POST(req: Request) {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  const ops: unknown[] = Array.isArray(body?.ops) ? body.ops : [];
  if (ops.length === 0 || ops.length > MAX_OPS) {
    return NextResponse.json({ error: "ops must be a non-empty array (max 50)" }, { status: 400 });
  }

  const child = await resolveEffectiveChild(auth.userId);

  // D32 — no cloud-sync consent, nothing lands. Ops are reported rejected so
  // the client can stop retrying them (consent can be granted later).
  const { data: consent, error: consentError } = await auth.supabase.rpc("has_sync_consent", {
    p_child: child.childProfileId,
  });
  if (consentError) {
    return NextResponse.json({ error: consentError.message }, { status: 500 });
  }
  if (!consent) {
    return NextResponse.json({
      results: ops.map((op: any) => ({
        opId: typeof op?.opId === "string" ? op.opId : "",
        status: "rejected",
        reason: "no_sync_consent",
      })),
    });
  }

  const results: OpResult[] = [];
  for (const op of ops as any[]) {
    const opId = typeof op?.opId === "string" ? op.opId : "";
    const type = typeof op?.type === "string" ? op.type : "";
    const version = typeof op?.payloadVersion === "number" ? op.payloadVersion : 1;
    if (!opId || !type) {
      results.push({ opId, status: "rejected", reason: "malformed_op" });
      continue;
    }
    if (version > SUPPORTED_VERSION) {
      results.push({ opId, status: "rejected", reason: "unsupported_payload_version" });
      continue;
    }

    // Apply first, then record the claim. Op application is merge-idempotent,
    // so a crash between apply and claim is safe: the client's retry re-applies
    // (no-op merge) and then claims. A 23505 on the claim means an earlier batch
    // already applied this opId — report duplicate, never re-applied.
    const applied = await applyOp(auth.supabase, auth.userId, child.childProfileId, type, op?.payload);
    if (applied.error) {
      results.push({
        opId,
        status: applied.error.startsWith("unknown_type") || applied.error === "artwork_conflict" ? "rejected" : "error",
        reason: applied.error,
        ...(applied.serverUpdatedAt ? { serverUpdatedAt: applied.serverUpdatedAt } : {}),
      });
      continue;
    }

    const { error: claimError } = await auth.supabase.from("sync_operations").insert({
      user_id: auth.userId,
      op_id: opId,
      type,
      payload_version: version,
      payload: op?.payload ?? {},
      child_profile_id: child.childProfileId,
    });
    results.push(
      claimError?.code === "23505"
        ? { opId, status: "duplicate" }
        : claimError
          ? { opId, status: "error", reason: claimError.message }
          : { opId, status: "applied" },
    );
  }

  return NextResponse.json({ results });
}

/** Apply one op to its target table. Returns an error message or null. */
async function applyOp(
  supabase: SupabaseClient,
  userId: string,
  childProfileId: string | null,
  type: string,
  payload: any,
): Promise<{ error: string | null; serverUpdatedAt?: string }> {
  switch (type) {
    case "lesson_progress":
      return { error: await applyLessonProgress(supabase, userId, childProfileId, payload) };
    case "artwork":
      return applyArtwork(userId, childProfileId, payload);
    default:
      return { error: `unknown_type:${type}` };
  }
}

/**
 * Artwork sync (S3.4) — upload the queued canvas save to the `drawings`
 * bucket under a deterministic key. Replays of the same op are no-ops
 * (identical JSON = already applied); the same key with different content
 * is a real conflict the client resolves via "keep both".
 */
async function applyArtwork(
  userId: string,
  childProfileId: string | null,
  payload: any,
): Promise<{ error: string | null; serverUpdatedAt?: string }> {
  const key = payload?.key;
  const json = payload?.json;
  const pngDataUrl = payload?.pngDataUrl;
  if (typeof key !== "string" || !/^[a-zA-Z0-9._-]+$/.test(key) || json == null) {
    return { error: "invalid_artwork_payload" };
  }

  const svc = createServiceClient();
  const jsonPath = `${userId}/${key}.json`;
  const pngPath = `${userId}/${key}.png`;
  const jsonBody = JSON.stringify({ ...json, childProfileId: childProfileId ?? null });

  // Check for an existing version of this key
  const { data: existing } = await svc.storage
    .from("drawings")
    .list(userId, { search: `${key}.json`, limit: 1 });
  const existingMeta = existing?.find((f) => f.name === `${key}.json`);

  if (existingMeta) {
    const { data: current } = await svc.storage.from("drawings").download(jsonPath);
    const currentText = current ? await current.text() : null;
    if (currentText !== null && currentText !== jsonBody) {
      return {
        error: "artwork_conflict",
        serverUpdatedAt: existingMeta.updated_at ?? undefined,
      };
    }
    // Identical replay — ensure the PNG landed too, then we're done.
  }

  if (!existingMeta) {
    const { error } = await svc.storage
      .from("drawings")
      .upload(jsonPath, new Blob([jsonBody], { type: "application/json" }), { upsert: false });
    if (error) return { error: `json_upload:${error.message}` };
  }

  if (typeof pngDataUrl === "string" && pngDataUrl.startsWith("data:image/")) {
    const mime = pngDataUrl.slice(5, pngDataUrl.indexOf(";"));
    const bytes = Buffer.from(pngDataUrl.slice(pngDataUrl.indexOf(",") + 1), "base64");
    const { data: existingPng } = await svc.storage
      .from("drawings")
      .list(userId, { search: `${key}.png`, limit: 1 });
    if (!existingPng?.length) {
      const { error } = await svc.storage
        .from("drawings")
        .upload(pngPath, new Blob([bytes], { type: mime }), { upsert: false });
      if (error) return { error: `png_upload:${error.message}` };
    }
  }

  return { error: null };
}

async function applyLessonProgress(
  supabase: SupabaseClient,
  userId: string,
  childProfileId: string | null,
  payload: any,
): Promise<string | null> {
  const lessonId = payload?.lessonId;
  const stepIndex = payload?.stepIndex;
  const stars = payload?.stars;
  const passedSteps = payload?.passedSteps;
  if (
    typeof lessonId !== "string" ||
    typeof stepIndex !== "number" ||
    typeof stars !== "number" ||
    typeof passedSteps !== "number"
  ) {
    return "invalid_lesson_progress_payload";
  }

  // Merge with max semantics — replayed/out-of-order ops never regress progress.
  let query = supabase
    .from("user_lesson_progress")
    .select("id, step_index, stars, passed_steps")
    .eq("lesson_id", lessonId);
  query = childProfileId
    ? query.eq("child_profile_id", childProfileId)
    : query.eq("user_id", userId).is("child_profile_id", null);
  const { data: existing } = await query.maybeSingle();

  const fields = {
    step_index: Math.max(stepIndex, (existing?.step_index as number) ?? 0),
    stars: Math.max(stars, (existing?.stars as number) ?? 0),
    passed_steps: Math.max(passedSteps, (existing?.passed_steps as number) ?? 0),
    updated_at: new Date().toISOString(),
  };

  const result = existing
    ? await supabase.from("user_lesson_progress").update(fields).eq("id", existing.id)
    : await supabase
        .from("user_lesson_progress")
        .insert({ user_id: userId, child_profile_id: childProfileId, lesson_id: lessonId, ...fields });

  if (result.error) return result.error.message;

  try {
    await evaluateBadges(supabase, { childProfileId, userId }, lessonId);
  } catch {
    // badge evaluation is best-effort
  }
  return null;
}

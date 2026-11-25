import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import { createServiceClient } from "@/lib/supabase/service";

const AGE_BANDS = new Set(["4-6", "7-9", "10-12", "all"]);
const COVER_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_COVER_SIZE = 2 * 1024 * 1024;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: Request) {
  const auth = await requireApiUser(["parent", "admin"]);
  if (auth instanceof NextResponse) return auth;

  let title = "";
  let requestedSlug = "";
  let description = "";
  let categoryId = "";
  let ageBand = "all";
  let isFree = true;
  let initialLessonId = "";
  let coverFile: File | null = null;

  if ((req.headers.get("content-type") ?? "").includes("multipart/form-data")) {
    const form = await req.formData().catch(() => null);
    if (!form) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    title = textValue(form.get("title"));
    requestedSlug = textValue(form.get("slug"));
    description = textValue(form.get("description"));
    categoryId = textValue(form.get("category_id"));
    ageBand = textValue(form.get("age_band")) || "all";
    isFree = form.get("is_free") !== "false";
    initialLessonId = textValue(form.get("lesson_id"));
    const cover = form.get("cover");
    coverFile = cover && typeof cover !== "string" && cover.size > 0 ? cover : null;
  } else {
    const body = await req.json().catch(() => null);
    title = textValue(body?.title);
    requestedSlug = textValue(body?.slug);
    description = textValue(body?.description);
    categoryId = textValue(body?.category_id);
    ageBand = textValue(body?.age_band) || "all";
    isFree = typeof body?.is_free === "boolean" ? body.is_free : true;
    initialLessonId = textValue(body?.lesson_id);
  }

  const baseSlug = slugify(requestedSlug || title);
  const slug = requestedSlug
    ? baseSlug
    : `${baseSlug.slice(0, 70)}-${crypto.randomUUID().slice(0, 8)}`;

  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
  if (!baseSlug) {
    return NextResponse.json({ error: "slug must use lowercase letters, numbers, and hyphens" }, { status: 400 });
  }
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return NextResponse.json({ error: "slug must use lowercase letters, numbers, and hyphens" }, { status: 400 });
  }
  if (!AGE_BANDS.has(ageBand)) {
    return NextResponse.json({ error: "invalid age_band" }, { status: 400 });
  }
  if (categoryId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId)) {
    return NextResponse.json({ error: "invalid category_id" }, { status: 400 });
  }
  if (coverFile && !COVER_TYPES.has(coverFile.type)) {
    return NextResponse.json({ error: "Cover must be a PNG, JPEG, or WebP image" }, { status: 400 });
  }
  if (coverFile && coverFile.size > MAX_COVER_SIZE) {
    return NextResponse.json({ error: "Cover must be 2 MB or smaller" }, { status: 400 });
  }

  const supabase = createServiceClient();
  let coverPath: string | null = null;

  if (categoryId) {
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("id")
      .eq("id", categoryId)
      .eq("is_active", true)
      .eq("kind", "subject")
      .maybeSingle();

    if (categoryError || !category) {
      return NextResponse.json({ error: "Selected category is not available" }, { status: 400 });
    }
  }

  if (initialLessonId) {
    const { data: lesson } = await supabase
      .from("lessons")
      .select("id, owner_id, status, visibility")
      .eq("id", initialLessonId)
      .maybeSingle();

    const row = lesson as { owner_id?: string | null; status?: string; visibility?: string } | null;
    const canUseLesson = Boolean(
      row &&
        (auth.role === "admin" ||
          row.owner_id === auth.userId ||
          (row.status === "published" && row.visibility === "catalog")),
    );
    if (!canUseLesson) {
      return NextResponse.json({ error: "Selected lesson is not available" }, { status: 403 });
    }
  }

  if (coverFile) {
    const extension = coverFile.type === "image/png" ? "png" : coverFile.type === "image/webp" ? "webp" : "jpg";
    coverPath = `covers/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("packs")
      .upload(coverPath, await coverFile.arrayBuffer(), {
        contentType: coverFile.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from("packs")
    .insert({
      title,
      slug,
      cover_path: coverPath,
      is_free: isFree,
      age_band: ageBand,
      owner_id: auth.userId,
      status: "draft",
      visibility: "private",
      title_i18n: { en: title },
      description_i18n: description ? { en: description } : null,
    } as any)
    .select("id")
    .single();

  if (error) {
    if (coverPath) await supabase.storage.from("packs").remove([coverPath]);
    const duplicate = (error as { code?: string }).code === "23505";
    return NextResponse.json(
      { error: duplicate ? "A pack with this slug already exists" : error.message },
      { status: duplicate ? 409 : 400 },
    );
  }

  if (!data?.id) {
    if (coverPath) await supabase.storage.from("packs").remove([coverPath]);
    return NextResponse.json({ error: "Pack was not created" }, { status: 500 });
  }

  let lessonWarning: string | null = null;
  if (initialLessonId) {
    const { error: itemError } = await supabase.from("pack_items").insert({
      pack_id: data.id,
      kind: "lesson",
      ref_id: initialLessonId,
      position: 0,
    });
    if (itemError) lessonWarning = itemError.message;
  }

  let categoryWarning: string | null = null;
  if (categoryId) {
    const { error: categorizeError } = await supabase.from("content_categories").insert({
      content_type: "pack",
      content_id: data.id,
      category_id: categoryId,
      position: 0,
    });
    if (categorizeError) categoryWarning = categorizeError.message;
  }

  return NextResponse.json({ ok: true, id: data.id, categoryWarning, lessonWarning });
}

import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import { createServiceClient } from "@/lib/supabase/service";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ["image/png", "image/jpeg", "image/webp"];

export async function POST(req: Request) {
  const auth = await requireApiUser(["parent", "admin"]);
  if (auth instanceof NextResponse) return auth;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "file exceeds 10 MB" }, { status: 413 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "use PNG, JPEG or WebP" }, { status: 415 });
  }

  const ext = (file.name.split(".").pop() ?? "png").toLowerCase();
  const path = `${auth.userId}/${crypto.randomUUID()}.${ext}`;
  const supabase = createServiceClient();

  const { error } = await supabase.storage
    .from("lesson-media")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { data } = supabase.storage.from("lesson-media").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path });
}

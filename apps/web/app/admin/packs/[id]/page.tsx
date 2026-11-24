import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { PackBuilder } from "@/components/admin/PackBuilder";

export const dynamic = "force-dynamic";

export default async function AdminPackPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) redirect("/auth/login");

  const role = (session.user.app_metadata as any)?.role;
  if (role !== "admin") redirect("/");

  const { data: packData, error } = await supabase
    .from("packs")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !packData) notFound();
  const pack = packData as unknown as { id: string; title: string };

  const { data: itemData } = await supabase
    .from("pack_items")
    .select("*")
    .eq("pack_id", params.id)
    .eq("kind", "lesson")
    .order("position");

  const { data: lessonData } = await supabase
    .from("lessons")
    .select("*")
    .eq("status", "published")
    .order("title");

  const lessons = (lessonData ?? []) as unknown as { id: string; title: string }[];
  const titleById = new Map(lessons.map((lesson) => [lesson.id, lesson.title]));
  const items = ((itemData ?? []) as unknown as { ref_id: string; position: number | null }[]).map(
    (item) => ({
      ref_id: item.ref_id,
      title: titleById.get(item.ref_id) ?? item.ref_id,
      position: item.position ?? 0,
    }),
  );

  return (
    <main className="min-h-screen bg-brand-cream px-6 py-10 text-brand-navy">
      <div className="mx-auto max-w-4xl space-y-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Pack builder</h1>
          <p className="text-sm text-brand-navy/60">
            Add published lessons to “{pack.title}”. Order follows the list.
          </p>
        </div>
        <PackBuilder
          packId={pack.id}
          packTitle={pack.title}
          items={items}
          lessons={lessons.map((lesson) => ({ id: lesson.id, title: lesson.title }))}
        />
      </div>
    </main>
  );
}

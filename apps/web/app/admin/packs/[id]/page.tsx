import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { PackBuilder } from "@/components/admin/PackBuilder";
import { CategoryPicker } from "@/components/admin/CategoryPicker";
import { PackStatusControls } from "@/components/admin/PackStatusControls";
import { db } from "@/lib/db/server";

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
  const pack = packData as unknown as {
    id: string;
    title: string;
    status?: string;
    visibility?: string;
  };

  const { data: itemData } = await supabase
    .from("pack_items")
    .select("*")
    .eq("pack_id", params.id)
    .eq("kind", "lesson")
    .order("position");

  const { data: lessonData } = await supabase
    .from("lessons")
    .select("*")
    .order("title");

  const lessons = (lessonData ?? []) as unknown as {
    id: string;
    title: string;
    status: string;
    visibility: string;
  }[];
  const assigned = await db.service().catalog.categoriesFor("pack", params.id);
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Pack builder</h1>
            <p className="text-sm text-brand-navy/60">
              Add lessons to “{pack.title}”. Order follows the list.
            </p>
            <p className="mt-1 text-xs font-semibold text-brand-navy/50">
              Category and lesson changes save automatically.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/packs"
              className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-brand-navy shadow-soft hover:bg-brand-navy/5"
            >
              Done — Back to Packs
            </Link>
            <Link
              href={`/packs/${pack.id}`}
              className="rounded-xl bg-brand-teal px-4 py-2 text-sm font-bold text-white shadow-soft hover:bg-brand-teal/90"
            >
              View Pack
            </Link>
          </div>
        </div>
        <PackStatusControls
          packId={pack.id}
          status={pack.status ?? "published"}
          visibility={pack.visibility ?? "catalog"}
        />
        <CategoryPicker contentType="pack" contentId={pack.id} assigned={assigned} />
        <PackBuilder
          packId={pack.id}
          packTitle={pack.title}
          items={items}
          lessons={lessons.map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            status: lesson.status,
            visibility: lesson.visibility,
          }))}
        />
      </div>
    </main>
  );
}

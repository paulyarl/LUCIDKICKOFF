import { requireRole } from '@/lib/auth/requireRole';
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PackBuilder } from "@/components/admin/PackBuilder";
import { CategoryPicker } from "@/components/admin/CategoryPicker";
import { db } from "@/lib/api/server";

export const dynamic = "force-dynamic";

export default async function AuthorPackPage({ params }: { params: { id: string } }) {
  const { userId, role } = await requireRole(["parent", "admin"]);

  const packData = await db.catalog().packById(params.id);
  if (!packData) notFound();
  const pack = packData as unknown as {
    id: string;
    title: string;
    owner_id: string | null;
    status: string;
    visibility: string;
  };
  if (pack.owner_id !== userId && role !== "admin") notFound();

  const itemData = await db.catalog().packItems(params.id, 'lesson');

  const lessonData = await db.catalog().lessons({ columns: 'id, title, status, visibility, owner_id', order: 'title', ascending: true });

  const lessons = (lessonData ?? []) as unknown as {
    id: string;
    title: string;
    status: string;
    visibility: string;
  }[];
  const assigned = await db
    .user({ userId: userId, role: role ?? "user" })
    .catalog.categoriesFor("pack", params.id);
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
            <Link href="/author" className="text-xs font-bold text-brand-teal">
              ← Back to Author studio
            </Link>
            <h1 className="mt-2 font-heading text-2xl font-bold">Pack builder</h1>
            <p className="text-sm text-brand-navy/60">
              Add lessons to “{pack.title}” or create new lessons without leaving the pack.
            </p>
            <p className="mt-1 text-xs font-semibold text-brand-navy/50">
              {pack.status.replace("_", " ")} · {pack.visibility} · changes save automatically
            </p>
          </div>
          <Link
            href={`/packs/${pack.id}`}
            className="self-start rounded-xl bg-brand-teal px-4 py-2 text-sm font-bold text-white shadow-soft hover:bg-brand-teal/90"
          >
            View Pack
          </Link>
        </div>
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
          basePath="/author"
          backLabel="Done — Back to Author studio"
        />
      </div>
    </main>
  );
}

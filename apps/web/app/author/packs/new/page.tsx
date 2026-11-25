import { requireRole } from '@/lib/auth/requireRole';
import { db } from '@/lib/api/server';
import Link from "next/link";
import { redirect } from "next/navigation";
import { NewPackForm } from "@/components/admin/NewPackForm";

export const dynamic = "force-dynamic";

export default async function NewAuthorPackPage({
  searchParams,
}: {
  searchParams: { category?: string; lesson?: string };
}) {
  const { userId, role } = await requireRole(["parent", "admin"]);

  const categories = (await db.catalog().categories({ kind: 'subject', columns: 'id, slug, name' })) as { id: string; slug: string; name: string }[];

  let initialLessonTitle: string | undefined;
  if (searchParams.lesson) {
    const lesson = await db.catalog().lessonById(searchParams.lesson);
    initialLessonTitle = (lesson as { title?: string } | null)?.title;
  }

  return (
    <main className="min-h-screen bg-brand-cream px-6 py-10 text-brand-navy">
      <div className="mx-auto max-w-2xl space-y-4">
        <div>
          <Link href="/author" className="text-xs font-bold text-brand-teal">
            ← Back to Author studio
          </Link>
          <h1 className="mt-2 font-heading text-2xl font-bold">New pack</h1>
          <p className="text-sm text-brand-navy/60">
            Create a private draft pack, then add or create lessons in the pack builder.
          </p>
        </div>
        <NewPackForm
          key={`${searchParams.category ?? ""}:${searchParams.lesson ?? ""}`}
          categories={categories}
          initialCategorySlug={searchParams.category}
          initialLessonId={initialLessonTitle ? searchParams.lesson : undefined}
          initialLessonTitle={initialLessonTitle}
          basePath="/author/packs"
        />
      </div>
    </main>
  );
}

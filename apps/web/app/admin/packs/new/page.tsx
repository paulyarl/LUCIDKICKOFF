import { requireRole } from '@/lib/auth/requireRole';
import { db } from '@/lib/api/server';
import { redirect } from "next/navigation";
import { NewPackForm } from "@/components/admin/NewPackForm";

export const dynamic = "force-dynamic";

export default async function NewPackPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  await requireRole(["admin"]);

  const categories = (await db.catalog().categories({ kind: 'subject', columns: 'id, slug, name' })) as { id: string; slug: string; name: string }[];

  return (
    <main className="min-h-screen bg-brand-cream px-6 py-10 text-brand-navy">
      <div className="mx-auto max-w-2xl space-y-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">New pack</h1>
          <p className="text-sm text-brand-navy/60">
            Create the pack shell, optionally start with a category, then add or create lessons in the builder.
          </p>
        </div>
        <NewPackForm
          key={searchParams.category ?? ""}
          categories={categories}
          initialCategorySlug={searchParams.category}
        />
      </div>
    </main>
  );
}

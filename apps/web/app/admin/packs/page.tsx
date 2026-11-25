import { requireRole } from '@/lib/auth/requireRole';
import { db } from '@/lib/api/server';
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPacksPage() {
  await requireRole(["admin"]);

  const packs = (await db.catalog().packs({ columns: '*', order: 'title', ascending: true })) as unknown as {
    id: string;
    title: string;
    slug: string;
    status?: string;
    visibility?: string;
  }[];

  return (
    <main className="min-h-screen bg-brand-cream px-6 py-10 text-brand-navy">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Packs</h1>
            <p className="text-sm text-brand-navy/60">Assemble lessons into a pack.</p>
          </div>
          <Link
            href="/admin/packs/new"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-teal px-4 py-2 text-sm font-bold text-white shadow-soft hover:bg-brand-teal/90"
          >
            <Plus className="h-4 w-4" />
            New Pack
          </Link>
        </div>
        {packs.length === 0 ? (
          <p className="rounded-card bg-white p-6 text-sm text-brand-navy/50 shadow-soft">
            No packs yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {packs.map((pack) => (
              <li key={pack.id}>
                <Link
                  href={`/admin/packs/${pack.id}`}
                  className="flex items-center justify-between rounded-card bg-white p-4 shadow-soft hover:bg-brand-teal/5"
                >
                  <div>
                    <p className="font-heading text-sm font-bold">{pack.title}</p>
                    <p className="text-[11px] text-brand-navy/50">
                      {pack.slug}{pack.status ? ` · ${pack.status.replace("_", " ")}` : ""}{pack.visibility ? ` · ${pack.visibility}` : ""}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-brand-teal">Build</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

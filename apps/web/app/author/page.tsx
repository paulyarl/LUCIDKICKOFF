import { requireRole } from '@/lib/auth/requireRole';
import { db } from '@/lib/api/server';
import Link from "next/link";
import { redirect } from "next/navigation";
import { NewLessonForm } from "@/components/author/NewLessonForm";
import { LessonList } from "@/components/author/LessonList";
import { QuickPackForm } from "@/components/author/QuickPackForm";

export const dynamic = "force-dynamic";

type LessonRow = {
  id: string;
  title: string;
  status: string;
  visibility: string;
  updated_at: string | null;
};

type PackRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  visibility: string;
  owner_id: string | null;
};

type PackItemRow = {
  pack_id: string;
  ref_id: string;
};

export default async function AuthorPage() {
  const { userId, role } = await requireRole(["parent", "admin"]);

  let error: Error | null = null;
  let rows: LessonRow[] = [];
  try {
    rows = (await db.catalog().lessons({
      order: 'updated_at',
      ownerId: role === 'admin' ? undefined : userId,
    })) as unknown as LessonRow[];
  } catch (e: any) {
    error = e instanceof Error ? e : new Error('Failed to load lessons');
  }

  const packs = (await db.catalog().packs({
    columns: 'id, title, slug, status, visibility, owner_id, created_at',
    ownerId: role === 'admin' ? undefined : userId,
  })) as unknown as PackRow[];
  const packIds = packs.map((pack) => pack.id);

  const memberships: Record<string, string[]> = {};
  const lessonCounts: Record<string, number> = {};
  if (packIds.length > 0) {
    const itemData = await db.catalog().packLessonMembership(packIds);

    for (const item of (itemData ?? []) as unknown as PackItemRow[]) {
      memberships[item.ref_id] = [...(memberships[item.ref_id] ?? []), item.pack_id];
      lessonCounts[item.pack_id] = (lessonCounts[item.pack_id] ?? 0) + 1;
    }
  }

  return (
    <main className="min-h-screen bg-brand-cream px-6 py-10 text-brand-navy">
      <div className="mx-auto max-w-4xl space-y-5">
        <div>
          <h1 className="font-heading text-2xl font-bold">Author studio</h1>
          <p className="text-sm text-brand-navy/60">
            Create lessons, group them into packs, then submit the lessons for review.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-card bg-white p-4 shadow-soft">
            <div className="mb-3">
              <h2 className="font-heading text-sm font-bold">Start a lesson</h2>
              <p className="text-xs text-brand-navy/50">A lesson holds slides and activities.</p>
            </div>
            <NewLessonForm />
          </section>

          <section className="rounded-card bg-white p-4 shadow-soft">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-heading text-sm font-bold">Start a pack</h2>
                <p className="text-xs text-brand-navy/50">A pack orders lessons into a learning journey.</p>
              </div>
              <Link href="/author/packs/new" className="text-xs font-bold text-brand-teal">
                Details…
              </Link>
            </div>
            <QuickPackForm />
          </section>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold">Your packs</h2>
            <span className="text-xs font-semibold text-brand-navy/45">
              {packs.length} pack{packs.length === 1 ? "" : "s"}
            </span>
          </div>
          {packError ? (
            <p className="rounded-card bg-brand-coral/15 p-3 text-sm font-semibold text-brand-coral">
              {packError.message}
            </p>
          ) : packs.length === 0 ? (
            <p className="rounded-card bg-white p-5 text-sm text-brand-navy/50 shadow-soft">
              No packs yet. Create one above, or choose “New pack with this lesson” from a lesson below.
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {packs.map((pack) => (
                <li key={pack.id}>
                  <Link
                    href={`/author/packs/${pack.id}`}
                    className="block rounded-card bg-white p-4 shadow-soft transition hover:bg-brand-teal/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-heading text-sm font-bold">{pack.title}</p>
                        <p className="mt-1 text-[11px] text-brand-navy/50">
                          {lessonCounts[pack.id] ?? 0} lesson{(lessonCounts[pack.id] ?? 0) === 1 ? "" : "s"} · {pack.status.replace("_", " ")} · {pack.visibility}
                        </p>
                      </div>
                      <span className="rounded-full bg-brand-teal/10 px-2 py-1 text-[10px] font-bold text-brand-teal">
                        Open
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {error ? (
          <p className="rounded-card bg-brand-coral/15 p-3 text-sm font-semibold text-brand-coral">
            {error.message}
          </p>
        ) : null}

        {rows.length > 0 ? (
          <p className="rounded-card border border-brand-navy/10 bg-brand-teal/10 px-4 py-3 text-sm text-brand-navy/75">
            Tip: use <span className="font-semibold">Add to pack…</span> on any lesson to place it in an
            existing pack or start a new pack with that lesson already included.
          </p>
        ) : null}

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-bold">Your lessons</h2>
          <LessonList rows={rows} packs={packs.map(({ id, title }) => ({ id, title }))} memberships={memberships} />
        </section>
      </div>
    </main>
  );
}

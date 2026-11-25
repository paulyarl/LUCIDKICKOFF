import { notFound, redirect } from "next/navigation";
import { CategoryPicker } from "@/components/admin/CategoryPicker";
import { db } from "@/lib/api/server";
import { AuthoringWorkspace } from "@/features/learn/authoring/AuthoringWorkspace";
import { AddToPackControl } from "@/components/author/AddToPackControl";
import type { StepSpec } from "@/features/learn/steps/registry";

export const dynamic = "force-dynamic";

export default async function AuthorLessonPage({ params }: { params: { id: string } }) {
  const session = await db.auth().session();
  if (!session?.user) redirect("/auth/login");

  const userId = session.user.id;
  const role = (session.user.app_metadata as any)?.role;
  const lesson = await db.catalog().lessonById(params.id, true);
  if (!lesson) notFound();

  const row = lesson as unknown as {
    id: string;
    title: string;
    status: string;
    visibility: string;
    owner_id: string | null;
    review_note: string | null;
  };
  if (row.owner_id !== userId && role !== "admin") notFound();

  const assigned = await db
    .user({ userId: userId, role: role ?? "user" })
    .catalog.categoriesFor("lesson", params.id);

  const steps = await db.catalog().lessonSteps(params.id);

  const packs = (await db.catalog().packs({
    columns: 'id, title, owner_id',
    order: 'title',
    ascending: true,
    ownerId: role === 'admin' ? undefined : userId,
  })) as unknown as { id: string; title: string }[];
  const packIds = packs.map((pack) => pack.id);

  const membershipData = await db.catalog().lessonPackMemberships(params.id, packIds);
  const memberPackIds = ((membershipData ?? []) as { pack_id: string }[]).map((row) => row.pack_id);
  const memberPackTitles = packs
    .filter((pack) => memberPackIds.includes(pack.id))
    .map((pack) => pack.title);

  return (
    <main className="min-h-screen bg-brand-cream px-6 py-10 text-brand-navy">
      <div className="mx-auto max-w-[1400px]">
        <h1 className="mb-4 font-heading text-2xl font-bold">Author lesson</h1>
        <details className="mb-4 rounded-lg border border-brand-navy/15 bg-white/70 px-4 py-3" open>
          <summary className="cursor-pointer select-none font-semibold">
            How to build your lesson — expected steps
          </summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
            <li>Select a category</li>
            <li>Add a title</li>
            <li>Select lesson type</li>
            <li>Click “Add step”</li>
            <li>Select new step in outline</li>
            <li>Edit step in the Inspector</li>
            <li>Select or upload an image/photo</li>
            <li>Edit slide text</li>
            <li>Edit slide narration</li>
            <li>(Optional) Click “Listen” in the Learner preview to hear the narration</li>
            <li>Click “Continue” in the Learner preview to check the slide</li>
          </ol>
        </details>
        <div className="mb-4">
          <CategoryPicker contentType="lesson" contentId={params.id} assigned={assigned} />
        </div>
        <section className="mb-4 flex flex-col gap-3 rounded-card bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-sm font-bold">Pack placement</h2>
            <p className="text-xs text-brand-navy/50">
              {memberPackTitles.length
                ? `Currently in: ${memberPackTitles.join(", ")}`
                : "Not in one of your packs yet."}
            </p>
          </div>
          <AddToPackControl lessonId={params.id} packs={packs} memberPackIds={memberPackIds} />
        </section>
        <AuthoringWorkspace
          lesson={row}
          initialSteps={(steps ?? []) as unknown as StepSpec[]}
        />
      </div>
    </main>
  );
}

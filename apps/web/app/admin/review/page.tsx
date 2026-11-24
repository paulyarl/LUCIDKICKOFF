import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { ReviewActions } from "@/components/admin/ReviewActions";

export const dynamic = "force-dynamic";

type ReviewRow = {
  id: string;
  title: string;
  visibility: string;
  skill_tag: string | null;
  est_minutes: number | null;
  owner_id: string | null;
};

export default async function ReviewQueuePage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) redirect("/auth/login");

  const role = (session.user.app_metadata as any)?.role;
  if (role !== "admin") redirect("/");

  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("status", "pending_review")
    .order("created_at", { ascending: true });

  const rows = (data ?? []) as unknown as ReviewRow[];

  return (
    <main className="min-h-screen bg-brand-cream px-6 py-10 text-brand-navy">
      <div className="mx-auto max-w-3xl space-y-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Review queue</h1>
          <p className="text-sm text-brand-navy/60">
            Lessons submitted by parents. Publish private, promote to catalog, or reject with a note.
          </p>
        </div>

        {error ? (
          <p className="rounded-card bg-brand-coral/15 p-3 text-sm font-semibold text-brand-coral">
            {error.message}
          </p>
        ) : null}

        {rows.length === 0 ? (
          <p className="rounded-card bg-white p-6 text-sm text-brand-navy/50 shadow-soft">
            No lessons pending review.
          </p>
        ) : (
          rows.map((lesson) => (
            <article key={lesson.id} className="space-y-3 rounded-card bg-white p-4 shadow-soft">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-lg font-bold">{lesson.title}</h2>
                <span className="rounded-full bg-brand-navy/5 px-2.5 py-1 text-[11px] font-semibold text-brand-navy/60">
                  {lesson.visibility}
                </span>
              </div>
              <p className="text-xs text-brand-navy/50">
                {lesson.skill_tag ?? "no skill tag"} · {lesson.est_minutes ?? "?"} min · owner{" "}
                {lesson.owner_id?.slice(0, 8) ?? "unknown"}
              </p>
              <ReviewActions lessonId={lesson.id} />
            </article>
          ))
        )}
      </div>
    </main>
  );
}

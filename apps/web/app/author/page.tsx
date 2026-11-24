import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { NewLessonForm } from "@/components/author/NewLessonForm";

export const dynamic = "force-dynamic";

type LessonRow = {
  id: string;
  title: string;
  status: string;
  visibility: string;
  updated_at: string | null;
};

export default async function AuthorPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) redirect("/auth/login");

  const role = (session.user.app_metadata as any)?.role;
  if (role !== "parent" && role !== "admin") redirect("/");

  let query = supabase
    .from("lessons")
    .select("*")
    .order("updated_at", { ascending: false });

  if (role !== "admin") query = query.eq("owner_id", session.user.id);

  const { data, error } = await query;
  const rows = (data ?? []) as unknown as LessonRow[];

  return (
    <main className="min-h-screen bg-brand-cream px-6 py-10 text-brand-navy">
      <div className="mx-auto max-w-3xl space-y-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Author</h1>
          <p className="text-sm text-brand-navy/60">
            Create a lesson, add slides and activities, then submit it for review.
          </p>
        </div>

        <div className="rounded-card bg-white p-4 shadow-soft">
          <NewLessonForm />
        </div>

        {error ? (
          <p className="rounded-card bg-brand-coral/15 p-3 text-sm font-semibold text-brand-coral">
            {error.message}
          </p>
        ) : null}

        {rows.length === 0 ? (
          <p className="rounded-card bg-white p-6 text-sm text-brand-navy/50 shadow-soft">
            No lessons yet. Create the first one above.
          </p>
        ) : (
          <ul className="space-y-2">
            {rows.map((lesson) => (
              <li key={lesson.id}>
                <Link
                  href={`/author/lesson/${lesson.id}`}
                  className="flex items-center justify-between rounded-card bg-white p-4 shadow-soft hover:bg-brand-teal/5"
                >
                  <div>
                    <p className="font-heading text-sm font-bold">{lesson.title}</p>
                    <p className="text-[11px] text-brand-navy/50">
                      {lesson.status} · {lesson.visibility}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-brand-teal">Edit</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

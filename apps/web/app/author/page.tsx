import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { NewLessonForm } from "@/components/author/NewLessonForm";
import { LessonList } from "@/components/author/LessonList";

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

        {rows.length > 0 ? (
          <p className="rounded-card border border-brand-navy/10 bg-brand-teal/10 px-4 py-3 text-sm text-brand-navy/75">
            Tip: you can also start a new lesson by cloning an existing one — click{" "}
            <span className="font-semibold">Clone</span> on any lesson below to copy it with all
            its steps, then edit the copy.
          </p>
        ) : null}

        <LessonList rows={rows} />
      </div>
    </main>
  );
}

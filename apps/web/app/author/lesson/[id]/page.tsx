import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { AuthoringWorkspace } from "@/features/learn/authoring/AuthoringWorkspace";
import type { StepSpec } from "@/features/learn/steps/registry";

export const dynamic = "force-dynamic";

export default async function AuthorLessonPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) redirect("/auth/login");

  const role = (session.user.app_metadata as any)?.role;
  const { data: lesson, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !lesson) notFound();

  const row = lesson as unknown as {
    id: string;
    title: string;
    status: string;
    visibility: string;
    owner_id: string | null;
    review_note: string | null;
  };
  if (row.owner_id !== session.user.id && role !== "admin") notFound();

  const { data: steps } = await supabase
    .from("lesson_steps")
    .select("*")
    .eq("lesson_id", params.id)
    .order("order_index");

  return (
    <main className="min-h-screen bg-brand-cream px-6 py-10 text-brand-navy">
      <div className="mx-auto max-w-[1400px]">
        <h1 className="mb-4 font-heading text-2xl font-bold">Author lesson</h1>
        <AuthoringWorkspace
          lesson={row}
          initialSteps={(steps ?? []) as unknown as StepSpec[]}
        />
      </div>
    </main>
  );
}

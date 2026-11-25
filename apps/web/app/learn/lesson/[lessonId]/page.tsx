import { LessonView } from '@/features/learn/components';
import { CategoryChipLinks } from "@/components/chrome/CategoryChipLinks";
import { db } from "@/lib/db/server";
import { createClient } from "@/lib/supabase/server";

export default async function LessonPage({
  params,
  searchParams,
}: {
  params: { lessonId: string };
  searchParams: { mode?: string };
}) {
  const [categories, lessonRes] = await Promise.all([
    db.catalog().categoriesFor("lesson", params.lessonId),
    createClient()
      .from("lessons")
      .select("id, title, est_minutes")
      .eq("id", params.lessonId)
      .maybeSingle(),
  ]);

  const lesson = lessonRes.data as { id: string; title: string; est_minutes: number | null } | null;
  const mode = searchParams.mode === "tutorial" ? "tutorial" : "interactive";

  return (
    <div className="force-light min-h-screen bg-brand-cream">
      {categories.length > 0 && (
        <div className="border-b border-brand-navy/10 px-4 py-2">
          <div className="mx-auto max-w-4xl">
            <CategoryChipLinks categories={categories} />
          </div>
        </div>
      )}
      <LessonView
        lessonId={params.lessonId}
        title={lesson?.title ?? null}
        estMinutes={lesson?.est_minutes ?? null}
        mode={mode}
      />
    </div>
  );
}

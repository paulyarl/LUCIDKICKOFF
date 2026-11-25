import { LessonView } from '@/features/learn/components';
import { CategoryChipLinks } from "@/components/chrome/CategoryChipLinks";
import { db } from "@/lib/db/server";

export default async function LessonPage({ params }: { params: { lessonId: string } }) {
  const categories = await db.catalog().categoriesFor("lesson", params.lessonId);
  return (
    <>
      {categories.length > 0 && (
        <div className="force-light border-b border-brand-navy/10 bg-brand-cream px-4 py-2">
          <div className="mx-auto max-w-4xl">
            <CategoryChipLinks categories={categories} />
          </div>
        </div>
      )}
      <LessonView />
    </>
  );
}

"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";

type Lesson = {
  id: string;
  title: string;
  checkpoints: Array<{ id: string; order: number; title: string }>;
};

export default function LessonEntryPage() {
  const params = useParams<{ lessonId: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = params?.lessonId;
    if (!id) return;
    fetch(`/lessons/${id}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then(setLesson)
      .catch(() => setError(t('error.lessonLoad')));
  }, [params?.lessonId]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {!lesson && !error && <div aria-busy="true">{t('status.loading')}</div>}
      {error && <p className="text-red-600">{error}</p>}
      {lesson && (
        <section>
          <h1 className="text-2xl md:text-3xl font-heading text-text-primary">{lesson.title}</h1>
          <p className="mt-2 text-text-secondary">{t('page.lesson.entry.checkpoints', { count: String(lesson.checkpoints.length) })}</p>
          <ol className="mt-4 list-decimal pl-6 space-y-1">
            {lesson.checkpoints.map((cp) => (
              <li key={cp.id} className="text-text-primary">{cp.title}</li>
            ))}
          </ol>
          <div className="mt-6">
            <Button size="lg" onClick={() => router.push(`/learn/lesson/${lesson.id}/run`)}>
              {t('page.lesson.entry.start')}
            </Button>
          </div>
        </section>
      )}
    </main>
  );
}

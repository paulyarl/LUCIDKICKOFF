"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";

export default function PackCoverPage() {
  const params = useParams<{ packId: string }>();
  const packId = params?.packId ?? "";
  const { t } = useI18n();
  // Placeholder data; later load from public/packs/*.json
  const lessons = ["line-control-1"]; // seed present
  const tutorials = ["friendly-lion"]; // seed present

  const hasLessons = lessons.length > 0;
  const hasTutorials = tutorials.length > 0;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-heading tracking-tight text-text-primary">{t('pack.cover.title', { packId })}</h1>
      <p className="mt-2 text-text-secondary">{t('pack.cover.subtitle')}</p>
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        {hasLessons && (
          <Button asChild size="lg" aria-label={t('cta.study.lesson')}>
            <Link href={`/learn/lesson/${lessons[0]}`}>{t('cta.study')}</Link>
          </Button>
        )}
        {hasTutorials && (
          <Button asChild variant="secondary" size="lg" aria-label={t('cta.startTutorial')}>
            <Link href={`/tutorial/${tutorials[0]}/run`}>{t('cta.startTutorial')}</Link>
          </Button>
        )}
        <Button asChild variant="outline" size="lg" aria-label={t('cta.explorePack')}>
          <Link href={`/pack/${packId}`}>{t('cta.explorePack')}</Link>
        </Button>
      </div>
      <div className="mt-8 rounded-lg border border-border p-6 bg-surface">
        <p className="text-text-muted">Carousel preview and item list will appear here.</p>
      </div>
    </main>
  );
}

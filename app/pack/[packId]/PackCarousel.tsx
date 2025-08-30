"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";
import { trackPackCarouselCompleted } from "@/lib/analytics/learningEvents";

export type CarouselItem = {
  id: string;
  kind: "lesson" | "tutorial" | "template";
  title: string; // fallback title
  description?: string; // fallback description
  href: string;
  // Optional metadata with i18n
  metadata?: {
    title_i18n?: Record<string, string> | null;
    description_i18n?: Record<string, string> | null;
  } | null;
};

export default function PackCarousel({ items, packId, packSlug }: { items: CarouselItem[]; packId: string; packSlug: string; }) {
  const { t, locale } = useI18n();
  const [index, setIndex] = useState(0);
  const startTouch = useRef<{ x: number; y: number } | null>(null);
  const visited = useRef<Set<number>>(new Set());
  const startedAt = useRef<number>(Date.now());
  const reported = useRef<boolean>(false);

  const safeItems = useMemo(() => items ?? [], [items]);

  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const next = () => setIndex((i) => Math.min(safeItems.length - 1, i + 1));

  const onTouchStart = (e: React.TouchEvent) => {
    const t0 = e.touches[0];
    startTouch.current = { x: t0.clientX, y: t0.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!startTouch.current) return;
    const t1 = e.changedTouches[0];
    const dx = t1.clientX - startTouch.current.x;
    if (Math.abs(dx) > 40) {
      if (dx < 0) next();
      else prev();
    }
    startTouch.current = null;
  };

  // Track visited slides; when all have been seen, emit completion once
  useEffect(() => {
    visited.current.add(index);
    if (!reported.current && safeItems.length > 0 && visited.current.size === safeItems.length) {
      reported.current = true;
      const duration = Date.now() - startedAt.current;
      // Fire and forget; queue handles offline/flush
      trackPackCarouselCompleted({
        packId,
        packSlug,
        totalItems: safeItems.length,
        durationMs: duration,
      });
    }
  }, [index, safeItems.length, packId, packSlug]);

  return (
    <>
      <div
        className="mt-6 relative overflow-hidden rounded-lg border border-border bg-surface"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        aria-roledescription="carousel"
        aria-label={t('a11y.packItems')}
      >
        <div className="flex items-stretch transition-transform duration-300" style={{ transform: `translateX(-${index * 100}%)`, width: `${safeItems.length * 100}%` }}>
          {safeItems.map((it) => {
            const displayTitle = it.metadata?.title_i18n?.[locale] ?? it.title;
            const displayDesc = it.metadata?.description_i18n?.[locale] ?? it.description;
            return (
            <section key={it.id} className="w-full flex-shrink-0 p-6 sm:p-8" aria-label={it.title}>
              <div className="h-full rounded-lg border border-border p-6 bg-background">
                <h2 className="text-xl md:text-2xl font-semibold text-text-primary">{displayTitle}</h2>
                {displayDesc && <p className="mt-2 text-text-secondary">{displayDesc}</p>}
                <div className="mt-5 flex gap-3">
                  <Button asChild size="lg">
                    <Link href={it.href}>
                      {it.kind === 'lesson'
                        ? t('cta.study.lesson')
                        : it.kind === 'tutorial'
                        ? t('cta.startTutorial')
                        : t('cta.colorTemplate')}
                    </Link>
                  </Button>
                  <Button variant="secondary" size="lg" asChild>
                    <Link href={`${it.href}/run`}>{t('cta.quickStart')}</Link>
                  </Button>
                </div>
              </div>
            </section>
          );})}
        </div>

        {/* Controls */}
        <div className="absolute inset-y-0 left-0 flex items-center">
          <Button variant="ghost" size="icon" aria-label={t('a11y.prev')} onClick={prev} disabled={index === 0}>◀</Button>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center">
          <Button variant="ghost" size="icon" aria-label={t('a11y.next')} onClick={next} disabled={index === safeItems.length - 1}>▶</Button>
        </div>

        {/* Dots */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
          {safeItems.map((_, i) => (
            <button
              key={i}
              aria-label={`${t('a11y.goToSlide')} ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2.5 w-2.5 rounded-full ${i === index ? 'bg-primary' : 'bg-border'}`}
            />
          ))}
        </div>
      </div>
      <p className="mt-3 text-center text-sm text-text-muted">{t('carousel.swipeHint')}</p>
    </>
  );
}

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n/provider";
import { ArrowLeft, ArrowRight, Maximize2, Minimize2, X, Heart } from "lucide-react";
import { getMyFavorite, toggleFavorite } from "@/lib/engagement";

export type StudyPage = {
  id: string;
  title?: string;
  imageUrl: string;
};

export function StudyCarousel({
  title,
  pages,
  carouselId,
}: {
  title?: string;
  pages: StudyPage[];
  carouselId?: string;
}) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [immersive, setImmersive] = useState(false);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFav, setIsFav] = useState<boolean>(false);

  const canPrev = index > 0;
  const canNext = index < Math.max(0, pages.length - 1);

  const goPrev = () => setIndex((i) => (i > 0 ? i - 1 : i));
  const goNext = () => setIndex((i) => (i < pages.length - 1 ? i + 1 : i));

  // Keyboard navigation in immersive mode
  useEffect(() => {
    if (!immersive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape") setImmersive(false);
      if ((e.key === "+" || e.key === "=") && zoom < 3) setZoom((z) => Math.min(3, z + 0.25));
      if ((e.key === "-" || e.key === "_") && zoom > 0.5) setZoom((z) => Math.max(0.5, z - 0.25));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [immersive, pages.length, zoom]);

  // Swipe support (basic)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let startX = 0;
    let delta = 0;
    const onStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
    };
    const onMove = (e: TouchEvent) => {
      delta = e.touches[0].clientX - startX;
    };
    const onEnd = () => {
      if (delta < -40) goNext();
      else if (delta > 40) goPrev();
      startX = 0;
      delta = 0;
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart as any);
      el.removeEventListener("touchmove", onMove as any);
      el.removeEventListener("touchend", onEnd as any);
    };
  }, [containerRef.current, pages.length]);

  // Load favorite state if carouselId provided
  useEffect(() => {
    let mounted = true;
    if (!carouselId) return;
    (async () => {
      try {
        const fav = await getMyFavorite("carousel", carouselId);
        if (mounted) setIsFav(fav);
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, [carouselId]);

  if (pages.length === 0) {
    return (
      <div className="border rounded-lg p-6 text-sm text-muted-foreground">
        {t("packs.study.empty") || "No study pages yet."}
      </div>
    );
  }

  const current = pages[index];

  return (
    <div className="space-y-3">
      {title && <div className="text-base font-semibold">{title}</div>}

      <div className="relative border rounded-lg overflow-hidden">
        <div ref={containerRef} className="relative aspect-[4/3] bg-muted">
          <Image
            src={current.imageUrl}
            alt={current.title || `Page ${index + 1}`}
            fill
            className="object-contain"
          />
        </div>
        {/* Controls */}
        <div className="absolute inset-x-0 bottom-0 p-2 flex items-center justify-between bg-gradient-to-t from-black/50 to-transparent text-white">
          <Button variant="ghost" size="sm" onClick={goPrev} disabled={!canPrev} className="text-white hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="text-xs">
            {index + 1} / {pages.length}
          </div>
          <div className="flex items-center gap-2">
            {carouselId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const desired = !isFav;
                  setIsFav(desired);
                  try {
                    await toggleFavorite("carousel", carouselId, desired);
                  } catch {
                    setIsFav(!desired);
                  }
                }}
                className="text-white hover:bg-white/10"
                aria-label={isFav ? (t('packs.card.favorite.remove') || 'Remove from favorites') : (t('packs.card.favorite.add') || 'Add to favorites')}
              >
                <Heart className={isFav ? "h-4 w-4 fill-red-500 text-red-500" : "h-4 w-4"} />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setImmersive(true)} className="text-white hover:bg-white/10">
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={goNext} disabled={!canNext} className="text-white hover:bg-white/10">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Immersive Mode */}
      <Dialog open={immersive} onOpenChange={(v) => setImmersive(v)}>
        <DialogContent className="max-w-none w-screen h-screen p-0 bg-black">
          <div className="absolute inset-0 flex flex-col">
            <div className="p-2 flex items-center justify-between text-white">
              <div className="text-sm font-medium">
                {current.title || `${t("packs.study.page") || "Page"} ${index + 1}`}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} aria-label={t("common.zoomOut") || "Zoom out"}>
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => setZoom((z) => Math.min(3, z + 0.25))} aria-label={t("common.zoomIn") || "Zoom in"}>
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => setImmersive(false)} aria-label={t("common.close") || "Close"}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="relative flex-1 select-none">
              <div className="absolute inset-0 flex items-center justify-center" style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}>
                <div className="relative w-[90vw] h-[90vh]">
                  <Image src={current.imageUrl} alt={current.title || `Page ${index + 1}`} fill className="object-contain" />
                </div>
              </div>
              {/* Nav arrows */}
              <div className="absolute inset-y-0 left-0 flex items-center">
                <Button variant="ghost" size="icon" onClick={goPrev} disabled={!canPrev} className="text-white hover:bg-white/10">
                  <ArrowLeft className="h-6 w-6" />
                </Button>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center">
                <Button variant="ghost" size="icon" onClick={goNext} disabled={!canNext} className="text-white hover:bg-white/10">
                  <ArrowRight className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

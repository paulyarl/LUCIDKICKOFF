"use client";

import { useEffect, useRef, useState } from "react";
import { art, artSrcSet, type ArtId } from "@/lib/art";
import { cn } from "@/lib/utils";

type ArtImageProps = {
  id: ArtId;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

/**
 * Renders an art-manifest entry. Falls back to a brand gradient if the export
 * is missing, so frame screens work before the export pass.
 *
 * The mount check matters: a 404 can happen before hydration, in which case
 * React's onError never fires and the browser shows broken-image alt text.
 */
export function ArtImage({ id, className, sizes = "100vw", priority }: ArtImageProps) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  const entry = art[id];

  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) {
    return (
      <div
        role={entry.decorative ? undefined : "img"}
        aria-label={entry.decorative ? undefined : entry.alt}
        aria-hidden={entry.decorative || undefined}
        className={cn(
          "bg-gradient-to-br from-brand-teal/30 via-brand-cream to-brand-ochre/30",
          className,
        )}
      />
    );
  }

  return (
    <img
      ref={ref}
      src={entry.src}
      srcSet={artSrcSet(id)}
      sizes={sizes}
      alt={entry.alt}
      aria-hidden={entry.decorative || undefined}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

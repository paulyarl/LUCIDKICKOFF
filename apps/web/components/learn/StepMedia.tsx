"use client";

import { useEffect, useRef, useState } from "react";
import { art, artSrcSet, type ArtId } from "@/lib/art";
import { cn } from "@/lib/utils";

// Sprint 2.16 (D46) — step content stores manifest *paths* (MediaPicker writes
// entry.src), so map them back to art ids for proper alt text and responsive
// srcsets. Non-manifest sources (uploads, external URLs) still render, just
// without manifest metadata.

const stem = (src: string) => src.replace(/-\d+\.webp$/, "");

const BY_SRC = new Map<string, ArtId>();
for (const [id, entry] of Object.entries(art)) {
  BY_SRC.set(entry.src, id as ArtId);
  BY_SRC.set(stem(entry.src), id as ArtId);
}

export const artIdForSrc = (src: string | undefined | null): ArtId | undefined =>
  src ? BY_SRC.get(src) ?? BY_SRC.get(stem(src)) : undefined;

/** Resolve a stored badge value: an art id, a path, or a bare filename stem. */
export const resolveArtRef = (value: string | undefined | null): { src: string; id?: ArtId } | null => {
  if (!value) return null;
  if (value in art) return { src: art[value as ArtId].src, id: value as ArtId };
  if (value.startsWith("/") || /^https?:\/\//.test(value)) {
    return { src: value, id: artIdForSrc(value) };
  }
  return null;
};

export function StepMedia({
  src,
  alt = "",
  className,
  sizes = "(min-width: 640px) 640px, 100vw",
}: {
  src: string;
  alt?: string;
  className?: string;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  const id = artIdForSrc(src);
  const entry = id ? art[id] : undefined;

  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt || entry?.alt || "Picture"}
        className={cn(
          "bg-gradient-to-br from-brand-teal/30 via-brand-cream to-brand-ochre/30",
          className,
        )}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      srcSet={id ? artSrcSet(id) : undefined}
      sizes={sizes}
      alt={alt || entry?.alt || ""}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

"use client";

import { useState } from "react";

/**
 * Sprint 2.16 (D45) — pack detail hero: title set on a gradient scrim over the
 * cover art. Falls back to a plain heading when the cover is missing/broken.
 */
export function PackHero({ imageUrl, title }: { imageUrl: string | null; title: string }) {
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) {
    return <h1 className="font-heading text-3xl font-bold">{title}</h1>;
  }

  return (
    <div className="relative overflow-hidden rounded-panel shadow-soft">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={title}
        className="h-48 w-full object-cover sm:h-56"
        onError={() => setFailed(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/80 via-brand-navy/25 to-transparent" />
      <h1 className="absolute inset-x-4 bottom-3 font-heading text-2xl font-bold text-white drop-shadow sm:text-3xl">
        {title}
      </h1>
    </div>
  );
}

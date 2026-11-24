"use client";

import { useState, type ReactNode } from "react";
import { art } from "@/lib/art";

/**
 * Page backdrop: the dedicated wall-art asset, falling back to the hero at low
 * opacity until the wall-art export exists. If both are missing, the cream
 * background stands alone.
 */
export function PageBackdrop({ children }: { children: ReactNode }) {
  const [src, setSrc] = useState<string | null>(art["ui.wallart"].src);
  const [usedFallback, setUsedFallback] = useState(false);

  const onError = () => {
    if (!usedFallback) {
      setSrc(art["hero.savanna"].src);
      setUsedFallback(true);
    } else {
      setSrc(null);
    }
  };

  return (
    <main className="relative min-h-screen bg-brand-cream px-6 py-10 text-brand-navy">
      {src ? (
        <img
          src={src}
          alt=""
          aria-hidden
          onError={onError}
          className="pointer-events-none fixed inset-0 h-full w-full object-cover"
        />
      ) : null}
      <div className="relative">{children}</div>
    </main>
  );
}

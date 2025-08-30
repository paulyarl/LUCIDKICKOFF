"use client";

import { useState } from "react";

export function StarRatingInput({
  value,
  onChange,
  size = 20,
  ariaLabel = "Rate",
}: {
  value?: number | null;
  onChange: (rating: number) => void;
  size?: number;
  ariaLabel?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const current = Math.max(0, Math.min(5, Math.round(value ?? 0)));

  return (
    <div className="inline-flex items-center gap-1" aria-label={ariaLabel} role="radiogroup">
      {[1, 2, 3, 4, 5].map((i) => {
        const active = (hover ?? current) >= i;
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={current === i}
            className="p-0.5"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onChange(i)}
            title={`${i} star${i > 1 ? "s" : ""}`}
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 20 20"
              aria-hidden="true"
              className={active ? "text-yellow-500" : "text-muted-foreground"}
              fill="currentColor"
            >
              <path d="M10 15.27L16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

"use client";
import React, { useEffect, useRef, useState } from "react";
import { Check, Globe } from "lucide-react";
import { useI18n, type Locale } from "@/lib/i18n/provider";

const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "sw", label: "Kiswahili" },
];

type LanguageSwitcherProps = {
  inline?: boolean;
  iconTrigger?: boolean;
  className?: string;
};

export function LanguageSwitcher({ inline = false, iconTrigger = false, className = "" }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!iconTrigger || !open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [iconTrigger, open]);

  if (iconTrigger) {
    return (
      <div ref={rootRef} className={`relative ${className}`}>
        <button
          type="button"
          aria-label={t("language.choose")}
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((value) => !value)}
          className="grid h-10 w-10 place-items-center rounded-full bg-white/70 text-brand-navy/60 shadow-soft backdrop-blur transition hover:bg-white hover:text-brand-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
        >
          <Globe className="h-5 w-5" aria-hidden="true" />
        </button>

        {open && (
          <div
            role="menu"
            aria-label={t("language.choose")}
            className="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-2xl border border-brand-navy/10 bg-white p-1 shadow-xl"
          >
            {LOCALES.map(({ code, label }) => {
              const active = code === locale;
              return (
                <button
                  key={code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => {
                    setLocale(code);
                    setOpen(false);
                  }}
                  className={
                    "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-brand-navy transition hover:bg-brand-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal " +
                    (active ? "bg-brand-cream" : "bg-white")
                  }
                >
                  <span>{label}</span>
                  {active && <Check className="h-4 w-4 text-brand-teal" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const containerClass = inline
    ? "inline-flex items-center"
    : "fixed bottom-4 right-4 z-50";

  return (
    <div className={containerClass}>
      <label className="sr-only" htmlFor="lang-select">Language</label>
      <select
        id="lang-select"
        className="rounded-md border border-white/20 bg-transparent px-2 py-1.5 text-xs text-inherit shadow-none focus:outline-none [&>option]:text-black"
        value={locale}
        onChange={(e) => {
          const next = e.target.value as Locale;
          setLocale(next);
          // Force a full page reload so all UI reflects the new language
          try {
            window.location.reload();
          } catch {}
        }}
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
    </div>
  );
}

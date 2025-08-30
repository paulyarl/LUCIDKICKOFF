"use client";
import React from "react";
import { useI18n, type Locale } from "@/lib/i18n/provider";

const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
  { code: "fr", label: "FR" },
  { code: "sw", label: "SW" },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div
      role="group"
      aria-label="Language selector"
      className="fixed top-4 right-4 z-50 inline-flex rounded-md border border-border bg-background shadow-sm"
    >
      {LOCALES.map(({ code, label }) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            onClick={() => setLocale(code)}
            className={
              "px-3 py-1.5 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors " +
              (active
                ? "bg-primary text-primary-foreground"
                : "bg-background hover:bg-muted text-text-primary")
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

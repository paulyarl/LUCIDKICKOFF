"use client";
import React from "react";
import { useI18n, type Locale } from "@/lib/i18n/provider";

const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "sw", label: "Kiswahili" },
];

export function LanguageSwitcher({ inline = false }: { inline?: boolean }) {
  const { locale, setLocale } = useI18n();
  const containerClass = inline
    ? "inline-flex items-center"
    : "fixed bottom-4 right-4 z-50";

  return (
    <div className={containerClass}>
      <label className="sr-only" htmlFor="lang-select">Language</label>
      <select
        id="lang-select"
        className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none"
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

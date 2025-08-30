"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import en from "./messages/en.json";
import es from "./messages/es.json";
import sw from "./messages/sw.json";
import fr from "./messages/fr.json";

export type Locale = "en" | "es" | "sw" | "fr";

type Messages = Record<string, string>;
const DICTS: Record<Locale, Messages> = { en, es, sw, fr } as const;

export type I18nContextType = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextType | null>(null);

function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

function detectLocale(): Locale {
  // 1) URL param ?lang=es
  try {
    const sp = new URLSearchParams(window.location.search);
    const fromQuery = sp.get("lang");
    if (fromQuery === "en" || fromQuery === "es" || fromQuery === "sw" || fromQuery === "fr") return fromQuery as Locale;
  } catch {}
  // 2) Persisted
  const stored = typeof window !== "undefined" ? (localStorage.getItem("lc_lang") as Locale | null) : null;
  if (stored === "en" || stored === "es" || stored === "sw" || stored === "fr") return stored;
  // 3) Navigator
  if (typeof navigator !== "undefined") {
    const lang = navigator.language || navigator.languages?.[0] || "en";
    const lower = lang.toLowerCase();
    if (lower.startsWith("es")) return "es";
    if (lower.startsWith("sw") || lower.startsWith("sw-ke") || lower.startsWith("sw-tz")) return "sw";
    if (lower.startsWith("fr")) return "fr";
  }
  return "en";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    setLocaleState(detectLocale());
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem("lc_lang", l); } catch {}
  }, []);

  const dict = DICTS[locale] ?? DICTS.en;

  // Keep <html lang> in sync for accessibility
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', locale);
    }
  }, [locale]);

  const t = useCallback((key: string, vars?: Record<string, string | number>) => {
    // Fallback to English if missing in current locale
    const raw = (dict[key] ?? DICTS.en[key] ?? key);
    return interpolate(raw, vars);
  }, [dict]);

  const value = useMemo<I18nContextType>(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

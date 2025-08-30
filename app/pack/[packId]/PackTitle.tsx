"use client";
import { useI18n } from "@/lib/i18n/provider";
import type { Pack } from "@/lib/packs";

export default function PackTitle({ pack }: { pack: Pack }) {
  const { locale } = useI18n();
  const localized = (pack.title_i18n && typeof pack.title_i18n === 'object') ? pack.title_i18n[locale] : undefined;
  const title = localized || pack.title;
  return (
    <h1 className="text-2xl md:text-3xl font-heading text-text-primary">{title}</h1>
  );
}

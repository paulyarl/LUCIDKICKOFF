"use client";
import { useI18n } from "@/lib/i18n/provider";
import type { Pack } from "@/lib/packs";

export default function LocalizedPackTitle({ pack }: { pack: Pack }) {
  const { locale } = useI18n();
  const localized = (pack.title_i18n as any)?.[locale] as string | undefined;
  return <span>{localized || pack.title}</span>;
}

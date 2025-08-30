"use client";
import { useI18n } from "@/lib/i18n/provider";
import type { Pack } from "@/lib/packs";

export default function LocalizedPackDescription({ pack }: { pack: Pack }) {
  const { locale } = useI18n();
  const descMap = (pack.description_i18n as any) || {};
  const desc = (typeof descMap === 'object' ? descMap[locale] : undefined) || pack.description || '';
  if (!desc) return null;
  return <p className="mt-2 text-sm text-text-secondary line-clamp-2">{desc}</p>;
}

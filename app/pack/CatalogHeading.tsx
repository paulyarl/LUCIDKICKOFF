"use client";
import { useI18n } from "@/lib/i18n/provider";

export default function CatalogHeading() {
  const { t } = useI18n();
  return (
    <h1 className="text-3xl md:text-4xl font-heading tracking-tight text-text-primary">
      {t('nav.packs')}
    </h1>
  );
}

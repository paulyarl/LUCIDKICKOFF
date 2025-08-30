"use client";
import React from "react";
import { useI18n } from "@/lib/i18n/provider";

export function SkipLink({ targetId = "main-content" }: { targetId?: string }) {
  const { t } = useI18n();
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:ring-2 focus:ring-primary focus:rounded"
    >
      {t("a11y.skip")}
    </a>
  );
}

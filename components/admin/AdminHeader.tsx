"use client";

import React from "react";
import { useI18n } from "@/lib/i18n/provider";

export default function AdminHeader({ titleKey, right }: { titleKey: string; right?: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-between">
      <h1 className="font-heading text-3xl font-bold">{t(titleKey)}</h1>
      <div className="flex items-center gap-3">
        {right}
        <span className="rounded-full bg-brand-teal/15 px-3 py-1.5 text-xs font-bold text-brand-teal">
          {t("admin.mode")}
        </span>
      </div>
    </div>
  );
}

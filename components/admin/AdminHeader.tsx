"use client";

import React from "react";
import { useI18n } from "@/lib/i18n/provider";
import { Badge } from "@/components/ui/badge";

export default function AdminHeader({ titleKey, right }: { titleKey: string; right?: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-semibold">{t(titleKey)}</h1>
      <div className="flex items-center gap-3">
        {right}
        <Badge variant="outline" className="text-xs">{t("admin.mode")}</Badge>
      </div>
    </div>
  );
}

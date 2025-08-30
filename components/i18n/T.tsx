"use client";

import React from "react";
import { useI18n } from "@/lib/i18n/provider";

export function T({ k, vars }: { k: string; vars?: Record<string, string | number> }) {
  const { t } = useI18n();
  return <>{t(k, vars)}</>;
}

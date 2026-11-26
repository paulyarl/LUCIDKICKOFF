"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

export function AdminSignInLink() {
  const { t } = useI18n();
  return (
    <Link
      href="/admin"
      aria-label={t("welcome.adminAria")}
      title={t("welcome.adminTitle")}
      className="grid h-10 w-10 place-items-center rounded-full bg-white/50 text-brand-navy/30 shadow-soft transition hover:bg-white hover:text-brand-navy/70"
    >
      <Shield className="h-4 w-4" />
    </Link>
  );
}

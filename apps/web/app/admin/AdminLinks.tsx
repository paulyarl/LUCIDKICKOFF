"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";

const linkCls =
  "block w-full rounded-xl bg-brand-teal/10 px-4 py-2.5 text-center text-sm font-bold text-brand-teal transition hover:bg-brand-teal/20";

export default function AdminLinks() {
  const { t } = useI18n();
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-card bg-white p-6 shadow-soft">
        <h3 className="mb-4 font-heading text-lg font-bold">Dashboards</h3>
        <div className="space-y-3">
          <Link href="/admin/impersonate/parents" className={linkCls}>
            {t("parent.dashboard.title") || "Parent Dashboard"}
          </Link>
          <Link href="/admin/impersonate/children" className={linkCls}>
            {t("child.dashboard.title") || "Child Dashboard"}
          </Link>
        </div>
      </div>
      <div className="rounded-card bg-white p-6 shadow-soft">
        <h3 className="mb-4 font-heading text-lg font-bold">Admin Tools</h3>
        <div className="space-y-3">
          <Link href="/admin/templates" className={linkCls}>
            {t("admin.templates.title") || "Templates"}
          </Link>
          <Link href="/admin/entitlements" className={linkCls}>
            {t("admin.entitlements.title") || "Entitlements"}
          </Link>
          <Link href="/admin/parents" className={linkCls}>
            {t("admin.tools.manageParents") || "Manage Parents"}
          </Link>
          <Link href="/admin/children" className={linkCls}>
            {t("admin.tools.manageChildren") || "Manage Children"}
          </Link>
          <Link href="/admin/review" className={linkCls}>
            Review Queue
          </Link>
          <Link href="/admin/packs" className={linkCls}>
            Pack Builder
          </Link>
          <Link href="/author" className={linkCls}>
            Author Lessons
          </Link>
        </div>
      </div>
    </div>
  );
}

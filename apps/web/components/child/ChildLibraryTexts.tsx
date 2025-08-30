"use client";

import { useI18n } from "@/lib/i18n/provider";

export function ChildLibraryTitle() {
  const { t } = useI18n();
  return <h1 className="text-3xl font-bold mb-8">{t("child.library.title")}</h1>;
}

export function PacksTitle() {
  const { t } = useI18n();
  return <span>{t("child.library.assignedPacks")}</span>;
}

export function TemplatesTitle() {
  const { t } = useI18n();
  return <span>{t("child.library.assignedTemplates")}</span>;
}

export function EmptyAssignedText() {
  const { t } = useI18n();
  return <p className="text-muted-foreground">{t("child.library.empty")}</p>;
}

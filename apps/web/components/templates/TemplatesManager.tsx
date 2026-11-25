"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/provider";
import { createClient } from "@/lib/supabase/client";
import type { Template } from "@/lib/templates";

export type TemplatesManagerProps = {
  initialTemplates: Template[];
  editable?: boolean;
};

export function TemplatesManager({ initialTemplates, editable = false }: TemplatesManagerProps) {
  const { t } = useI18n();
  const supabase = useMemo(() => createClient(), []);
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);

  useEffect(() => {
    setTemplates(initialTemplates);
  }, [initialTemplates]);

  const publicUrlFor = (path: string) => {
    const { data } = supabase.storage.from("templates").getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <div className={editable ? "space-y-6" : "max-w-screen-xl mx-auto px-4 py-6 space-y-6"}>
      {/* Header (public page only — admin page supplies AdminHeader) */}
      {!editable && (
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-lg font-semibold text-brand-navy">{t('templates.title') || 'Coloring Pages'}</h1>
        </div>
      )}

      {/* Admin toolbar */}
      {editable && (
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/templates/new" className="inline-flex items-center rounded-md bg-brand-navy px-3 py-2 text-white hover:bg-brand-navy/90 text-sm">
            {t("admin.templates.new")}
          </Link>
          <Link href="/admin/entitlements" className="text-sm underline text-brand-teal hover:text-brand-teal/80">
            {t("admin.entitlements.manageLink")}
          </Link>
        </div>
      )}

      {templates.length === 0 && (
        <p className="text-sm text-brand-navy/60">{t('admin.templates.none') || 'No templates yet.'}</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {templates.map((tpl) => (
          <div key={tpl.id} className="rounded-card bg-white shadow-soft relative overflow-hidden group">
            <Link href={`/canvas?templateId=${tpl.id}`} className="block">
              <Image src={publicUrlFor(tpl.image_path)} alt={tpl.title} width={400} height={300} className="aspect-[4/3] object-cover hover:opacity-95" />
            </Link>
            <div className="absolute top-2 left-2 flex gap-2">
              {!tpl.is_free && <Badge variant="secondary">{t("packs.proBadge") || "Pro"}</Badge>}
            </div>
            <div className="p-2">
              <Link href={`/canvas?templateId=${tpl.id}`} className="text-sm font-medium truncate underline-offset-2 hover:underline">
                {tpl.title}
              </Link>
              {editable && (
                <div className="mt-2 flex gap-2">
                  <Link href={`/admin/templates/edit/${tpl.id}`} className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm hover:bg-brand-cream">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {t("admin.templates.edit") || "Edit"}
                  </Link>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

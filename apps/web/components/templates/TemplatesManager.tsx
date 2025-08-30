"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/provider";
import { createClient } from "@/lib/supabase/client";
import type { Template } from "@/lib/templates";
import { createTemplate, deleteTemplate } from "@/lib/templates";

export type TemplatesManagerProps = {
  initialTemplates: Template[];
  editable?: boolean;
};

export function TemplatesManager({ initialTemplates, editable = false }: TemplatesManagerProps) {
  const { t } = useI18n();
  const supabase = useMemo(() => createClient(), []);
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // React 19 JSX typing workaround (similar to Dialog usage in canvas)
  const AnyButton = Button as any;
  const AnyInput = Input as any;

  // Form state
  const [title, setTitle] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [tags, setTags] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    setTemplates(initialTemplates);
  }, [initialTemplates]);

  const publicUrlFor = (path: string) => {
    const { data } = supabase.storage.from("templates").getPublicUrl(path);
    return data.publicUrl;
  };

  const onAdd = async () => {
    if (!editable) return;
    if (!file || !title.trim()) {
      setError(t("admin.templates.form.errors.noFile") || "Please provide title and file");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createTemplate({ file, title: title.trim(), is_free: isFree, tags: tags.split(",").map(s => s.trim()).filter(Boolean) });
      // Optimistic refresh: fetch newest from DB
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTemplates((data ?? []) as Template[]);
      // reset form
      setTitle("");
      setIsFree(true);
      setTags("");
      setFile(null);
    } catch (e: any) {
      setError(e?.message || "Failed to add template");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!editable) return;
    if (!confirm(t("admin.templates.confirmDelete") || "Delete this template?")) return;
    setLoading(true);
    setError(null);
    try {
      await deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (e: any) {
      setError(e?.message || "Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{editable ? (t("admin.templates.title")) : (t('packs.templates.title') || 'Pack Templates')}</h1>
        {editable ? (
          <Badge variant="outline" className="text-xs">{t("admin.mode")}</Badge>
        ) : null}
      </div>

      {/* Admin toolbar */}
      {editable && (
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/templates/new" className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 text-sm">
            {t("admin.templates.new")}
          </Link>
          <Link href="/admin/entitlements" className="text-sm underline text-blue-700 hover:text-blue-800">
            {t("admin.entitlements.manageLink")}
          </Link>
        </div>
      )}

      {editable && (
        <div className="rounded border p-4 space-y-3">
          <div className="font-medium text-sm">{t("admin.templates.form.newTitle") || "Add template"}</div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
            <AnyInput
              placeholder={t("admin.templates.form.fields.title") || "Title"}
              value={title}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            />
            <AnyInput
              type="file"
              accept="image/*"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)}
            />
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} />
              <span>{t("admin.templates.form.fields.isFree") || "Free"}</span>
            </label>
            <AnyInput
              placeholder={t("admin.templates.form.fields.tags") || "Tags (comma separated)"}
              value={tags}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTags(e.target.value)}
            />
            <AnyButton onClick={onAdd} disabled={loading}>
              {t("admin.templates.form.buttons.create") || "Add"}
            </AnyButton>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {templates.map((tpl) => (
          <div key={tpl.id} className="relative border rounded-lg overflow-hidden group">
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
              {Array.isArray(tpl.tags) && tpl.tags.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {tpl.tags.map((tag) => (
                    <Badge key={`${tpl.id}-${tag}`} variant="outline" className="text-[10px]">{tag}</Badge>
                  ))}
                </div>
              )}
              {editable && (
                <div className="mt-2 flex gap-2">
                  <Link href={`/admin/templates/edit/${tpl.id}`} className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">
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

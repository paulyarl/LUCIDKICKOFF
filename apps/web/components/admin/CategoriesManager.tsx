"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  image_path: string | null;
  kind: string;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean | null;
};

type Form = Omit<Category, "id"> & { id?: string };

const EMPTY: Form = {
  slug: "",
  name: "",
  description: "",
  icon: "",
  image_path: "",
  kind: "subject",
  parent_id: null,
  sort_order: 0,
  is_active: true,
};

export function CategoriesManager({
  initialCategories,
  counts,
}: {
  initialCategories: Category[];
  counts: Record<string, number>;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const input =
    "w-full rounded-lg border border-brand-navy/15 bg-white px-3 py-2 text-sm text-brand-navy focus:border-brand-teal focus:outline-none";

  async function save() {
    if (!form) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          description: form.description || null,
          icon: form.icon || null,
          image_path: form.image_path || null,
          parent_id: form.parent_id || null,
          sort_order: Number(form.sort_order) || 0,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `Save failed (${res.status})`);
      setForm(null);
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm(t("admin.categories.confirmDelete"))) return;
    const res = await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      router.refresh();
    }
  }

  async function toggleActive(c: Category) {
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...c, is_active: !c.is_active }),
    });
    if (res.ok) {
      setCategories((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, is_active: !c.is_active } : x)),
      );
      router.refresh();
    }
  }

  const field = (
    key: keyof Form,
    labelKey: string,
    opts?: { type?: string; textarea?: boolean },
  ) => (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-brand-navy/50">
        {t(labelKey)}
      </span>
      {opts?.textarea ? (
        <textarea
          className={input}
          rows={2}
          value={(form?.[key] as string) ?? ""}
          onChange={(e) => form && setForm({ ...form, [key]: e.target.value })}
        />
      ) : (
        <input
          className={input}
          type={opts?.type ?? "text"}
          value={(form?.[key] as string) ?? ""}
          onChange={(e) =>
            form &&
            setForm({
              ...form,
              [key]: opts?.type === "number" ? Number(e.target.value) : e.target.value,
            })
          }
        />
      )}
    </label>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setForm({ ...EMPTY })}
          className="flex items-center gap-2 rounded-xl bg-brand-teal px-4 py-2 text-sm font-bold text-white hover:bg-brand-teal/90"
        >
          <Plus className="h-4 w-4" /> {t("admin.categories.new")}
        </button>
      </div>

      {form && (
        <div className="rounded-card bg-white p-5 shadow-soft">
          <div className="grid gap-4 sm:grid-cols-2">
            {field("name", "admin.categories.name")}
            {field("slug", "admin.categories.slug")}
            {field("kind", "admin.categories.kind")}
            {field("sort_order", "admin.categories.sort", { type: "number" })}
            {field("icon", "admin.categories.icon")}
            {field("image_path", "admin.categories.image")}
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-brand-navy/50">
                {t("admin.categories.parent")}
              </span>
              <select
                className={input}
                value={form.parent_id ?? ""}
                onChange={(e) => setForm({ ...form, parent_id: e.target.value || null })}
              >
                <option value="">—</option>
                {categories
                  .filter((c) => c.id !== form.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="flex items-end gap-2 pb-1">
              <input
                type="checkbox"
                checked={!!form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="h-4 w-4 accent-brand-teal"
              />
              <span className="text-sm font-semibold">{t("admin.categories.active")}</span>
            </label>
          </div>
          <div className="mt-4">
            {field("description", "admin.categories.description", { textarea: true })}
          </div>
          {error && <p className="mt-3 text-sm font-semibold text-brand-coral">{error}</p>}
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={save}
              disabled={busy || !form.name.trim() || !form.slug.trim()}
              className="rounded-xl bg-brand-teal px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {t("admin.categories.save")}
            </button>
            <button
              type="button"
              onClick={() => setForm(null)}
              className="rounded-xl bg-brand-navy/5 px-4 py-2 text-sm font-bold text-brand-navy/70"
            >
              {t("admin.categories.cancel")}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-card bg-white shadow-soft">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-brand-navy/10 text-xs uppercase tracking-wide text-brand-navy/50">
              <th className="px-4 py-3">{t("admin.categories.name")}</th>
              <th className="px-4 py-3">{t("admin.categories.slug")}</th>
              <th className="px-4 py-3">{t("admin.categories.kind")}</th>
              <th className="px-4 py-3">{t("admin.categories.items")}</th>
              <th className="px-4 py-3">{t("admin.categories.active")}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-brand-navy/5 last:border-0">
                <td className="px-4 py-3 font-semibold">
                  {c.name}
                  {c.parent_id && (
                    <span className="ml-2 text-xs font-normal text-brand-navy/40">
                      ↳ {categories.find((p) => p.id === c.parent_id)?.name ?? "?"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-brand-navy/60">{c.slug}</td>
                <td className="px-4 py-3 text-brand-navy/60">{c.kind}</td>
                <td className="px-4 py-3 text-brand-navy/60">{counts[c.id] ?? 0}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleActive(c)}
                    className={`h-5 w-9 rounded-full transition ${c.is_active ? "bg-brand-teal" : "bg-brand-navy/20"}`}
                    aria-label="toggle active"
                  >
                    <span
                      className={`mt-0.5 block h-4 w-4 rounded-full bg-white transition ${
                        c.is_active ? "ml-4" : "ml-0.5"
                      }`}
                    />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          id: c.id,
                          slug: c.slug,
                          name: c.name,
                          description: c.description ?? "",
                          icon: c.icon ?? "",
                          image_path: c.image_path ?? "",
                          kind: c.kind,
                          parent_id: c.parent_id,
                          sort_order: c.sort_order,
                          is_active: c.is_active,
                        })
                      }
                      className="rounded-lg p-2 text-brand-navy/50 hover:bg-brand-teal/10 hover:text-brand-teal"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(c.id)}
                      className="rounded-lg p-2 text-brand-navy/50 hover:bg-brand-coral/10 hover:text-brand-coral"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

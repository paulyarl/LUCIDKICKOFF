"use client";

import { useEffect, useState } from "react";
import { repo } from "@/lib/api/repository";
import type { CategoryRow, ContentType } from "@/lib/api/server";

type Props = {
  contentType: ContentType;
  contentId: string;
  assigned: CategoryRow[];
};

// Multi-select chips bound to /api/admin/content-categories. The API calls
// the categorize_content RPC, so the DB re-checks admin/ownership itself.
export function CategoryPicker({ contentType, contentId, assigned }: Props) {
  const [all, setAll] = useState<CategoryRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(assigned.map((c) => c.id)),
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await repo.catalog.categories(undefined, 'id, slug, name, kind, sort_order');
      if (mounted) setAll((data ?? []) as CategoryRow[]);
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggle(cat: CategoryRow) {
    const on = !selected.has(cat.id);
    setBusy(cat.id);
    setError(null);
    setSaveState("saving");
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(cat.id);
      else next.delete(cat.id);
      return next;
    });
    try {
      const res = await fetch(
        on
          ? "/api/admin/content-categories"
          : `/api/admin/content-categories?contentType=${contentType}&contentId=${encodeURIComponent(contentId)}&categoryId=${cat.id}`,
        on
          ? {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ contentType, contentId, categoryId: cat.id }),
            }
          : { method: "DELETE" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed (${res.status})`);
      }
      setSaveState("saved");
    } catch (e: any) {
      setError(e?.message ?? "Failed to update categories");
      setSaveState("idle");
      setSelected((prev) => {
        const next = new Set(prev);
        if (on) next.delete(cat.id);
        else next.add(cat.id);
        return next;
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-card bg-white p-5 shadow-soft">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-heading text-lg font-bold">Categories</h3>
        <p className={`text-xs font-semibold ${error ? "text-brand-coral" : "text-brand-navy/50"}`}>
          {error
            ? "Changes could not be saved"
            : saveState === "saving"
              ? "Saving…"
              : saveState === "saved"
                ? "Saved"
                : "Changes save automatically"}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {all.map((c) => {
          const on = selected.has(c.id);
          return (
            <button
              key={c.id}
              type="button"
              disabled={busy === c.id}
              onClick={() => toggle(c)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition disabled:opacity-50 ${
                on
                  ? "bg-brand-teal text-white"
                  : "bg-brand-navy/5 text-brand-navy/60 hover:bg-brand-teal/10 hover:text-brand-teal"
              }`}
            >
              {c.name}
            </button>
          );
        })}
        {all.length === 0 && (
          <p className="text-sm text-brand-navy/50">No categories yet.</p>
        )}
      </div>
      {error && <p className="mt-3 text-sm font-semibold text-brand-coral">{error}</p>}
    </div>
  );
}

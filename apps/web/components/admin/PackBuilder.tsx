"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

type Item = { ref_id: string; title: string; position: number };
type Lesson = { id: string; title: string };

export function PackBuilder({
  packId,
  packTitle,
  items,
  lessons,
}: {
  packId: string;
  packTitle: string;
  items: Item[];
  lessons: Lesson[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const included = new Set(items.map((item) => item.ref_id));

  const call = async (key: string, url: string, init: RequestInit) => {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch(url, init);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Pack update failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pack update failed");
    } finally {
      setBusy(null);
    }
  };

  const add = (lessonId: string) =>
    call(`add:${lessonId}`, `/api/packs/${packId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lesson_id: lessonId }),
    });

  const remove = (ref: string) =>
    call(`remove:${ref}`, `/api/packs/${packId}/items?ref_id=${encodeURIComponent(ref)}`, {
      method: "DELETE",
    });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="space-y-3 rounded-card bg-white p-4 shadow-soft">
        <h2 className="font-heading text-sm font-bold">In “{packTitle}”</h2>
        {items.length === 0 ? (
          <p className="text-sm text-brand-navy/50">No lessons in this pack yet.</p>
        ) : (
          <ol className="space-y-2">
            {items.map((item, index) => (
              <li key={item.ref_id} className="flex items-center gap-2 rounded-card bg-brand-cream p-2">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-navy/10 text-[10px]">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{item.title}</span>
                <button
                  onClick={() => void remove(item.ref_id)}
                  disabled={busy === `remove:${item.ref_id}`}
                  aria-label="Remove lesson"
                  className="rounded-lg p-1 text-brand-coral disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="space-y-3 rounded-card bg-white p-4 shadow-soft">
        <h2 className="font-heading text-sm font-bold">Published lessons</h2>
        {lessons.length === 0 ? (
          <p className="text-sm text-brand-navy/50">No published lessons yet.</p>
        ) : (
          <ul className="space-y-2">
            {lessons.map((lesson) => (
              <li key={lesson.id} className="flex items-center gap-2 rounded-card bg-brand-cream p-2">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{lesson.title}</span>
                <button
                  onClick={() => void add(lesson.id)}
                  disabled={included.has(lesson.id) || busy === `add:${lesson.id}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-brand-teal px-2 py-1 text-[11px] font-bold text-white disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {included.has(lesson.id) ? "Added" : "Add"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error ? <p className="text-sm font-semibold text-brand-coral lg:col-span-2">{error}</p> : null}
    </div>
  );
}

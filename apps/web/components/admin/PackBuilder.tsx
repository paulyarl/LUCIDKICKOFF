"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Plus, Search, Trash2 } from "lucide-react";

type Item = { ref_id: string; title: string; position: number };
type Lesson = {
  id: string;
  title: string;
  status?: string;
  visibility?: string;
};

export function PackBuilder({
  packId,
  packTitle,
  items,
  lessons,
  basePath = "/admin/packs",
  backLabel = "Done — Back to Packs",
}: {
  packId: string;
  packTitle: string;
  items: Item[];
  lessons: Lesson[];
  basePath?: string;
  backLabel?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [lessonQuery, setLessonQuery] = useState("");
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const included = new Set(items.map((item) => item.ref_id));
  const isBusy = busy !== null;
  const statusLabel = error
    ? "Changes could not be saved"
    : saveState === "saving"
      ? "Saving changes…"
      : saveState === "saved"
        ? "All changes saved"
        : "Changes save automatically";

  const visibleLessons = useMemo(() => {
    const q = lessonQuery.trim().toLowerCase();
    if (!q) return lessons;
    return lessons.filter((lesson) => lesson.title.toLowerCase().includes(q));
  }, [lessons, lessonQuery]);

  const call = async (key: string, url: string, init: RequestInit) => {
    setBusy(key);
    setError(null);
    setSaveState("saving");
    try {
      const res = await fetch(url, init);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Pack update failed");
      setSaveState("saved");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pack update failed");
      setSaveState("idle");
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

  const move = (ref: string, direction: -1 | 1) => {
    const index = items.findIndex((item) => item.ref_id === ref);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= items.length) return;

    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);

    return call(`move:${ref}`, `/api/packs/${packId}/items`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref_ids: next.map((item) => item.ref_id) }),
    });
  };

  const createLesson = async (event: React.FormEvent) => {
    event.preventDefault();
    const title = newLessonTitle.trim();
    if (!title) return;

    setBusy("create-lesson");
    setError(null);
    setSaveState("saving");
    try {
      const lessonRes = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const lessonBody = await lessonRes.json().catch(() => ({}));
      if (!lessonRes.ok) throw new Error(lessonBody.error ?? "Could not create lesson");

      const lessonId = lessonBody.lesson?.id as string | undefined;
      if (!lessonId) throw new Error("Lesson was not created");

      const addRes = await fetch(`/api/packs/${packId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lesson_id: lessonId }),
      });
      const addBody = await addRes.json().catch(() => ({}));
      if (!addRes.ok) {
        throw new Error(addBody.error ?? "Lesson was created, but could not be added to this pack");
      }

      setNewLessonTitle("");
      setSaveState("saved");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create lesson");
      setSaveState("idle");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="space-y-3 rounded-card bg-white p-4 shadow-soft">
        <h2 className="font-heading text-sm font-bold">In “{packTitle}”</h2>
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-brand-navy/15 p-4">
            <p className="text-sm text-brand-navy/50">No lessons in this pack yet.</p>
            <p className="mt-1 text-xs text-brand-navy/45">
              Add an existing lesson or create one in the panel on the right.
            </p>
          </div>
        ) : (
          <ol className="space-y-2">
            {items.map((item, index) => (
              <li key={item.ref_id} className="flex items-center gap-2 rounded-card bg-brand-cream p-2">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-navy/10 text-[10px]">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{item.title}</span>
                <Link
                  href={`/author/lesson/${item.ref_id}`}
                  className="rounded-lg px-2 py-1 text-[11px] font-bold text-brand-teal hover:bg-brand-teal/10"
                >
                  Edit
                </Link>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => void move(item.ref_id, -1)}
                    disabled={index === 0 || isBusy}
                    aria-label={`Move ${item.title} up`}
                    className="rounded-lg p-1 text-brand-navy/60 hover:bg-brand-navy/5 disabled:opacity-30"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => void move(item.ref_id, 1)}
                    disabled={index === items.length - 1 || isBusy}
                    aria-label={`Move ${item.title} down`}
                    className="rounded-lg p-1 text-brand-navy/60 hover:bg-brand-navy/5 disabled:opacity-30"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={() => void remove(item.ref_id)}
                  disabled={isBusy}
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
        <div>
          <h2 className="font-heading text-sm font-bold">Add lessons</h2>
          <p className="text-xs text-brand-navy/50">
            Create a lesson in this pack, or search lessons you can use.
          </p>
        </div>

        <form onSubmit={createLesson} className="flex gap-2">
          <input
            value={newLessonTitle}
            onChange={(event) => setNewLessonTitle(event.target.value)}
            placeholder="New lesson title"
            className="min-w-0 flex-1 rounded-xl border border-brand-navy/15 bg-white px-3 py-2 text-sm text-brand-navy"
          />
          <button
            type="submit"
            disabled={isBusy || !newLessonTitle.trim()}
            className="inline-flex items-center gap-1 rounded-xl bg-brand-teal px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            {busy === "create-lesson" ? "Creating…" : "Create + add"}
          </button>
        </form>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-navy/35" />
          <input
            type="search"
            value={lessonQuery}
            onChange={(event) => setLessonQuery(event.target.value)}
            placeholder="Search available lessons…"
            className="w-full rounded-xl border border-brand-navy/15 bg-white py-2 pl-9 pr-3 text-sm text-brand-navy"
          />
        </div>

        {lessons.length === 0 ? (
          <p className="text-sm text-brand-navy/50">No lessons are available yet. Create one above.</p>
        ) : visibleLessons.length === 0 ? (
          <p className="text-sm text-brand-navy/50">No lessons match “{lessonQuery}”.</p>
        ) : (
          <ul className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {visibleLessons.map((lesson) => (
              <li key={lesson.id} className="flex items-center gap-2 rounded-card bg-brand-cream p-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{lesson.title}</p>
                  {lesson.status ? (
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-navy/40">
                      {lesson.status.replace("_", " ")}{lesson.visibility ? ` · ${lesson.visibility}` : ""}
                    </p>
                  ) : null}
                </div>
                <button
                  onClick={() => void add(lesson.id)}
                  disabled={included.has(lesson.id) || isBusy}
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

      <div className="flex flex-col gap-3 rounded-card bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between lg:col-span-2">
        <div>
          <p className="text-sm font-bold">Pack status</p>
          <p className={`text-xs font-semibold ${error ? "text-brand-coral" : "text-brand-navy/50"}`}>
            {statusLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={basePath}
            className="rounded-xl bg-brand-navy/5 px-4 py-2 text-sm font-bold text-brand-navy hover:bg-brand-navy/10"
          >
            {backLabel}
          </Link>
          <Link
            href={`/packs/${packId}`}
            className="rounded-xl bg-brand-teal px-4 py-2 text-sm font-bold text-white hover:bg-brand-teal/90"
          >
            View Pack
          </Link>
        </div>
      </div>

      {error ? <p className="text-sm font-semibold text-brand-coral lg:col-span-2">{error}</p> : null}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export function NewLessonForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not create lesson");
      router.push(`/author/lesson/${json.lesson.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create lesson");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={create} className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="New lesson title"
          className="min-w-[240px] flex-1 rounded-xl border border-brand-navy/15 bg-white px-3 py-2 text-sm text-brand-navy"
        />
        <button
          type="submit"
          disabled={busy || !title.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-teal px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> {busy ? "Creating…" : "New lesson"}
        </button>
      </div>
      {error ? <p className="text-xs font-semibold text-brand-coral">{error}</p> : null}
    </form>
  );
}

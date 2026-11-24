"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Action = "publish" | "promote" | "reject";

export function ReviewActions({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const act = async (action: Action) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Review action failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review action failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Review note (shown on rejection)"
        className="w-full rounded-xl border border-brand-navy/15 bg-white px-3 py-2 text-sm text-brand-navy"
      />
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => void act("publish")}
          disabled={busy}
          className="rounded-xl bg-brand-teal px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          Publish private
        </button>
        <button
          onClick={() => void act("promote")}
          disabled={busy}
          className="rounded-xl bg-brand-navy px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          Promote to catalog
        </button>
        <button
          onClick={() => void act("reject")}
          disabled={busy}
          className="rounded-xl bg-brand-coral px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          Reject
        </button>
      </div>
      {error ? <p className="text-xs font-semibold text-brand-coral">{error}</p> : null}
    </div>
  );
}

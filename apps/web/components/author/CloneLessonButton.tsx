"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";

export function CloneLessonButton({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clone = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/clone`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Clone failed");
      router.push(`/author/lesson/${json.lesson.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Clone failed");
      setBusy(false);
    }
  };

  return (
    <div className="text-right">
      <button
        onClick={() => void clone()}
        disabled={busy}
        className="inline-flex items-center gap-1 rounded-lg border border-brand-navy/15 px-2 py-1 text-xs font-semibold text-brand-navy/60 disabled:opacity-40"
      >
        <Copy className="h-3.5 w-3.5" /> {busy ? "Cloning…" : "Clone"}
      </button>
      {error ? <p className="mt-1 text-[10px] font-semibold text-brand-coral">{error}</p> : null}
    </div>
  );
}

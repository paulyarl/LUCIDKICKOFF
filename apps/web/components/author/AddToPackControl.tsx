"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PackOption = { id: string; title: string };

export function AddToPackControl({
  lessonId,
  packs,
  memberPackIds,
}: {
  lessonId: string;
  packs: PackOption[];
  memberPackIds: string[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const members = new Set(memberPackIds);
  const available = packs.filter((pack) => !members.has(pack.id));

  const choose = async (value: string) => {
    if (!value) return;
    if (value === "__new") {
      router.push(`/author/packs/new?lesson=${encodeURIComponent(lessonId)}`);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/packs/${value}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lesson_id: lessonId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not add lesson to pack");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add lesson to pack");
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <select
        value=""
        disabled={busy}
        onChange={(event) => void choose(event.target.value)}
        aria-label="Add lesson to pack"
        className="max-w-[150px] rounded-lg border border-brand-navy/15 bg-white px-2 py-1 text-xs font-semibold text-brand-navy disabled:opacity-50"
      >
        <option value="" disabled>
          {busy ? "Adding…" : "Add to pack…"}
        </option>
        {available.map((pack) => (
          <option key={pack.id} value={pack.id}>
            {pack.title}
          </option>
        ))}
        <option value="__new">New pack with this lesson…</option>
      </select>
      {memberPackIds.length > 0 ? (
        <span className="text-[10px] font-semibold text-brand-navy/40">
          In {memberPackIds.length} pack{memberPackIds.length === 1 ? "" : "s"}
        </span>
      ) : null}
      {error ? <span className="max-w-[180px] text-right text-[10px] font-semibold text-brand-coral">{error}</span> : null}
    </span>
  );
}

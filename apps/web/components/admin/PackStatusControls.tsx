"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PackStatusControls({
  packId,
  status,
  visibility,
}: {
  packId: string;
  status: string;
  visibility: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const update = async (action: "publish" | "draft", nextVisibility?: "private" | "catalog") => {
    const key = `${action}:${nextVisibility ?? ""}`;
    setBusy(key);
    setError(null);
    try {
      const res = await fetch(`/api/packs/${packId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, visibility: nextVisibility }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Pack status update failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pack status update failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="flex flex-col gap-3 rounded-card bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-heading text-sm font-bold">Publication</h2>
        <p className="text-xs font-semibold text-brand-navy/50">
          {status.replace("_", " ")} · {visibility}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {status !== "published" ? (
          <>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void update("publish", "private")}
              className="rounded-xl bg-brand-navy/10 px-3 py-2 text-xs font-bold text-brand-navy hover:bg-brand-navy/15 disabled:opacity-50"
            >
              {busy === "publish:private" ? "Publishing…" : "Publish privately"}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void update("publish", "catalog")}
              className="rounded-xl bg-brand-teal px-3 py-2 text-xs font-bold text-white hover:bg-brand-teal/90 disabled:opacity-50"
            >
              {busy === "publish:catalog" ? "Publishing…" : "Publish to catalog"}
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void update("draft")}
            className="rounded-xl bg-brand-navy/10 px-3 py-2 text-xs font-bold text-brand-navy hover:bg-brand-navy/15 disabled:opacity-50"
          >
            {busy === "draft:" ? "Updating…" : "Return to private draft"}
          </button>
        )}
      </div>
      {error ? <p className="text-xs font-semibold text-brand-coral sm:basis-full">{error}</p> : null}
    </section>
  );
}

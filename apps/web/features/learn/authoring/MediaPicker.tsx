"use client";

import { useState } from "react";
import { Library, Upload } from "lucide-react";
import { art } from "@/lib/art";

const LIBRARY = Object.entries(art)
  .filter(([id]) => !/^(avatar|badge|icon)\./.test(id))
  .map(([id, entry]) => ({ id, ...entry }));

export function MediaPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/media/upload", { method: "POST", body });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? "Upload failed");
      onChange(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2 rounded-card border border-brand-navy/10 p-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("library")}
          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold ${
            tab === "library" ? "bg-brand-teal/15 text-brand-teal" : "text-brand-navy/50"
          }`}
        >
          <Library className="h-3.5 w-3.5" /> Library
        </button>
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold ${
            tab === "upload" ? "bg-brand-teal/15 text-brand-teal" : "text-brand-navy/50"
          }`}
        >
          <Upload className="h-3.5 w-3.5" /> Upload
        </button>
      </div>

      {tab === "library" ? (
        <div className="grid max-h-64 grid-cols-5 gap-2 overflow-y-auto pr-1">
          {LIBRARY.map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => onChange(asset.src)}
              title={asset.id}
              className={`overflow-hidden rounded-lg border-2 ${
                value === asset.src ? "border-brand-teal" : "border-transparent"
              }`}
            >
              <img src={asset.src} alt={asset.alt} loading="lazy" className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-teal px-3 py-2 text-xs font-bold text-white">
            <Upload className="h-4 w-4" />
            {busy ? "Uploading…" : "Choose image"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) upload(file);
              }}
            />
          </label>
          <p className="text-[11px] text-brand-navy/50">PNG, JPEG or WebP · max 10 MB</p>
          {error ? <p className="text-xs font-semibold text-brand-coral">{error}</p> : null}
        </div>
      )}

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Or paste an image URL"
        className="w-full rounded-xl border border-brand-navy/15 bg-white px-3 py-2 text-xs text-brand-navy"
      />

      {value ? (
        <img src={value} alt="Selected media" className="h-20 w-full rounded-lg object-cover" />
      ) : null}
    </div>
  );
}

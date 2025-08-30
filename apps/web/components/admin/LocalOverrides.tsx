"use client";

import React, { useEffect, useMemo, useState } from "react";

function toPretty(value: any) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value ?? "");
  }
}

function parseMaybeArray(input: string): string[] | null {
  const trimmed = input.trim();
  if (!trimmed) return [];
  // Try JSON first
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {}
  // Fallback: CSV / newline-separated
  return trimmed
    .split(/\r?\n|,/) // split by newline or comma
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function LocalOverrides() {
  // lc_entitlements_<userId>
  const [userId, setUserId] = useState("");
  const [entitlementsInput, setEntitlementsInput] = useState<string>("[]");
  const entitlementsKey = useMemo(() => (userId ? `lc_entitlements_${userId}` : ""), [userId]);
  const [entitlementsExisting, setEntitlementsExisting] = useState<string>("");
  const [entitlementsError, setEntitlementsError] = useState<string>("");

  // lc_pack_templates_<packId>
  const [packId, setPackId] = useState("");
  const [templatesInput, setTemplatesInput] = useState<string>("[]");
  const packTemplatesKey = useMemo(() => (packId ? `lc_pack_templates_${packId}` : ""), [packId]);
  const [packTemplatesExisting, setPackTemplatesExisting] = useState<string>("");
  const [packTemplatesError, setPackTemplatesError] = useState<string>("");

  useEffect(() => {
    if (!entitlementsKey) {
      setEntitlementsExisting("");
      return;
    }
    try {
      const v = localStorage.getItem(entitlementsKey);
      setEntitlementsExisting(v ? toPretty(JSON.parse(v)) : "<none>");
    } catch {
      const v = localStorage.getItem(entitlementsKey);
      setEntitlementsExisting(v ?? "<none>");
    }
  }, [entitlementsKey]);

  useEffect(() => {
    if (!packTemplatesKey) {
      setPackTemplatesExisting("");
      return;
    }
    try {
      const v = localStorage.getItem(packTemplatesKey);
      setPackTemplatesExisting(v ? toPretty(JSON.parse(v)) : "<none>");
    } catch {
      const v = localStorage.getItem(packTemplatesKey);
      setPackTemplatesExisting(v ?? "<none>");
    }
  }, [packTemplatesKey]);

  const setEntitlements = () => {
    setEntitlementsError("");
    try {
      const arr = parseMaybeArray(entitlementsInput);
      if (arr == null) throw new Error("Invalid entitlements input");
      localStorage.setItem(entitlementsKey, JSON.stringify(arr));
      setEntitlementsExisting(toPretty(arr));
    } catch (e: any) {
      setEntitlementsError(e?.message ?? String(e));
    }
  };

  const setPackTemplates = () => {
    setPackTemplatesError("");
    try {
      const arr = parseMaybeArray(templatesInput);
      if (arr == null) throw new Error("Invalid templates input");
      localStorage.setItem(packTemplatesKey, JSON.stringify(arr));
      setPackTemplatesExisting(toPretty(arr));
    } catch (e: any) {
      setPackTemplatesError(e?.message ?? String(e));
    }
  };

  const clearKey = (key: string) => {
    if (!key) return;
    localStorage.removeItem(key);
    if (key === entitlementsKey) setEntitlementsExisting("<none>");
    if (key === packTemplatesKey) setPackTemplatesExisting("<none>");
  };

  return (
    <div className="space-y-10">
      <section className="space-y-3 border rounded-lg p-4 bg-white">
        <h2 className="text-lg font-semibold">User Entitlements</h2>
        <p className="text-sm text-gray-500">
          Sets <code>lc_entitlements_&lt;userId&gt;</code> to a JSON array of entitlement IDs.
          Input accepts JSON (e.g. ["ocean-life","jungle-safari"]) or CSV/newline list.
        </p>
        <div className="grid gap-2">
          <label className="text-sm font-medium">User ID</label>
          <input
            className="border rounded px-3 py-2"
            placeholder="e.g. 00000000-0000-0000-0000-000000000000"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Entitlements (JSON array or CSV)</label>
          <textarea
            className="border rounded px-3 py-2 min-h-24 font-mono"
            placeholder='["ocean-life","space-exploration"] or ocean-life, space-exploration'
            value={entitlementsInput}
            onChange={(e) => setEntitlementsInput(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={!userId}
            onClick={setEntitlements}
          >
            Save Entitlements
          </button>
          <button
            className="bg-gray-200 px-4 py-2 rounded disabled:opacity-50"
            disabled={!userId}
            onClick={() => clearKey(entitlementsKey)}
          >
            Clear
          </button>
        </div>
        {entitlementsError && (
          <p className="text-sm text-red-600">{entitlementsError}</p>
        )}
        {userId && (
          <div className="mt-2">
            <div className="text-sm text-gray-600">Current value:</div>
            <pre className="bg-gray-50 border rounded p-2 text-xs overflow-auto">
              {entitlementsExisting || "<none>"}
            </pre>
            <div className="text-xs text-gray-500 mt-1">Key: <code>{entitlementsKey}</code></div>
          </div>
        )}
      </section>

      <section className="space-y-3 border rounded-lg p-4 bg-white">
        <h2 className="text-lg font-semibold">Pack Templates</h2>
        <p className="text-sm text-gray-500">
          Sets <code>lc_pack_templates_&lt;packId&gt;</code> to a JSON array of template UUIDs.
          Input accepts JSON or CSV/newline list of IDs.
        </p>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Pack ID</label>
          <input
            className="border rounded px-3 py-2"
            placeholder="e.g. ocean-life"
            value={packId}
            onChange={(e) => setPackId(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Template IDs (JSON array or CSV)</label>
          <textarea
            className="border rounded px-3 py-2 min-h-24 font-mono"
            placeholder='["f6c9...","2a31..."] or f6c9..., 2a31...'
            value={templatesInput}
            onChange={(e) => setTemplatesInput(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={!packId}
            onClick={setPackTemplates}
          >
            Save Templates
          </button>
          <button
            className="bg-gray-200 px-4 py-2 rounded disabled:opacity-50"
            disabled={!packId}
            onClick={() => clearKey(packTemplatesKey)}
          >
            Clear
          </button>
        </div>
        {packTemplatesError && (
          <p className="text-sm text-red-600">{packTemplatesError}</p>
        )}
        {packId && (
          <div className="mt-2">
            <div className="text-sm text-gray-600">Current value:</div>
            <pre className="bg-gray-50 border rounded p-2 text-xs overflow-auto">
              {packTemplatesExisting || "<none>"}
            </pre>
            <div className="text-xs text-gray-500 mt-1">Key: <code>{packTemplatesKey}</code></div>
          </div>
        )}
      </section>

      <div className="text-xs text-gray-500">
        Tip: use with the dev impersonation page at <code>/dev/impersonate</code> to test different users.
      </div>
    </div>
  );
}

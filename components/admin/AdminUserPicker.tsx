"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type UserResult = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
};

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function AdminUserPicker({
  name = "userId",
  label = "Select User by Email",
  role,
  placeholder = "Search email...",
  required = true,
}: {
  name?: string;
  label?: ReactNode;
  role?: "parent" | "child";
  placeholder?: string;
  required?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<UserResult | null>(null);
  const [manualId, setManualId] = useState("");
  const listRef = useRef<HTMLUListElement>(null);

  const debounced = useDebounced(query, 250);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!debounced) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: debounced, limit: "20" });
        if (role) params.set("role", role);
        const res = await fetch(`/api/admin/users/search?${params.toString()}`);
        if (!res.ok) throw new Error(`Search failed: ${res.status}`);
        const data = (await res.json()) as { users: UserResult[] };
        if (!cancelled) setResults(data.users);
      } catch (e) {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [debounced, role]);

  const helperText = useMemo(() => {
    if (selected) return `${selected.email ?? "(no email)"}${selected.full_name ? ` · ${selected.full_name}` : ""}`;
    return loading ? "Searching..." : results.length ? `${results.length} result(s)` : query ? "No matches" : "";
  }, [selected, loading, results, query]);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>

      {/* Search input */}
      <Input
        type="search"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
      />
      <p className="text-xs text-muted-foreground min-h-[1rem]">{helperText}</p>

      {/* Results list */}
      {results.length > 0 && (
        <ul ref={listRef} className="max-h-56 overflow-auto border rounded-md divide-y">
          {results.map((u) => (
            <li key={u.id}>
              <Button
                type="button"
                variant={selected?.id === u.id ? "default" : "ghost"}
                className="w-full justify-start gap-2 rounded-none"
                onClick={() => {
                  setSelected(u);
                  setManualId("");
                }}
              >
                <span className="font-mono text-xs text-muted-foreground">{u.id.slice(0, 8)}…</span>
                <span>{u.email ?? "(no email)"}</span>
                {u.full_name && <span className="text-muted-foreground">· {u.full_name}</span>}
                {u.role && <span className="ml-auto text-xs uppercase text-primary/80">{u.role}</span>}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* Hidden form value bound to selection or manual */}
      <input type="hidden" name={name} value={selected?.id || manualId} required={required} />

      {/* Fallback manual entry */}
      <div className="space-y-1">
        <Label className="text-xs">Or enter User ID (UUID)</Label>
        <Input
          type="text"
          placeholder="00000000-0000-0000-0000-000000000000"
          value={manualId}
          onChange={(e) => {
            setManualId(e.target.value);
            if (e.target.value) setSelected(null);
          }}
        />
      </div>
    </div>
  );
}

export default AdminUserPicker;

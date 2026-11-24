"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function SetChildPinPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{4,6}$/.test(pin)) {
      setError("PIN must be 4–6 digits.");
      return;
    }
    if (pin !== confirm) {
      setError("PINs do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/children/${params.id}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not set PIN");
      router.push("/parent/children");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set PIN");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-brand-cream px-6 py-10 text-brand-navy">
      <div className="mx-auto max-w-md space-y-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Set learner PIN</h1>
          <p className="text-sm text-brand-navy/60">
            The PIN lets this learner switch profiles without a guardian session. Five failed
            attempts lock it for 15 minutes.
          </p>
        </div>

        <form onSubmit={save} className="space-y-4 rounded-panel bg-white p-5 shadow-soft">
          <label className="block text-xs font-semibold text-brand-navy/60">
            PIN (4–6 digits)
            <input
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
              className="mt-1 w-full rounded-xl border border-brand-navy/15 bg-white px-3 py-2 text-center text-lg tracking-[0.4em] text-brand-navy"
            />
          </label>
          <label className="block text-xs font-semibold text-brand-navy/60">
            Confirm PIN
            <input
              inputMode="numeric"
              maxLength={6}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value.replace(/\D/g, ""))}
              className="mt-1 w-full rounded-xl border border-brand-navy/15 bg-white px-3 py-2 text-center text-lg tracking-[0.4em] text-brand-navy"
            />
          </label>

          {error ? <p className="text-xs font-semibold text-brand-coral">{error}</p> : null}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-brand-coral px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save PIN"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-xl border border-brand-navy/15 px-4 py-2 text-sm font-semibold text-brand-navy/70"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

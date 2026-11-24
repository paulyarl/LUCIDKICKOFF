"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArtImage } from "@/components/frame/ArtImage";

const AVATARS = [
  "avatar.01",
  "avatar.02",
  "avatar.03",
  "avatar.04",
  "avatar.05",
  "avatar.06",
] as const;

export default function NewChildProfilePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [avatarId, setAvatarId] = useState<string>("avatar.01");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!nickname.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const avatarUrl = `/art/avatar/${avatarId}-256.webp`;
      const { error: rpcError } = await supabase.rpc("create_child_profile", {
        p_nickname: nickname.trim(),
        p_birthdate: birthdate || null,
        p_avatar_url: avatarUrl,
      });
      if (rpcError) throw new Error(rpcError.message);
      router.push("/parent/children");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create profile");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-brand-cream px-6 py-10 text-brand-navy">
      <div className="mx-auto max-w-lg space-y-5">
        <div>
          <h1 className="font-heading text-2xl font-bold">Create learner profile</h1>
          <p className="text-sm text-brand-navy/60">
            Add a new learner for your family account. Birth date stays private and helps keep
            content age-appropriate.
          </p>
        </div>

        <form onSubmit={create} className="space-y-4 rounded-panel bg-white p-5 shadow-soft">
          <label className="block text-xs font-semibold text-brand-navy/60">
            Display name
            <input
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              className="mt-1 w-full rounded-xl border border-brand-navy/15 bg-white px-3 py-2 text-sm text-brand-navy"
              placeholder="Jabari"
            />
          </label>

          <label className="block text-xs font-semibold text-brand-navy/60">
            Date of birth
            <input
              type="date"
              value={birthdate}
              onChange={(event) => setBirthdate(event.target.value)}
              className="mt-1 w-full rounded-xl border border-brand-navy/15 bg-white px-3 py-2 text-sm text-brand-navy"
            />
          </label>

          <div>
            <p className="text-xs font-semibold text-brand-navy/60">Avatar</p>
            <div className="mt-2 grid grid-cols-6 gap-2">
              {AVATARS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAvatarId(id)}
                  className={`overflow-hidden rounded-full border-2 ${
                    avatarId === id ? "border-brand-teal" : "border-transparent"
                  }`}
                >
                  <ArtImage id={id} className="h-12 w-12 rounded-full object-cover" sizes="48px" />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-brand-navy/5 p-3 text-xs text-brand-navy/60">
            Parent-managed information. The birth date is private and is not shown publicly.
          </div>

          {error ? <p className="text-xs font-semibold text-brand-coral">{error}</p> : null}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy || !nickname.trim()}
              className="rounded-xl bg-brand-coral px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {busy ? "Creating…" : "Continue"}
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

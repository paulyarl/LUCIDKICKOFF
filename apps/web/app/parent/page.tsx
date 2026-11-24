"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, Download, Palette, ShieldCheck, Timer, UserPlus, Users } from "lucide-react";
import type { FamilyChild } from "@/lib/family";
import { createClient } from "@/lib/supabase/client";

type Stats = { packs: number; lessons: number; artworks: number };

export default function ParentPage() {
  const [children, setChildren] = useState<FamilyChild[]>([]);
  const [packsByChild, setPacksByChild] = useState<Record<string, number>>({});
  const [stats, setStats] = useState<Stats>({ packs: 0, lessons: 0, artworks: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/family/children");
        const text = await res.text();
        let json: any = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch {
          throw new Error(`Family API returned ${res.status} with an invalid response`);
        }
        if (!res.ok) throw new Error(json?.error ?? `Family API returned ${res.status}`);
        const data = (json?.children ?? []) as FamilyChild[];
        if (!mounted) return;
        setChildren(data);

        const ids = data.map((child) => child.childProfileId).filter(Boolean);
        if (ids.length === 0) return;

        const supabase = createClient();
        const [packs, lessons, artworks, packRows] = await Promise.all([
          supabase
            .from("child_pack_assignments")
            .select("*", { count: "exact", head: true })
            .in("child_profile_id", ids),
          supabase
            .from("user_lesson_progress")
            .select("*", { count: "exact", head: true })
            .in("child_profile_id", ids),
          supabase
            .from("artworks")
            .select("*", { count: "exact", head: true })
            .in("child_profile_id", ids),
          supabase
            .from("child_pack_assignments")
            .select("child_profile_id")
            .in("child_profile_id", ids),
        ]);

        if (!mounted) return;
        setStats({
          packs: packs.count ?? 0,
          lessons: lessons.count ?? 0,
          artworks: artworks.count ?? 0,
        });
        const byChild: Record<string, number> = {};
        (packRows.data ?? []).forEach((row: any) => {
          byChild[row.child_profile_id] = (byChild[row.child_profile_id] ?? 0) + 1;
        });
        setPacksByChild(byChild);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load family");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const ageOf = (birthdate?: string | null) =>
    birthdate
      ? Math.floor((Date.now() - new Date(birthdate).getTime()) / 31557600000)
      : null;

  return (
    <main className="min-h-screen bg-brand-cream px-6 py-10 text-brand-navy">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl font-bold">Parent Console</h1>
            <p className="text-sm text-brand-navy/60">
              Manage your children’s learning, creativity, and safety on LucidCraft.
            </p>
          </div>
          <span className="rounded-full bg-brand-teal/15 px-3 py-1.5 text-xs font-bold text-brand-teal">
            Family account · synced
          </span>
        </header>

        {error ? (
          <p className="rounded-card bg-brand-coral/15 p-3 text-sm font-semibold text-brand-coral">{error}</p>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-4">
          {[
            { label: "Children", value: children.length, icon: Users },
            { label: "Packs assigned", value: stats.packs, icon: BookOpen },
            { label: "Lessons started", value: stats.lessons, icon: Palette },
            { label: "Creations", value: stats.artworks, icon: ShieldCheck },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-card bg-white p-4 shadow-soft">
              <Icon className="h-4 w-4 text-brand-teal" />
              <p className="mt-2 font-heading text-2xl font-bold">{loading ? "—" : value}</p>
              <p className="text-[11px] font-semibold text-brand-navy/50">{label}</p>
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold">Your children</h2>
            <Link href="/parent/children/new" className="inline-flex items-center gap-1 text-xs font-bold text-brand-teal">
              <UserPlus className="h-3.5 w-3.5" /> Add child
            </Link>
          </div>

          {loading ? <p className="text-sm text-brand-navy/50">Loading children…</p> : null}
          {!loading && children.length === 0 ? (
            <p className="rounded-card bg-white p-6 text-sm text-brand-navy/50 shadow-soft">
              No children linked yet. Add a learner profile to get started.
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((child) => {
              const age = ageOf(child.birthdate);
              return (
                <article key={child.id} className="space-y-3 rounded-card bg-white p-4 shadow-soft">
                  <div className="flex items-center gap-3">
                    {child.avatarUrl ? (
                      <img src={child.avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
                    ) : (
                      <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-teal/15 text-lg font-bold">
                        {child.email.slice(0, 1)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="truncate font-heading text-base font-bold">{child.email}</h3>
                      <p className="text-[11px] text-brand-navy/50">
                        {age !== null ? `Age ${age} · ` : ""}
                        {packsByChild[child.childProfileId] ?? 0} packs
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/parent/child/${child.id}`}
                      className="rounded-lg border border-brand-navy/15 px-2.5 py-1.5 text-[11px] font-bold text-brand-navy/70"
                    >
                      View
                    </Link>
                    <form action="/parent/impersonate" method="post">
                      <input type="hidden" name="childId" value={child.id} />
                      <button
                        type="submit"
                        className="rounded-lg bg-brand-teal px-2.5 py-1.5 text-[11px] font-bold text-white"
                      >
                        View as child
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-card bg-white p-4 shadow-soft">
            <h2 className="flex items-center gap-2 font-heading text-sm font-bold">
              <Timer className="h-4 w-4 text-brand-coral" /> Screen time
            </h2>
            <p className="mt-2 text-xs text-brand-navy/60">Daily limit is not set.</p>
            <Link href="/parent/time-limits" className="mt-3 inline-block text-xs font-bold text-brand-teal">
              Set time limits
            </Link>
          </div>

          <div className="rounded-card bg-white p-4 shadow-soft">
            <h2 className="flex items-center gap-2 font-heading text-sm font-bold">
              <ShieldCheck className="h-4 w-4 text-brand-teal" /> Safety & privacy
            </h2>
            <ul className="mt-2 space-y-1 text-xs text-brand-navy/60">
              <li>Child-safe community</li>
              <li>Sharing requires approval</li>
              <li>No personal information shared</li>
            </ul>
            <Link href="/parent/privacy" className="mt-3 inline-block text-xs font-bold text-brand-teal">
              Manage privacy
            </Link>
          </div>

          <div className="rounded-card bg-white p-4 shadow-soft">
            <h2 className="flex items-center gap-2 font-heading text-sm font-bold">
              <Download className="h-4 w-4 text-brand-ochre" /> Offline & downloads
            </h2>
            <p className="mt-2 text-xs text-brand-navy/60">Manage downloaded packs and storage.</p>
            <Link href="/downloads" className="mt-3 inline-block text-xs font-bold text-brand-teal">
              Open downloads
            </Link>
          </div>
        </section>

        <section className="rounded-card bg-white p-4 shadow-soft">
          <h2 className="font-heading text-sm font-bold">Quick actions</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Manage profiles", "/parent/children"],
              ["Assign content", "/parent/assign"],
              ["Choose learner", "/learners"],
              ["Author a lesson", "/author"],
              ["Learning progress", "/parent/activity"],
              ["Privacy & safety", "/parent/privacy"],
              ["Settings & sync", "/settings"],
              ["Downloads & offline", "/downloads"],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="rounded-xl bg-brand-cream px-3 py-2 text-center text-xs font-bold text-brand-navy/70 hover:bg-brand-teal/10"
              >
                {label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

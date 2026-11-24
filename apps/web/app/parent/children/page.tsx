"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { listChildren, type FamilyChild } from "@/lib/family";

export default function ParentChildrenPage() {
  const [children, setChildren] = useState<FamilyChild[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await listChildren();
        if (mounted) setChildren(data);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load children");
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
    <div className="container space-y-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Child Profiles</h1>
          <p className="text-sm text-muted-foreground">
            Create, edit and manage learner profiles for your family.
          </p>
        </div>
        <Button asChild>
          <Link href="/parent/children/new">+ Add child</Link>
        </Button>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!loading && !error ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => {
            const age = ageOf(child.birthdate);
            return (
              <div key={child.id} className="space-y-3 rounded-lg border bg-card p-4">
                <div className="flex items-center gap-3">
                  {child.avatarUrl ? (
                    <img src={child.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
                  ) : (
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/15 text-lg font-bold">
                      {child.email.slice(0, 1)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold">{child.email}</p>
                    {age !== null ? (
                      <p className="text-xs text-muted-foreground">Age {age}</p>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/parent/child/${child.id}`}>Edit profile</Link>
                  </Button>
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/parent/assign">Assign content</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/parent/children/${child.childProfileId}/pin`}>Set PIN</Link>
                  </Button>
                </div>
              </div>
            );
          })}

          <Link
            href="/parent/children/new"
            className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 p-4 text-sm font-semibold text-muted-foreground hover:bg-muted/30"
          >
            <span className="text-2xl">+</span>
            Add child
          </Link>
        </div>
      ) : null}
    </div>
  );
}

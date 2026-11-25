'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n/provider';
import BrandShell from "@/components/chrome/BrandShell";

type LibraryPayload = {
  packs?: { id: string; slug: string | null; title: string; cover_path: string | null; is_free: boolean }[];
  lessons?: { id: string; title: string; est_minutes: number | null }[];
  progress?: Record<string, { stepIndex: number; stars: number; passedSteps: number }>;
};

export default function ChildDashboardPage() {
  const { t } = useI18n();
  const [child, setChild] = useState<{ nickname: string; birthdate?: string | null } | null>(null);
  const [library, setLibrary] = useState<LibraryPayload | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/child/context')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (active && json?.child) setChild(json.child);
      })
      .catch(() => {});
    fetch('/api/child/library')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (active && json) setLibrary(json);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const age = child?.birthdate
    ? Math.floor((Date.now() - new Date(child.birthdate).getTime()) / 31557600000)
    : null;
  return (
    <BrandShell className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">
            {child ? `Hi, ${child.nickname}` : t('child.dashboard.title') || 'My Dashboard'}
          </h1>
          {age !== null ? <p className="text-sm text-brand-navy/60">Age {age}</p> : null}
        </div>
        <Button asChild variant="outline">
          <Link href="/child">{t('nav.home') || 'Home'}</Link>
        </Button>
      </div>

      {library && (library.lessons?.length || library.packs?.length) ? (
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-bold">{t('child.dashboard.continue') || 'Keep learning'}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {(library.lessons ?? []).map((lesson) => {
              const p = library.progress?.[lesson.id];
              return (
                <Link
                  key={lesson.id}
                  href={`/learn/lesson/${lesson.id}`}
                  className="flex items-center gap-3 rounded-card bg-white p-4 shadow-soft transition hover:shadow-md"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-teal/15 text-brand-teal">
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-heading text-sm font-bold text-brand-navy">
                      {lesson.title}
                    </span>
                    <span className="text-xs text-brand-navy/55">
                      {p && p.stepIndex > 0
                        ? `${t('child.dashboard.resume') || 'Resume'} · ${p.passedSteps} passed`
                        : lesson.est_minutes
                          ? `${lesson.est_minutes} min`
                          : t('child.dashboard.start') || 'Start'}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-brand-navy/40" />
                </Link>
              );
            })}
            {(library.packs ?? []).map((pack) => (
              <Link
                key={pack.id}
                href={pack.slug ? `/pack/${pack.slug}` : `/packs/${pack.id}`}
                className="flex items-center gap-3 rounded-card bg-white p-4 shadow-soft transition hover:shadow-md"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-heading text-sm font-bold text-brand-navy">
                    {pack.title}
                  </span>
                  <span className="text-xs text-brand-navy/55">{t('child.dashboard.pack') || 'Pack'}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-brand-navy/40" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('child.dashboard.library.title') || 'Library'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-brand-navy/60">{t('child.dashboard.library.desc') || 'Explore lessons, tutorials, and packs assigned to you.'}</p>
            <Button asChild className="w-full">
              <Link href="/child/library">{t('child.dashboard.library.cta') || 'Open Library'}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('child.dashboard.link.title') || 'Link with Parent'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-brand-navy/60">{t('child.dashboard.link.desc') || 'Generate a one-time code to link your account with a parent.'}</p>
            <Button asChild className="w-full">
              <Link href="/child/link">{t('child.dashboard.link.cta') || 'Generate Code'}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </BrandShell>
  );
}


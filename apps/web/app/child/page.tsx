'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n/provider';
import BrandShell from "@/components/chrome/BrandShell";

export default function ChildDashboardPage() {
  const { t } = useI18n();
  const [child, setChild] = useState<{ nickname: string; birthdate?: string | null } | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/child/context')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (active && json?.child) setChild(json.child);
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


'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n/provider';

export default function ChildDashboardPage() {
  const { t } = useI18n();
  return (
    <div className="container py-12 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('child.dashboard.title') || 'My Dashboard'}</h1>
        <Button asChild variant="outline">
          <Link href="/">{t('nav.home') || 'Home'}</Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('child.dashboard.library.title') || 'Library'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{t('child.dashboard.library.desc') || 'Explore lessons, tutorials, and packs assigned to you.'}</p>
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
            <p className="text-sm text-muted-foreground">{t('child.dashboard.link.desc') || 'Generate a one-time code to link your account with a parent.'}</p>
            <Button asChild className="w-full">
              <Link href="/child/link">{t('child.dashboard.link.cta') || 'Generate Code'}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


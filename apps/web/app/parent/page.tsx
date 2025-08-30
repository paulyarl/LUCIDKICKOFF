"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { listChildren } from '../../lib/family';
import { useI18n } from '@/lib/i18n/provider';

type ChildInfo = { id: string; email: string };

export default function ParentPage() {
  const { t } = useI18n();
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await listChildren();
        if (mounted) setChildren(data);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load children');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-8">{t('parent.dashboard.title') || 'Parent Dashboard'}</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-6 border rounded-lg">
          <h3 className="text-xl font-semibold mb-4">{t('parent.dashboard.children.title') || 'Children'}</h3>
          <div className="space-y-4">
            {loading && (
              <div className="text-sm text-muted-foreground">{t('common.loading') || 'Loading…'}</div>
            )}
            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}
            {!loading && !error && children.length === 0 && (
              <div className="text-sm text-muted-foreground">{t('parent.dashboard.children.empty') || 'No children linked yet.'}</div>
            )}
            {!loading && !error && children.map((child) => (
              <div key={child.id} className="flex items-center justify-between p-3 border rounded">
                {child.email === child.id ? (
                  <div className="flex items-baseline gap-2 truncate max-w-[60%]" title={child.id}>
                    <span className="truncate">{t('parent.children.unknownName') || 'Unnamed Child'}</span>
                    <span className="font-mono text-xs text-muted-foreground">({child.id.slice(0, 8)}…)</span>
                  </div>
                ) : (
                  <span className="truncate max-w-[60%]" title={child.email}>{child.email}</span>
                )}
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/parent/child/${child.id}`}>{t('common.view') || 'View'}</Link>
                  </Button>
                  <form action="/parent/impersonate" method="post">
                    <input type="hidden" name="childId" value={child.id} />
                    <Button type="submit" variant="secondary" size="sm">
                      {t('parent.viewAsChild') || 'View as child'}
                    </Button>
                  </form>
                </div>
              </div>
            ))}
            <Button asChild className="w-full">
              <Link href="/parent/link">{t('parent.dashboard.children.add') || 'Add Child'}</Link>
            </Button>
          </div>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="text-xl font-semibold mb-4">{t('parent.dashboard.controls.title') || 'Parental Controls'}</h3>
          <div className="space-y-4">
            <Button asChild variant="outline" className="w-full">
              <Link href="/parent/assign">{t('parent.dashboard.controls.assign') || 'Assign Content'}</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/parent/link">{t('parent.dashboard.controls.link') || 'Link a Child'}</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/parent/pin">{t('parent.dashboard.controls.pin') || 'Set/Change PIN'}</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/parent/time-limits">{t('parent.dashboard.controls.time_limits') || 'Set Time Limits'}</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/parent/activity">{t('parent.dashboard.controls.activity') || 'View Activity'}</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/parent/privacy">{t('parent.dashboard.controls.privacy') || 'Privacy Settings'}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

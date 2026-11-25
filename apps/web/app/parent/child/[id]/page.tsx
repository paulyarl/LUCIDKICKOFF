"use client";

import Link from 'next/link';
import { Button } from '../../../../components/ui/button';
import { useI18n } from '@/lib/i18n/provider';
import { useEffect, useMemo, useState } from 'react';

type Child = {
  id: string;
  childProfileId: string;
  nickname: string | null;
  avatarUrl: string | null;
  birthdate: string | null;
  active: boolean;
};

export default function ChildPage({ params }: { params: { id: string } }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [child, setChild] = useState<Child | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/children/${params.id}`, { credentials: 'include' });
        const text = await res.text();
        const body = text ? JSON.parse(text) : {};
        if (!res.ok) throw new Error(body.error || `Child lookup failed (${res.status})`);
        if (mounted) setChild(body.child);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load child');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [params.id]);

  const displayName = child?.nickname?.trim() || (t('parent.children.unknownName') || 'Unnamed Child');

  const ageYears = useMemo(() => {
    if (!child?.birthdate) return null;
    const bd = new Date(child.birthdate);
    if (isNaN(bd.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - bd.getFullYear();
    const m = now.getMonth() - bd.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < bd.getDate())) age--;
    return age < 0 ? null : age;
  }, [child?.birthdate]);

  const pinId = child?.childProfileId ?? params.id;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {child?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={child.avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-teal/15 text-xl font-bold text-brand-teal">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="font-heading text-3xl font-bold">{displayName}</h1>
            {loading ? (
              <p className="text-brand-navy/60">{t('common.loading') || 'Loading…'}</p>
            ) : error ? (
              <p className="text-sm font-semibold text-brand-coral">{error}</p>
            ) : (
              <p className="text-brand-navy/60">
                {ageYears != null ? (t('parent.child.age', { years: ageYears }) || `Age: ${ageYears} years`) : (t('parent.child.age', { years: '--' }) || 'Age: --')}
              </p>
            )}
          </div>
        </div>
        <Button asChild className="rounded-xl bg-brand-teal/10 font-bold text-brand-teal hover:bg-brand-teal/20">
          <Link href="/parent">{t('parent.child.back') || 'Back to Dashboard'}</Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-card bg-white p-6 shadow-soft">
          <h3 className="mb-4 font-heading text-lg font-bold">{t('parent.child.activity.title') || 'Activity'}</h3>
          <div className="space-y-2">
            <p>{t('parent.child.activity.lastActive', { value: '—' }) || `Last active: —`}</p>
            <p>{t('parent.child.activity.timeRemaining', { value: '—' }) || `Time remaining today: —`}</p>
          </div>
        </div>

        <div className="rounded-card bg-white p-6 shadow-soft">
          <h3 className="mb-4 font-heading text-lg font-bold">{t('parent.child.controls.title') || 'Controls'}</h3>
          <div className="space-y-3">
            <Button asChild className="w-full rounded-xl bg-brand-teal/10 font-bold text-brand-teal hover:bg-brand-teal/20">
              <Link href={`/parent/time-limits?childId=${pinId}`}>
                {t('parent.child.controls.adjustTime') || 'Adjust Time Limits'}
              </Link>
            </Button>
            <Button asChild className="w-full rounded-xl bg-brand-teal/10 font-bold text-brand-teal hover:bg-brand-teal/20">
              <Link href={`/parent/activity?childId=${pinId}`}>
                {t('parent.child.controls.viewActivity') || 'View Activity History'}
              </Link>
            </Button>
            <Button asChild className="w-full rounded-xl bg-brand-teal/10 font-bold text-brand-teal hover:bg-brand-teal/20">
              <Link href={`/parent/children/${pinId}/pin`}>
                {t('parent.child.controls.changePin') || 'Change PIN'}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

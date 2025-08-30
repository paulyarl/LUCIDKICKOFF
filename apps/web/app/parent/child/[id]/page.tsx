"use client";

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../../../components/ui/button';
import { useI18n } from '@/lib/i18n/provider';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ChildPage({ params }: { params: { id: string } }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ id: string; full_name: string | null; username: string | null; birthdate: string | null } | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, birthdate')
          .eq('id', params.id)
          .maybeSingle();
        if (error) throw error;
        if (process.env.NODE_ENV !== 'production') {
          console.debug('[ChildPage] Fetched profile', { paramsId: params.id, data });
        }
        if (mounted) setProfile(data as any);
      } catch (e: any) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[ChildPage] Error fetching profile', e);
        }
        if (mounted) setError(e?.message || 'Failed to load child');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [params.id]);

  const displayName = useMemo(() => {
    const hasFullName = !!(profile?.full_name && profile.full_name.trim());
    const hasUsername = !!(profile?.username && profile.username.trim());
    if (!hasFullName && !hasUsername) {
      return t('parent.children.unknownName') || 'Unnamed Child';
    }
    return hasFullName ? (profile!.full_name as string) : (profile!.username as string);
  }, [profile, t]);

  const ageYears = useMemo(() => {
    if (!profile?.birthdate) return null;
    const bd = new Date(profile.birthdate);
    if (isNaN(bd.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - bd.getFullYear();
    const m = now.getMonth() - bd.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < bd.getDate())) {
      age--;
    }
    return age < 0 ? null : age;
  }, [profile?.birthdate]);

  // If no profile exists, we still render with fallback (ID), matching parent list behavior.

  return (
    <div className="container py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{displayName}</h1>
          {/* Placeholder secondary info until real activity is wired */}
          {loading ? (
            <p className="text-muted-foreground">{t('common.loading') || 'Loading…'}</p>
          ) : error ? (
            <p className="text-destructive text-sm">{error}</p>
          ) : (
            <p className="text-muted-foreground">{ageYears != null ? (t('parent.child.age', { years: ageYears }) || `Age: ${ageYears} years`) : (t('parent.child.age', { years: '--' }) || 'Age: --')}</p>
          )}
        </div>
        <Button asChild variant="outline">
          <Link href="/parent">{t('parent.child.back') || 'Back to Dashboard'}</Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-6 border rounded-lg">
          <h3 className="text-xl font-semibold mb-4">{t('parent.child.activity.title') || 'Activity'}</h3>
          <div className="space-y-2">
            <p>{t('parent.child.activity.lastActive', { value: '—' }) || `Last active: —`}</p>
            <p>{t('parent.child.activity.timeRemaining', { value: '—' }) || `Time remaining today: —`}</p>
          </div>
        </div>
        
        <div className="p-6 border rounded-lg">
          <h3 className="text-xl font-semibold mb-4">{t('parent.child.controls.title') || 'Controls'}</h3>
          <div className="space-y-3">
            <Button asChild variant="outline" className="w-full">
              <Link href={`/parent/time-limits?childId=${params.id}`}>
                {t('parent.child.controls.adjustTime') || 'Adjust Time Limits'}
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/parent/activity?childId=${params.id}`}>
                {t('parent.child.controls.viewActivity') || 'View Activity History'}
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/parent/pin?childId=${params.id}`}>
                {t('parent.child.controls.changePin') || 'Change PIN'}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {process.env.NODE_ENV !== 'production' && (
        <div className="mt-8 p-4 border rounded-md bg-muted/30">
          <h4 className="font-semibold mb-2">Debug (dev only)</h4>
          <pre className="text-xs whitespace-pre-wrap break-all">
            {JSON.stringify({ params, loading, error, profile }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

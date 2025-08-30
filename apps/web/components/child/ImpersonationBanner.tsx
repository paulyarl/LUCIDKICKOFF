"use client";

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/provider';

export default function ImpersonationBanner() {
  const { t } = useI18n();
  useEffect(() => {
    (window as any).__IMPERSONATED = true;
    return () => {
      try { delete (window as any).__IMPERSONATED; } catch {}
    };
  }, []);

  return (
    <div className="w-full bg-amber-100 border-b border-amber-300 text-amber-900">
      <div className="container py-2 flex items-center justify-between gap-4">
        <div className="text-sm font-medium">
          {t('child.impersonation.banner') || 'Viewing as child'}
        </div>
        <form action="/child/stop-impersonating" method="post">
          <Button type="submit" size="sm" variant="destructive">
            {t('child.impersonation.stop') || 'Stop impersonating'}
          </Button>
        </form>
      </div>
    </div>
  );
}

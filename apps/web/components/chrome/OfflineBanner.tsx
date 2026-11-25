'use client';

import { CloudOff } from 'lucide-react';
import { useConnectivity } from '@/lib/offline/connectivity';

// Sprint 2.15 — offline banner. Heartbeat-verified, not navigator.onLine.
export function OfflineBanner() {
  const connectivity = useConnectivity();
  if (connectivity === 'online') return null;
  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-brand-navy px-4 py-2 text-xs font-bold text-white"
    >
      <CloudOff className="h-4 w-4" />
      You're offline — progress keeps saving on this device and syncs when you're back.
    </div>
  );
}

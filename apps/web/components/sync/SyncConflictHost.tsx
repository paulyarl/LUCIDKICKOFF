'use client';

import { useEffect, useState } from 'react';
import { ConflictResolver } from '@/components/sync/ConflictResolver';
import { resolveArtworkConflict } from '@/lib/sync/outbox';

type ConflictDetail = {
  opId: string;
  payload?: { key?: string; pngDataUrl?: string };
  serverUpdatedAt?: string;
};

/**
 * S3.4 — mounts the ConflictResolver dialog for artwork sync conflicts.
 * Both the foreground drain (outbox.ts) and the SW ('SYNC_CONFLICT'
 * postMessage via lib/sw/messaging) emit `lc-sync-conflict` window events.
 * Resolution: 'server' drops the local copy; 'local' re-enqueues it under a
 * new storage key — the "keep both" path.
 */
export function SyncConflictHost() {
  const [conflict, setConflict] = useState<ConflictDetail | null>(null);

  useEffect(() => {
    const onConflict = (event: Event) => {
      const detail = (event as CustomEvent<ConflictDetail>).detail;
      if (detail?.opId) setConflict(detail);
    };
    window.addEventListener('lc-sync-conflict', onConflict);
    return () => window.removeEventListener('lc-sync-conflict', onConflict);
  }, []);

  if (!conflict) return null;

  const key = conflict.payload?.key ?? 'artwork';
  return (
    <ConflictResolver
      conflict={{
        id: conflict.opId,
        type: 'version',
        serverVersion: {
          id: `server-${key}`,
          title: `${key} (server)`,
          updatedAt: conflict.serverUpdatedAt ?? new Date().toISOString(),
          width: 0,
          height: 0,
        },
        localVersion: {
          id: `local-${key}`,
          title: `${key} (this device)`,
          updatedAt: new Date().toISOString(),
          width: 0,
          height: 0,
          previewUrl: conflict.payload?.pngDataUrl,
        },
      }}
      onResolve={async (resolution) => {
        await resolveArtworkConflict(conflict.opId, resolution);
        setConflict(null);
      }}
      onDismiss={() => setConflict(null)}
    />
  );
}

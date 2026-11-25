'use client';

import { useEffect, useState } from 'react';
import { Cloud, Download, Trash2 } from 'lucide-react';
import {
  fetchPackManifest,
  formatBytes,
  getPackStatus,
  removePack,
  type PackRecord,
} from '@/lib/offline/packs';
import { startPackDownload } from '@/lib/offline/downloadManager';
import { useDeviceProfile } from '@/lib/offline/tier';

type Conn = { saveData?: boolean; effectiveType?: string; metered?: boolean };
const connection = (): Conn =>
  (navigator as unknown as { connection?: Conn }).connection ?? {};

/**
 * Sprint 2.6 — "Download for offline" control on pack detail.
 * D39 metered policy: hard-block on saveData, confirm on metered/slow links.
 */
export function PackOfflineButton({ slug }: { slug: string }) {
  const [phase, setPhase] = useState<'checking' | 'ready' | 'downloading' | 'done' | 'unavailable'>('checking');
  const [sizeBytes, setSizeBytes] = useState(0);
  const [record, setRecord] = useState<PackRecord | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { tier, profile } = useDeviceProfile();
  // L0 devices hold per-lesson buffers, not whole packs (D34/D35).
  const packDownloadsBlocked = profile !== null && tier === 'L0';

  const refresh = async () => {
    const status = await getPackStatus(slug);
    if (status.state === 'no-manifest') {
      setPhase('unavailable');
      return;
    }
    const manifest = await fetchPackManifest(slug);
    setSizeBytes(manifest?.size_bytes ?? 0);
    if (status.state === 'downloaded') {
      setRecord(status.record);
      setUpdateAvailable(status.updateAvailable);
      setPhase('done');
    } else {
      setPhase('ready');
    }
  };

  useEffect(() => {
    if ('serviceWorker' in navigator && 'indexedDB' in window) {
      refresh().catch(() => setPhase('unavailable'));
    } else {
      setPhase('unavailable');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const start = async () => {
    const conn = connection();
    if (conn.saveData) {
      setError('Data Saver is on — connect to unmetered Wi-Fi to download this pack.');
      return;
    }
    if ((conn.metered || conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g') &&
        !window.confirm(`This pack is ${formatBytes(sizeBytes)}. Download on a metered connection?`)) {
      return;
    }
    setError(null);
    setPhase('downloading');
    try {
      const rec = await startPackDownload(slug, ({ done, total }) => setProgress({ done, total }));
      setRecord(rec);
      setUpdateAvailable(false);
      setPhase('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
      setPhase('ready');
    }
  };

  if (phase === 'unavailable') return null;

  if (packDownloadsBlocked) {
    return (
      <p className="max-w-56 text-[11px] text-brand-navy/50">
        Lite mode on this device — lessons save one at a time when you open them.
      </p>
    );
  }

  if (phase === 'checking') {
    return <div className="h-9 w-44 animate-pulse rounded-pill bg-brand-navy/5" />;
  }

  if (phase === 'done' && record) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-brand-teal/15 px-3 py-1.5 text-xs font-bold text-brand-teal">
          <Cloud className="h-3.5 w-3.5" /> Available offline · {formatBytes(record.sizeBytes)}
        </span>
        {updateAvailable && (
          <button
            type="button"
            onClick={start}
            className="rounded-pill bg-brand-navy px-3 py-1.5 text-xs font-bold text-white"
          >
            Update available
          </button>
        )}
        <button
          type="button"
          aria-label="Remove offline copy"
          onClick={() => removePack(slug).then(() => { setRecord(null); setPhase('ready'); })}
          className="inline-flex items-center gap-1 rounded-pill px-2 py-1.5 text-xs text-brand-navy/50 hover:text-brand-navy"
        >
          <Trash2 className="h-3.5 w-3.5" /> Remove
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={start}
        disabled={phase === 'downloading'}
        className="inline-flex items-center gap-2 rounded-pill bg-brand-navy px-4 py-2 text-xs font-bold text-white shadow-soft transition hover:opacity-90 disabled:opacity-60"
      >
        <Download className="h-3.5 w-3.5" />
        {phase === 'downloading'
          ? `Downloading ${progress ? `${progress.done}/${progress.total}` : '…'}`
          : `Download for offline${sizeBytes ? ` · ${formatBytes(sizeBytes)}` : ''}`}
      </button>
      {phase === 'downloading' && progress && progress.total > 0 && (
        <div className="h-1.5 w-44 overflow-hidden rounded-full bg-brand-navy/10">
          <div
            className="h-full rounded-full bg-brand-teal transition-all"
            style={{ width: `${(progress.done / progress.total) * 100}%` }}
          />
        </div>
      )}
      {error && <p className="max-w-56 text-[11px] text-brand-coral">{error}</p>}
    </div>
  );
}

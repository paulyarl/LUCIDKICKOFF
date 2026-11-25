'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Cloud, RotateCcw, WifiOff } from 'lucide-react';
import { bufferLesson, isLessonBuffered } from '@/lib/offline/lessonBuffer';
import { fetchPackManifest, getPackStatus } from '@/lib/offline/packs';

type Phase =
  | { kind: 'checking' }
  | { kind: 'prefetch'; done: number; total: number }
  | { kind: 'failed'; error: string }
  | { kind: 'play' };

/**
 * Sprint 2.14 — L0 lesson buffer gate (D35). Before play, prefetch this
 * lesson's assets (manifest-verified) into a per-lesson cache so it survives
 * airplane mode. Skipped when the whole pack is already downloaded, the
 * buffer exists, or the lesson isn't in an exported pack. On prefetch failure
 * the child can retry or play anyway — caching policy differs per tier, the
 * product does not (D34).
 */
export function LessonBufferGate({
  lessonId,
  packSlug,
  steps,
  children,
}: {
  lessonId: string;
  packSlug: string | null;
  steps: Array<{ guide?: unknown; rubric?: unknown; hints?: unknown }>;
  children: ReactNode;
}) {
  const [phase, setPhase] = useState<Phase>({ kind: 'checking' });

  const prepare = async () => {
    setPhase({ kind: 'checking' });
    try {
      if (
        typeof caches === 'undefined' ||
        typeof indexedDB === 'undefined' ||
        !('serviceWorker' in navigator) ||
        !packSlug
      ) {
        setPhase({ kind: 'play' });
        return;
      }
      if (await isLessonBuffered(lessonId)) {
        setPhase({ kind: 'play' });
        return;
      }
      const [status, manifest] = await Promise.all([
        getPackStatus(packSlug).catch(() => null),
        fetchPackManifest(packSlug).catch(() => null),
      ]);
      if (!manifest) {
        setPhase({ kind: 'play' });
        return;
      }
      // Whole pack already in Cache Storage — assets serve cache-first.
      if (status?.state === 'downloaded' && !status.updateAvailable) {
        setPhase({ kind: 'play' });
        return;
      }
      setPhase({ kind: 'prefetch', done: 0, total: 0 });
      await bufferLesson(lessonId, manifest, steps, (done, total) =>
        setPhase({ kind: 'prefetch', done, total }),
      );
      setPhase({ kind: 'play' });
    } catch (err) {
      setPhase({
        kind: 'failed',
        error: err instanceof Error ? err.message : 'Download was interrupted',
      });
    }
  };

  useEffect(() => {
    void prepare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, packSlug]);

  if (phase.kind === 'play') return <>{children}</>;

  return (
    <div className="mx-auto max-w-md rounded-panel bg-white p-8 text-center shadow-soft">
      {phase.kind === 'failed' ? (
        <>
          <WifiOff className="mx-auto h-8 w-8 text-brand-ochre" />
          <p className="mt-3 font-heading text-lg font-bold text-brand-navy">
            Lesson isn&apos;t saved for offline yet
          </p>
          <p className="mt-1 text-sm text-brand-navy/60">{phase.error}</p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => void prepare()}
              className="inline-flex items-center gap-1.5 rounded-pill bg-brand-teal px-4 py-2 text-xs font-bold text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Try again
            </button>
            <button
              type="button"
              onClick={() => setPhase({ kind: 'play' })}
              className="rounded-pill bg-brand-navy/5 px-4 py-2 text-xs font-bold text-brand-navy"
            >
              Play anyway
            </button>
          </div>
        </>
      ) : (
        <>
          <Cloud className="mx-auto h-8 w-8 animate-pulse text-brand-teal" />
          <p className="mt-3 font-heading text-lg font-bold text-brand-navy">
            Getting your lesson ready…
          </p>
          <p className="mt-1 text-sm text-brand-navy/60">
            Saving the pictures so it works without internet.
          </p>
          <div className="mx-auto mt-4 h-2 w-48 overflow-hidden rounded-full bg-brand-navy/10">
            <div
              className="h-full rounded-full bg-brand-teal transition-all"
              style={{
                width:
                  phase.kind === 'prefetch' && phase.total > 0
                    ? `${(phase.done / phase.total) * 100}%`
                    : '15%',
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

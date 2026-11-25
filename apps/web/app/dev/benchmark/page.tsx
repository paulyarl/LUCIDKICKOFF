'use client';

import { useEffect, useRef, useState } from 'react';
import BrandShell from '@/components/chrome/BrandShell';

// Sprint 3.7 — PWA durability benchmark harness (D31 gate, D40 budgets).
// Run this page on the 2GB reference tablet + one mid-range device:
//   1. Open /dev/benchmark — device info + perf metrics collect automatically
//   2. Press "Run all" for the scripted durability checks
//   3. Force-close test: press the button, kill the app from recents, reopen
//      this page — the reload marker is verified and reported
//   4. Copy/download the JSON report for the spec's device matrix + budgets

const MARKER_KEY = 'lc-bench-reload-marker';

type BenchState = {
  device: Record<string, unknown> | null;
  perf: Record<string, unknown> | null;
  storage: Record<string, unknown> | null;
  durability: Record<string, unknown> | null;
  reloadTest: string;
  syncTest: string;
};

export default function BenchmarkPage() {
  const [state, setState] = useState<BenchState>({
    device: null, perf: null, storage: null, durability: null,
    reloadTest: 'idle', syncTest: 'idle',
  });
  const inpMax = useRef(0);
  const lcp = useRef(0);

  const patch = (p: Partial<BenchState>) => setState((s) => ({ ...s, ...p }));

  // --- automatic collection: device + perf observers ---
  useEffect(() => {
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { effectiveType?: string; saveData?: boolean; downlink?: number };
    };
    const ua = navigator.userAgent;
    patch({
      device: {
        userAgent: ua,
        platform: navigator.platform,
        chromeVersion: ua.match(/Chrome\/([\d.]+)/)?.[1] ?? null,
        androidVersion: ua.match(/Android ([\d.]+)/)?.[1] ?? null,
        deviceMemoryGB: nav.deviceMemory ?? null,
        hardwareConcurrency: navigator.hardwareConcurrency ?? null,
        screen: `${screen.width}x${screen.height} @${devicePixelRatio}x`,
        effectiveType: nav.connection?.effectiveType ?? null,
        saveData: nav.connection?.saveData ?? null,
        downlinkMbps: nav.connection?.downlink ?? null,
        swControlled: !!navigator.serviceWorker?.controller,
        collectedAt: new Date().toISOString(),
      },
    });

    // LCP + INP (event-timing) observers — keep maxima.
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) lcp.current = (e as PerformanceEntry & { startTime: number }).startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {}
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          const d = (e as PerformanceEntry & { duration: number }).duration;
          if (d > inpMax.current) inpMax.current = d;
        }
      }).observe({ type: 'event', buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
    } catch {}

    const collectPerf = () => {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      const scripts = performance.getEntriesByType('resource')
        .filter((r) => (r as PerformanceResourceTiming).initiatorType === 'script') as PerformanceResourceTiming[];
      const jsBytes = scripts.reduce((s, r) => s + (r.transferSize || r.encodedBodySize || 0), 0);
      const mem = (performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
      patch({
        perf: {
          jsBytesTransferred: jsBytes,
          jsFiles: scripts.length,
          domInteractiveMs: navEntry ? Math.round(navEntry.domInteractive) : null,
          loadEventEndMs: navEntry ? Math.round(navEntry.loadEventEnd) : null,
          lcpMs: lcp.current ? Math.round(lcp.current) : null,
          inpWorstMs: inpMax.current ? Math.round(inpMax.current) : null,
          jsHeapUsedMB: mem ? Math.round(mem.usedJSHeapSize / 1_048_576) : null,
          jsHeapLimitMB: mem ? Math.round(mem.jsHeapSizeLimit / 1_048_576) : null,
        },
      });
    };
    collectPerf();
    const t = setInterval(collectPerf, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- force-close reload test: detect marker on mount ---
  useEffect(() => {
    const marker = sessionStorage.getItem(MARKER_KEY);
    const persisted = localStorage.getItem(MARKER_KEY);
    if (persisted && !marker) {
      // Page reopened after kill: sessionStorage died (fresh session) but the
      // marker + IDB below prove durability of written state.
      patch({ reloadTest: `reopened after kill — marker intact (written ${persisted})` });
    } else if (persisted && marker) {
      patch({ reloadTest: 'marker present (same session)' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const armReloadTest = async () => {
    const stamp = new Date().toISOString();
    localStorage.setItem(MARKER_KEY, stamp);
    sessionStorage.setItem(MARKER_KEY, stamp);
    // Also write an IDB sentinel via the app's own DB.
    try {
      const req = indexedDB.open('lucidcraft');
      req.onsuccess = () => {
        const idb = req.result;
        if (idb.objectStoreNames.contains('progress')) {
          const tx = idb.transaction('progress', 'readwrite');
          tx.objectStore('progress').put({ key: 'lc-bench-sentinel', learnerKey: 'bench', lessonId: 'bench', stepIndex: 42, updatedAt: Date.now() });
        }
      };
    } catch {}
    patch({ reloadTest: `armed at ${stamp} — now force-close the app and reopen this page` });
  };

  const checkSentinel = async () => {
    const found = await new Promise<boolean>((res) => {
      const req = indexedDB.open('lucidcraft');
      req.onsuccess = () => {
        const idb = req.result;
        if (!idb.objectStoreNames.contains('progress')) return res(false);
        const q = idb.transaction('progress', 'readonly').objectStore('progress').get('lc-bench-sentinel');
        q.onsuccess = () => res(!!q.result);
        q.onerror = () => res(false);
      };
      req.onerror = () => res(false);
    });
    patch({ reloadTest: found ? 'PASS — IDB sentinel survived force-close' : 'FAIL — IDB sentinel missing' });
  };

  const runStorageChecks = async () => {
    const out: Record<string, unknown> = {};
    try {
      const est = await navigator.storage.estimate();
      out.quotaBytes = est.quota ?? null;
      out.usageBytes = est.usage ?? null;
    } catch { out.estimate = 'unsupported'; }
    try {
      out.persistedBefore = await navigator.storage.persisted();
      out.persistGrant = await navigator.storage.persist();
      out.persistedAfter = await navigator.storage.persisted();
    } catch { out.persist = 'unsupported'; }
    patch({ storage: out });
  };

  const runDurability = async () => {
    const out: Record<string, unknown> = {};
    // Cache write/read round-trip through the app's SWR cache path
    try {
      const cache = await caches.open('lucidkickoff-bench');
      await cache.put('/bench-sentinel', new Response('ok'));
      const hit = await cache.match('/bench-sentinel');
      out.cacheRoundTrip = (await hit?.text()) === 'ok';
      await caches.delete('lucidkickoff-bench');
    } catch (e) { out.cacheRoundTrip = String(e); }
    // IDB write throughput: 100 small progress writes
    try {
      const t0 = performance.now();
      await new Promise<void>((res, rej) => {
        const req = indexedDB.open('lucidcraft');
        req.onsuccess = () => {
          const idb = req.result;
          const tx = idb.transaction('progress', 'readwrite');
          const store = tx.objectStore('progress');
          for (let i = 0; i < 100; i++) {
            store.put({ key: `lc-bench-w-${i}`, learnerKey: 'bench', lessonId: `bench-${i}`, stepIndex: i, updatedAt: Date.now() });
          }
          tx.oncomplete = () => res();
          tx.onerror = () => rej(tx.error);
        };
        req.onerror = () => rej(req.error);
      });
      out.idbWrite100Ms = Math.round(performance.now() - t0);
      // cleanup
      const req = indexedDB.open('lucidcraft');
      req.onsuccess = () => {
        const idb = req.result;
        const tx = idb.transaction('progress', 'readwrite');
        for (let i = 0; i < 100; i++) tx.objectStore('progress').delete(`lc-bench-w-${i}`);
      };
    } catch (e) { out.idbWrite100Ms = String(e); }
    patch({ durability: out });
  };

  const runSyncCheck = async () => {
    patch({ syncTest: 'enqueuing probe op…' });
    const t0 = performance.now();
    try {
      const res = await fetch('/api/sync/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ops: [{ opId: `bench-${Date.now()}`, type: 'lesson_progress', payloadVersion: 1, payload: {} }] }),
      });
      patch({
        syncTest: `foreground drain RTT ${Math.round(performance.now() - t0)}ms — HTTP ${res.status}` +
          (res.status === 401 ? ' (unauth expected without login)' : ''),
      });
    } catch {
      patch({ syncTest: 'drain failed — offline' });
    }
  };

  const report = JSON.stringify(state, null, 2);

  return (
    <BrandShell className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">PWA durability benchmark</h1>
        <p className="text-sm text-brand-navy/60">
          Sprint 3.7 / D31 gate — run on the 2GB reference tablet and one mid-range device.
          Copy the report at the bottom into the sprint evidence notes.
        </p>
      </div>

      <section className="rounded-card bg-white p-4 shadow-soft">
        <h2 className="font-heading text-sm font-bold">Scripted checks</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={runStorageChecks} className="rounded-xl bg-brand-navy px-3 py-2 text-xs font-bold text-white">Storage + persist()</button>
          <button onClick={runDurability} className="rounded-xl bg-brand-navy px-3 py-2 text-xs font-bold text-white">Cache + IDB durability</button>
          <button onClick={runSyncCheck} className="rounded-xl bg-brand-navy px-3 py-2 text-xs font-bold text-white">Sync RTT (foreground)</button>
        </div>
      </section>

      <section className="rounded-card bg-white p-4 shadow-soft">
        <h2 className="font-heading text-sm font-bold">Force-close reload test</h2>
        <p className="mt-1 text-xs text-brand-navy/60">
          Arm, then kill the app/browser from recents and reopen this page, then verify.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button onClick={armReloadTest} className="rounded-xl bg-brand-coral px-3 py-2 text-xs font-bold text-white">Arm reload marker</button>
          <button onClick={checkSentinel} className="rounded-xl bg-brand-teal px-3 py-2 text-xs font-bold text-white">Verify sentinel</button>
          <span className="text-xs text-brand-navy/60">{state.reloadTest}</span>
        </div>
      </section>

      <section className="rounded-card bg-white p-4 shadow-soft">
        <h2 className="font-heading text-sm font-bold">Report</h2>
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => navigator.clipboard.writeText(report)}
            className="rounded-xl bg-brand-navy/10 px-3 py-1.5 text-xs font-bold text-brand-navy"
          >
            Copy JSON
          </button>
          <button
            onClick={() => {
              const blob = new Blob([report], { type: 'application/json' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `lucidcraft-benchmark-${Date.now()}.json`;
              a.click();
            }}
            className="rounded-xl bg-brand-navy/10 px-3 py-1.5 text-xs font-bold text-brand-navy"
          >
            Download JSON
          </button>
        </div>
        <pre className="mt-3 max-h-96 overflow-auto rounded-xl bg-brand-cream p-3 text-[11px]">{report}</pre>
      </section>
    </BrandShell>
  );
}

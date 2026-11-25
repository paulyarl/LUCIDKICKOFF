'use client';

import { useEffect, useState } from 'react';
import { Cloud, HardDrive, Pin, PinOff, Trash2 } from 'lucide-react';
import { repo } from '@/lib/api/repository';
import {
  formatBytes,
  getPackStatus,
  listDownloadedPacks,
  removePack,
  setPackPinned,
  type PackRecord,
} from '@/lib/offline/packs';
import { enforceBudget, getBudgetSnapshot, type BudgetSnapshot } from '@/lib/offline/budget';
import {
  cancelPackDownload,
  getActivePackDownloads,
  pausePackDownload,
  resumePackDownload,
} from '@/lib/offline/downloadManager';
import { importLcPack, type LcPackFile } from '@/lib/offline/packImport';
import type { PackDownloadRow } from '@/lib/offline/db';
import { useDeviceProfile, freeBytes, type Tier } from '@/lib/offline/tier';
import { PackOfflineButton } from '@/components/packs/PackOfflineButton';

const TIER_BLURB: Record<Tier, string> = {
  L0: 'Lite — lessons stream on demand',
  L1: 'Standard — packs download on demand',
  L2: 'Full offline — persistent storage',
};

type PackRow = { id: string; slug: string | null; title: string };

export default function DownloadsPage() {
  const { tier, profile } = useDeviceProfile();
  const [packs, setPacks] = useState<PackRow[]>([]);
  const [downloaded, setDownloaded] = useState<PackRecord[]>([]);
  const [active, setActive] = useState<PackDownloadRow[]>([]);
  const [updates, setUpdates] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [budget, setBudget] = useState<BudgetSnapshot | null>(null);

  const refreshActive = async () => {
    setActive(await getActivePackDownloads().catch(() => []));
  };

  const refreshDownloads = async () => {
    const records = await listDownloadedPacks();
    setDownloaded(records);
    setBudget(await getBudgetSnapshot().catch(() => null));
    let count = 0;
    for (const r of records) {
      const status = await getPackStatus(r.slug);
      if (status.state === 'downloaded' && status.updateAvailable) count += 1;
    }
    setUpdates(count);
  };

  useEffect(() => {
    repo.catalog
      .packs({ columns: 'id, slug, title' })
      .then((data) => setPacks((data ?? []) as PackRow[]));
    // S3.8 — sweep expired LRU packs back inside the budget on entry.
    enforceBudget().then(() => refreshDownloads()).catch(() => refreshDownloads());
    refreshActive();
    const timer = window.setInterval(refreshActive, 1500);
    return () => window.clearInterval(timer);
  }, []);

  const free = profile ? freeBytes(profile) : null;
  const downloadedBytes = downloaded.reduce((sum, r) => sum + r.sizeBytes, 0);
  const downloadedSet = new Set(downloaded.map((r) => r.slug));
  const available = packs.filter((p) => p.slug && !downloadedSet.has(p.slug));

  return (
    <main className="min-h-screen bg-brand-cream text-brand-navy">
      <div className="container space-y-6 py-8">
        <header>
          <h1 className="font-heading text-3xl font-bold">Offline Downloads</h1>
          <p className="text-sm text-brand-navy/60">
            Download packs to keep learning anywhere — even without internet.
          </p>
          <div className="mt-3">
            <label
              className={`inline-flex cursor-pointer items-center gap-2 rounded-pill border border-brand-navy/20 px-4 py-2 text-xs font-bold text-brand-navy transition hover:bg-brand-navy/5 ${importBusy ? 'opacity-50' : ''}`}
            >
              <input
                type="file"
                accept=".lcpack,application/json"
                className="hidden"
                disabled={importBusy}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (!f) return;
                  setImportBusy(true);
                  setImportError(null);
                  try {
                    const lcpack = JSON.parse(await f.text()) as LcPackFile;
                    await importLcPack(lcpack);
                    await Promise.all([refreshDownloads(), refreshActive()]);
                  } catch (err) {
                    setImportError(err instanceof Error ? err.message : 'Import failed');
                  } finally {
                    setImportBusy(false);
                  }
                }}
              />
              {importBusy ? 'Importing…' : 'Import pack file (.lcpack)'}
            </label>
            {importError && <p className="mt-1 text-[11px] text-brand-coral">{importError}</p>}
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-panel bg-white p-4 shadow-soft">
            <p className="text-xs font-bold text-brand-teal">Downloaded packs</p>
            <p className="mt-1 font-heading text-2xl font-bold">{downloaded.length}</p>
            <p className="text-[11px] text-brand-navy/50">{formatBytes(downloadedBytes)}</p>
          </div>
          <div className="rounded-panel bg-white p-4 shadow-soft">
            <p className="text-xs font-bold text-brand-ochre">Updates available</p>
            <p className="mt-1 font-heading text-2xl font-bold">{updates}</p>
            <p className="text-[11px] text-brand-navy/50">
              {updates ? 'New versions ready' : 'Everything is current'}
            </p>
          </div>
          <div className="rounded-panel bg-white p-4 shadow-soft">
            <p className="flex items-center gap-1 text-xs font-bold text-brand-navy/60">
              <HardDrive className="h-3.5 w-3.5" /> Device storage
            </p>
            <p className="mt-1 font-heading text-2xl font-bold">
              {profile?.usageBytes != null ? formatBytes(profile.usageBytes) : '—'}
              <span className="text-sm font-semibold text-brand-navy/40">
                {' '}/ {profile?.quotaBytes != null ? formatBytes(profile.quotaBytes) : '—'}
              </span>
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-navy/10">
              <div
                className="h-full rounded-full bg-brand-teal transition-all"
                style={{
                  width:
                    profile?.usageBytes != null && profile?.quotaBytes
                      ? `${Math.min(100, (profile.usageBytes / profile.quotaBytes) * 100)}%`
                      : '0%',
                }}
              />
            </div>
            <p className="mt-1 text-[11px] text-brand-navy/50">
              {free != null ? `${formatBytes(free)} free` : 'Storage estimate unavailable'}
            </p>
            {budget?.budgetBytes != null && (
              <p className="mt-0.5 text-[11px] text-brand-navy/50">
                Pack budget: {formatBytes(budget.packBytes)} / {formatBytes(budget.budgetBytes)}
                {budget.capBytes != null ? ' (guardian cap)' : ''}
              </p>
            )}
          </div>
        </div>

        {/* S2.13 — device tier + offline-ready indicator */}
        <div className="flex flex-wrap items-center gap-3 rounded-panel bg-white p-4 shadow-soft">
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-brand-teal/15 px-3 py-1.5 text-xs font-bold text-brand-teal">
            <Cloud className="h-3.5 w-3.5" /> {tier} · {TIER_BLURB[tier]}
          </span>
          {profile?.persisted === true && (
            <span className="rounded-pill bg-brand-ochre/15 px-3 py-1.5 text-xs font-bold text-brand-ochre">
              Persistent storage granted
            </span>
          )}
          {profile?.persisted === false && (
            <span className="rounded-pill bg-brand-navy/5 px-3 py-1.5 text-xs font-bold text-brand-navy/50">
              Storage not persistent — downloads may be evicted
            </span>
          )}
          {tier === 'L2' && (
            <span className="rounded-pill bg-brand-teal/15 px-3 py-1.5 text-xs font-bold text-brand-teal">
              Offline-ready
            </span>
          )}
        </div>

        {active.length > 0 && (
          <section className="space-y-2">
            <h2 className="font-heading text-lg font-bold">In progress</h2>
            {active.map((row) => {
              const pack = packs.find((p) => p.slug === row.slug);
              const pct = row.totalAssets > 0 ? Math.round((row.doneAssets.length / row.totalAssets) * 100) : 0;
              return (
                <article key={row.slug} className="rounded-panel bg-white p-3 shadow-soft">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-heading text-sm font-bold">{pack?.title ?? row.slug}</h3>
                      <p className="text-[11px] text-brand-navy/50">
                        {row.doneAssets.length}/{row.totalAssets} files · {row.state === 'paused' ? 'Paused' : 'Downloading'}
                      </p>
                    </div>
                    {row.state === 'paused' ? (
                      <button
                        type="button"
                        onClick={() =>
                          resumePackDownload(row.slug)
                            .then(() => refreshActive())
                            .then(refreshDownloads)
                            .catch(() => {})
                        }
                        className="rounded-pill bg-brand-teal px-3 py-1.5 text-[11px] font-bold text-white"
                      >
                        Resume
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => pausePackDownload(row.slug).then(refreshActive)}
                        className="rounded-pill bg-brand-navy/10 px-3 py-1.5 text-[11px] font-bold text-brand-navy"
                      >
                        Pause
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => cancelPackDownload(row.slug).then(refreshActive)}
                      className="rounded-pill px-2 py-1.5 text-[11px] font-semibold text-brand-navy/50 hover:text-brand-navy"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-navy/10">
                    <div className="h-full rounded-full bg-brand-teal transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {downloaded.length > 0 && (
          <section className="space-y-2">
            <h2 className="font-heading text-lg font-bold">Downloaded</h2>
            {downloaded.map((record) => {
              const pack = packs.find((p) => p.slug === record.slug);
              return (
                <article
                  key={record.slug}
                  className="flex flex-wrap items-center gap-3 rounded-panel bg-white p-3 shadow-soft"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-heading text-sm font-bold">
                      {pack?.title ?? record.slug}
                    </h3>
                    <p className="text-[11px] text-brand-navy/50">
                      {formatBytes(record.sizeBytes)} · v{record.version}
                      {record.pinned ? ' · Pinned' : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={record.pinned ? `Unpin ${record.slug}` : `Pin ${record.slug}`}
                    title={record.pinned ? 'Unpin — may be evicted when storage is low' : 'Pin — kept even when storage is low'}
                    onClick={() => setPackPinned(record.slug, !record.pinned).then(refreshDownloads)}
                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold ${
                      record.pinned ? 'text-brand-teal' : 'text-brand-navy/50 hover:text-brand-navy'
                    }`}
                  >
                    {record.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                    {record.pinned ? 'Unpin' : 'Pin'}
                  </button>
                  <span className="rounded-full bg-brand-teal/15 px-2.5 py-1 text-[11px] font-bold text-brand-teal">
                    Available offline
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${record.slug}`}
                    onClick={() => removePack(record.slug).then(refreshDownloads)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-brand-navy/50 hover:text-brand-navy"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </article>
              );
            })}
          </section>
        )}

        {available.length > 0 && (
          <section className="space-y-2">
            <h2 className="font-heading text-lg font-bold">Available to download</h2>
            {available.map((pack) => (
              <article
                key={pack.id}
                className="flex flex-wrap items-center gap-3 rounded-panel bg-white p-3 shadow-soft"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-heading text-sm font-bold">{pack.title}</h3>
                </div>
                <PackOfflineButton slug={pack.slug!} />
              </article>
            ))}
          </section>
        )}

        {tier === 'L0' && available.length > 0 && (
          <p className="text-[11px] text-brand-navy/50">
            This device is in Lite mode — downloads are limited. A guardian can override this in
            Settings.
          </p>
        )}
      </div>
    </main>
  );
}

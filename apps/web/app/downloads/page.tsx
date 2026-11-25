'use client';

import { useEffect, useState } from 'react';
import { Cloud, HardDrive, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  formatBytes,
  getPackStatus,
  listDownloadedPacks,
  removePack,
  type PackRecord,
} from '@/lib/offline/packs';
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
  const [updates, setUpdates] = useState(0);

  const refreshDownloads = async () => {
    const records = await listDownloadedPacks();
    setDownloaded(records);
    let count = 0;
    for (const r of records) {
      const status = await getPackStatus(r.slug);
      if (status.state === 'downloaded' && status.updateAvailable) count += 1;
    }
    setUpdates(count);
  };

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('packs')
      .select('id, slug, title')
      .then(({ data }) => setPacks((data ?? []) as PackRow[]));
    refreshDownloads();
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
                    </p>
                  </div>
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

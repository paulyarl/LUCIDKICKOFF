"use client";

import { useTheme } from "next-themes";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/provider";
import { setTierOverride } from "@/lib/offline/tier";
import BrandShell from "@/components/chrome/BrandShell";

function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-brand-navy/60">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          value ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            value ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { t } = useI18n();
  const [sound, setSound] = useState(true);
  const [animations, setAnimations] = useState(true);
  const [downloads, setDownloads] = useState(true);
  const [wifiOnly, setWifiOnly] = useState(true);
  const [offline, setOffline] = useState(true);
  const [language, setLanguage] = useState("en");
  const [tierOverride, setTierOverrideState] = useState<string>("auto");

  const save = (patch: Record<string, unknown>) => {
    void fetch("/api/profile/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  };

  useEffect(() => {
    let active = true;
    fetch("/api/profile/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!active || !json?.settings) return;
        const settings = json.settings as Record<string, unknown>;
        if (typeof settings.sound === "boolean") setSound(settings.sound);
        if (typeof settings.animations === "boolean") setAnimations(settings.animations);
        if (typeof settings.downloads === "boolean") setDownloads(settings.downloads);
        if (typeof settings.wifiOnly === "boolean") setWifiOnly(settings.wifiOnly);
        if (typeof settings.offline === "boolean") setOffline(settings.offline);
        if (typeof settings.language === "string") setLanguage(settings.language);
        if (typeof settings.tier_override === "string") setTierOverrideState(settings.tier_override);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const isLight = (resolvedTheme ?? theme) === "light";
  const isDark = (resolvedTheme ?? theme) === "dark";

  function Preview({ variant }: { variant: "light" | "dark" }) {
    const isVariantLight = variant === "light";
    return (
      <div
        className={
          isVariantLight
            ? "rounded-xl border bg-white text-slate-900 shadow-sm"
            : "rounded-xl border bg-slate-900 text-slate-50 shadow-sm"
        }
      >
        <div className="p-4 border-b border-white/10">
          <p className="text-sm opacity-80">{variant === "light" ? (t('settings.preview.light') ?? 'Light preview') : (t('settings.preview.dark') ?? 'Dark preview')}</p>
        </div>
        <div className="p-6 space-y-3">
          <div className="font-heading text-lg font-bold">{t('settings.preview.heading') ?? 'Heading contrast'}</div>
          <div className={isVariantLight ? "text-slate-700" : "text-slate-300"}>
            {t('settings.preview.body') ?? 'Body text should be readable against the background.'}
          </div>
          <div className="flex gap-3 pt-2">
            <Button size="sm" className={isVariantLight ? "" : "bg-white text-slate-900 hover:bg-white/90"}>
              {t('settings.preview.primary') ?? 'Primary'}
            </Button>
            <Button size="sm" variant="outline" className={isVariantLight ? "" : "border-slate-300 text-slate-200 hover:bg-slate-800"}>
              {t('settings.preview.outline') ?? 'Outline'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrandShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">{t('settings.title') ?? 'Settings'}</h1>
          <p className="text-brand-navy/60">{t('settings.subtitle') ?? 'Choose your theme preference.'}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('settings.appearance.title') ?? 'Appearance'}</CardTitle>
            <CardDescription>{t('settings.appearance.desc') ?? 'Switch between light and dark themes. System follows your OS setting.'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <Button
                variant={isLight ? "default" : "outline"}
                onClick={() => setTheme("light")}
                aria-pressed={isLight}
              >
                {t('settings.theme.light') ?? 'Light'}
              </Button>
              <Button
                variant={isDark ? "default" : "outline"}
                onClick={() => setTheme("dark")}
                aria-pressed={isDark}
              >
                {t('settings.theme.dark') ?? 'Dark'}
              </Button>
              <Button
                variant={!isLight && !isDark ? "default" : "outline"}
                onClick={() => setTheme("system")}
                aria-pressed={!isLight && !isDark}
              >
                {t('settings.theme.system') ?? 'System'}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Preview variant="light" />
              <Preview variant="dark" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>App settings</CardTitle>
            <CardDescription>Language, sound, animations and download behavior.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Language</p>
                <p className="text-xs text-brand-navy/60">Choose your app language.</p>
              </div>
              <select
                value={language}
                onChange={(event) => {
                  setLanguage(event.target.value);
                  save({ language: event.target.value });
                }}
                className="rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="en">English</option>
                <option value="sw">Kiswahili</option>
              </select>
            </div>
            <Toggle label="Sound & music" description="Play app sounds and background music." value={sound} onChange={(value) => { setSound(value); save({ sound: value }); }} />
            <Toggle label="Animations" description="Enable interactive animations and effects." value={animations} onChange={(value) => { setAnimations(value); save({ animations: value }); }} />
            <Toggle label="Allow downloads" description="Download packs for offline use." value={downloads} onChange={(value) => { setDownloads(value); save({ downloads: value }); }} />
            <Toggle label="Use Wi-Fi only" description="Download and sync only on Wi-Fi to save mobile data." value={wifiOnly} onChange={(value) => { setWifiOnly(value); save({ wifiOnly: value }); }} />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Offline mode</p>
                <p className="text-xs text-brand-navy/60">Override the device&apos;s detected download tier.</p>
              </div>
              <select
                value={tierOverride}
                onChange={(event) => {
                  const v = event.target.value;
                  setTierOverrideState(v);
                  setTierOverride(v as 'L0' | 'L1' | 'L2' | 'auto');
                  save({ tier_override: v });
                }}
                className="rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="auto">Auto-detect</option>
                <option value="L0">Lite — stream only</option>
                <option value="L1">Standard</option>
                <option value="L2">Full offline</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accessibility</CardTitle>
            <CardDescription>Make LucidCraft comfortable for every learner.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Text size", "Medium"],
                ["High contrast", "Off"],
                ["Touch support", "Enhanced"],
              ].map(([label, value]) => (
                <button
                  key={label}
                  type="button"
                  className="rounded-lg border p-3 text-left hover:bg-muted/40"
                >
                  <p className="text-xs text-brand-navy/60">{label}</p>
                  <p className="font-semibold">{value}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sync &amp; storage</CardTitle>
            <CardDescription>Keep progress, creations and downloads up to date across devices.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-primary/5 p-3">
              <p className="text-sm font-semibold text-primary">Syncing now…</p>
              <p className="text-xs text-brand-navy/60">Uploading 3 items, downloading 2 items</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[70%] rounded-full bg-primary" />
              </div>
            </div>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between"><span>Last sync</span><span className="font-semibold">Today, 10:24 AM</span></div>
              <div className="flex justify-between"><span>Pending uploads</span><span className="font-semibold">3 items (12 MB)</span></div>
              <div className="flex justify-between"><span>Pending downloads</span><span className="font-semibold">2 items (48 MB)</span></div>
              <div className="flex justify-between"><span>Storage used</span><span className="font-semibold">1.2 GB of 5 GB</span></div>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/downloads">Open Downloads &amp; Offline</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Offline mode</CardTitle>
            <CardDescription>Study, color and use downloaded packs without a connection.</CardDescription>
          </CardHeader>
          <CardContent>
            <Toggle label="Offline mode" description="Progress saves locally and syncs when online." value={offline} onChange={(value) => { setOffline(value); save({ offline: value }); }} />
          </CardContent>
        </Card>
      </div>
    </BrandShell>
  );
}

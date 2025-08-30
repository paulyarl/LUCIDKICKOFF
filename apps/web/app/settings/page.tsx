"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/provider";

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { t } = useI18n();

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
          <div className="text-xl font-semibold">{t('settings.preview.heading') ?? 'Heading contrast'}</div>
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
    <div className="container max-w-4xl py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('settings.title') ?? 'Settings'}</h1>
          <p className="text-muted-foreground">{t('settings.subtitle') ?? 'Choose your theme preference.'}</p>
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
      </div>
    </div>
  );
}

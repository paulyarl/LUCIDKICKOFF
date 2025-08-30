"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";

export default function LockedPackNotice({ packSlug }: { packSlug: string }) {
  const { t } = useI18n();
  return (
    <div className="mt-6 rounded-lg border border-border bg-surface p-6 text-center">
      <h2 className="text-xl font-semibold text-text-primary">
        {t('packs.locked.title')}
      </h2>
      <p className="mt-2 text-text-secondary">
        {t('packs.locked.description')}
      </p>
      <div className="mt-4 flex justify-center gap-3">
        <Button asChild>
          <Link href={`/auth?redirect=/pack/${packSlug}`}>{t('auth.signIn')}</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href={`/store/pack/${packSlug}`}>{t('packs.locked.purchaseCta')}</Link>
        </Button>
      </div>
    </div>
  );
}

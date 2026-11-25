'use client';

import { PackManager } from '../../components/packs/PackManager';
import Link from 'next/link';
import { Icons } from '../../components/icons';
import { useI18n } from '../../../../lib/i18n/provider';
import BrandShell from "@/components/chrome/BrandShell";

export default function PacksPage() {
  const { t } = useI18n();
  return (
    <BrandShell>
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-sm text-brand-navy/60 hover:text-foreground">
          <Icons.chevronLeft className="h-4 w-4 mr-2" />
          {t('nav.home') ?? 'Back to Dashboard'}
        </Link>
      </div>
      <h2 data-testid="packs-title" className="font-heading text-2xl font-bold mb-6">
        Educational Packs
      </h2>
      <PackManager />
    </BrandShell>
  );
}

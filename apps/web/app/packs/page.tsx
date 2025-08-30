'use client';

import { PackManager } from '../../components/packs/PackManager';
import Link from 'next/link';
import { Icons } from '../../components/icons';
import { useI18n } from '../../../../lib/i18n/provider';

export default function PacksPage() {
  const { t } = useI18n();
  return (
    <main role="main" className="container py-12">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <Icons.chevronLeft className="h-4 w-4 mr-2" />
          {t('nav.home') ?? 'Back to Dashboard'}
        </Link>
      </div>
      <h2 data-testid="packs-title" className="text-2xl font-bold mb-6">
        {t('packs.title') || 'Packs'}
      </h2>
      <PackManager />
    </main>
  );
}

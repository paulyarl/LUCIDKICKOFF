"use client";

import Link from 'next/link';
import { Button } from '../../components/ui/button';
import { useI18n } from '@/lib/i18n/provider';

export default function AdminPage() {
  const { t } = useI18n();

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-8">{t('admin.index.title') || 'Admin'}</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-6 border rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Dashboards</h3>
          <div className="space-y-4">
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/impersonate/parents">{t('nav.parent') || 'Parent Dashboard'}</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/impersonate/children">{t('nav.childLibrary') || 'Child Dashboard'}</Link>
            </Button>
          </div>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Admin Tools</h3>
          <div className="space-y-4">
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/templates">{t('admin.templates.title') || 'Templates'}</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/packs">{t('admin.packs.title') || 'Packs'}</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/entitlements">{t('admin.entitlements.title') || 'Entitlements'}</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/parents">{t('admin.tools.manageParents') || 'Manage Parents'}</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/children">{t('admin.tools.manageChildren') || 'Manage Children'}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";

export default function AdminLinks() {
  const { t } = useI18n();
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="p-6 border rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Dashboards</h3>
        <div className="space-y-4">
          <Link
            href="/admin/impersonate/parents"
            className="block w-full text-center px-4 py-2 border rounded-md hover:bg-gray-50 text-blue-600 hover:underline"
          >
            {t('parent.dashboard.title') || 'Parent Dashboard'}
          </Link>
          <Link
            href="/admin/impersonate/children"
            className="block w-full text-center px-4 py-2 border rounded-md hover:bg-gray-50 text-blue-600 hover:underline"
          >
            {t('child.dashboard.title') || 'Child Dashboard'}
          </Link>
        </div>
      </div>
      <div className="p-6 border rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Admin Tools</h3>
        <div className="space-y-4">
          <Link 
            href="/admin/templates" 
            className="block w-full text-center px-4 py-2 border rounded-md hover:bg-gray-50 text-blue-600 hover:underline"
          >
            {t('admin.templates.title') || 'Templates'}
          </Link>
          <Link 
            href="/admin/entitlements" 
            className="block w-full text-center px-4 py-2 border rounded-md hover:bg-gray-50 text-blue-600 hover:underline"
          >
            {t('admin.entitlements.title') || 'Entitlements'}
          </Link>
          <Link
            href="/admin/parents"
            className="block w-full text-center px-4 py-2 border rounded-md hover:bg-gray-50 text-blue-600 hover:underline"
          >
            {t('admin.tools.manageParents') || 'Manage Parents'}
          </Link>
          <Link
            href="/admin/children"
            className="block w-full text-center px-4 py-2 border rounded-md hover:bg-gray-50 text-blue-600 hover:underline"
          >
            {t('admin.tools.manageChildren') || 'Manage Children'}
          </Link>
        </div>
      </div>
    </div>
  );
}


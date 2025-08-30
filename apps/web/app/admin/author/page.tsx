'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LessonAuthoringWizard } from '../../../components/admin/LessonAuthoringWizard';
import { useI18n } from '@/lib/i18n/provider';

export default function AdminAuthorPage() {
  const { t } = useI18n();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const adminParam = searchParams.get('admin');
    
    if (adminParam === '1') {
      setIsAuthorized(true);
    } else {
      // Redirect to home if not authorized
      router.push('/');
      return;
    }
    
    setIsLoading(false);
  }, [searchParams, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" aria-label={t('common.loading') || 'Loading'}></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LC</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{t('admin.title') || 'LucidCraft Admin'}</h1>
                <p className="text-sm text-gray-500">{t('admin.author.subtitle') || 'Lesson Authoring Tool'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                {t('admin.mode') || 'Admin Mode'}
              </span>
              <Link
                href="/admin/local-overrides?admin=1"
                className="inline-flex items-center px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                {t('admin.local_overrides.link') || 'Local Overrides'}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LessonAuthoringWizard />
      </main>
    </div>
  );
}

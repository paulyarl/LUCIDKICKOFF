'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { pageview } from '@/lib/analytics';

export function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams?.toString()) {
        url += `?${searchParams.toString()}`;
      }
      pageview(url);
    }
  }, [pathname, searchParams]);

  return null;
}

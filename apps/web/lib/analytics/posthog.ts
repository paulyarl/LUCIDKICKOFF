'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, createElement } from 'react';
import type { ReactNode } from 'react';

// Config flags
const PH_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
const PH_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';
// Default: enabled unless explicitly set to 'false'
const ENABLED = (process.env.NEXT_PUBLIC_ENABLE_ANALYTICS ?? 'true') !== 'false' && !!PH_KEY;

// Initialize PostHog only in the browser and only when enabled with a valid key
if (typeof window !== 'undefined') {
  if (ENABLED) {
    posthog.init(PH_KEY, {
      api_host: PH_HOST,
      loaded: (ph) => {
        if (process.env.NODE_ENV === 'development') ph.debug();
      },
      capture_pageview: false,
      session_recording: {
        maskAllInputs: true,
        maskInputOptions: {
          password: true,
          email: true,
        },
      },
      autocapture: {
        dom_event_allowlist: ['click'],
        element_allowlist: ['button', 'a'],
        css_selector_allowlist: ['.ph-capture'],
      },
    });
  } else if (process.env.NODE_ENV === 'development') {
    // Avoid noisy console errors when no key is configured locally
    console.info('[Analytics] PostHog disabled (missing key or explicitly disabled).');
  }
}

interface Props {
  children: ReactNode;
}

export function PostHogProvider({ children }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (ENABLED && pathname && typeof window !== 'undefined') {
      let url = window.origin + pathname;
      if (searchParams?.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthog.capture('$pageview', {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  // If analytics are disabled, avoid mounting the provider and just render children
  if (!ENABLED) return children as any;

  return createElement(PHProvider as any, { client: posthog }, children);
}

export { posthog };


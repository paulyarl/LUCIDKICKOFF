'use client';

import React, { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Montserrat, Open_Sans } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '../components/theme-provider';
import { PWAProvider } from '../components/pwa/PWAProvider';
import { PostHogProvider } from '../lib/analytics/posthog';
import { I18nProvider } from '@/lib/i18n/provider';
import { initSentry } from '../lib/analytics/sentry';
import { Button } from '../components/ui/button';
import { Toaster } from '../components/ui/toast';
import { AppHeader } from '../components/layout/AppHeader';

// Extend Window interface to include PostHog and Sentry
declare global {
  interface Window {
    posthog?: any;
    Sentry?: any;
  }
}

// Initialize Sentry - temporarily disabled to fix OpenTelemetry module error
// if (process.env.NODE_ENV === 'production') {
//   initSentry();
// }

// Track page views in PostHog
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && typeof window !== 'undefined') {
      let url = window.origin + pathname;
      if (searchParams?.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      
      // Add type declaration for posthog on window
      const posthog = (window as any).posthog;
      if (posthog) {
        posthog.capture('$pageview', {
          $current_url: url,
        });
      }
    }
  }, [pathname, searchParams]);

  return null;
}

// Error boundary for Sentry
class ErrorBoundary extends React.Component<{ children: React.ReactNode }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by error boundary:', error, errorInfo);
    if (process.env.NODE_ENV === 'production') {
      // Add type declaration for Sentry on window
      const Sentry = (window as any).Sentry;
      if (Sentry) {
        Sentry.captureException(error, {
          contexts: { react: { componentStack: errorInfo.componentStack } },
        });
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
          <h1 className="mb-4 text-2xl font-bold">Something went wrong</h1>
          <p className="mb-6 text-muted-foreground">
            We're sorry for the inconvenience. The error has been reported and we're working on fixing it.
          </p>
                              <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </div>
      );
    }

    return this.props.children;
  }
}

const montserrat = Montserrat({ 
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const openSans = Open_Sans({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${montserrat.variable} ${openSans.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <PostHogProvider>
              <I18nProvider>
                <PWAProvider>
                  <Suspense fallback={null}>
                    <PostHogPageView />
                  </Suspense>
                  <AppHeader />
                  {children}
                  <Toaster />
                </PWAProvider>
              </I18nProvider>
            </PostHogProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Montserrat, Open_Sans } from 'next/font/google';
import { ReactNode, Suspense } from 'react';
import { Providers } from './providers';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/error-boundary';
import { Analytics } from '@/components/analytics';
import { SkipLink } from '@/components/i18n/SkipLink';
import { AppTitle, MainNavLabel } from '@/components/i18n/HeaderTexts';
import { LocalizedLoading } from '@/components/i18n/LocalizedLoading';
import { headers } from 'next/headers';

// Load fonts with optimized performance
const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
});

const openSans = Open_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'LucidCraft',
  description: 'Guest-first creative canvas',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'LucidCraft - Creative Canvas',
    description: 'A guest-first creative canvas application',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LucidCraft',
    description: 'Guest-first creative canvas',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5, // Allow some zoom for accessibility
  userScalable: true,
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#121212' },
  ],
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(montserrat.variable, openSans.variable)}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}


import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LucidCraft',
  description: 'Your creative space',
  generator: 'Next.js',
  manifest: '/manifest.json',
  keywords: ['art', 'drawing', 'collaboration', 'sketch'],
  authors: [{ name: 'LucidCraft Team' }],
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  icons: [
    { rel: 'apple-touch-icon', url: '/icons/icon-192x192.png' },
    { rel: 'icon', url: '/favicon.ico' },
  ],
};

export default metadata;

const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Allow importing code from outside this app directory (monorepo/root shared code)
    externalDir: true,
    // Enable webpack build worker for better performance
    webpackBuildWorker: true,
  },
  images: {
    // Allow images from Supabase Storage buckets
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Aliases for module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/apps/web': path.resolve(__dirname, '.'),
      '@/components': path.resolve(__dirname, 'components'),
      '@/lib': path.resolve(__dirname, '../../lib'),
      '@/styles': path.resolve(__dirname, '../../styles'),
      'react-konva': 'react-konva',
      'konva': 'konva',
      'canvas': false,
    };

    // Handle canvas module for server-side rendering
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        path: false,
      };
    }

    // Exclude canvas from being processed by Next.js in the browser
    if (!isServer) {
      if (!Array.isArray(config.externals)) {
        config.externals = [];
      }
      config.externals.push({
        canvas: 'canvas',
      });
    }

    return config;
  },
  // Disable server-side rendering for Konva components
  reactStrictMode: true,
  // Enable static exports for better deployment
  output: 'standalone',
};

// Injected content via Sentry wizard below

module.exports = nextConfig;

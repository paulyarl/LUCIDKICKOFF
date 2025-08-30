const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Allow importing code from outside this app directory (monorepo/root shared code)
    externalDir: true,
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
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/apps/web': path.resolve(__dirname, '.'),
      '@/components': path.resolve(__dirname, '../../components'),
      '@/lib': path.resolve(__dirname, '../../lib'),
      '@/styles': path.resolve(__dirname, '../../styles'),
    };
    return config;
  },
};

module.exports = nextConfig;

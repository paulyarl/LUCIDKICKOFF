const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    externalDir: true,
  },
  webpack: (config) => {
    // Force browser build of konva and ignore Node-only 'canvas' module
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // Monorepo root aliases (match tsconfig paths)
      '@/apps/web': path.resolve(__dirname, 'apps/web'),
      '@/components': path.resolve(__dirname, 'components'),
      '@/lib': path.resolve(__dirname, 'lib'),
      '@/styles': path.resolve(__dirname, 'styles'),
      // Avoid server-only canvas package
      canvas: false,
    };
    
    // Externalize problematic packages for client-side only
    config.externals = config.externals || [];
    if (config.isServer) {
      config.externals.push('react-konva', 'konva');
    }
    // Prefer browser entry fields when resolving
    config.resolve.mainFields = ['browser', 'module', 'main'];
    return config;
  },
};

module.exports = nextConfig;

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['vitest.setup.ts'],
    include: [
      'tests/components/**/*.spec.tsx',
      'tests/unit/**/*.spec.ts',
      'tests/unit/**/*.spec.tsx',
    ],
    exclude: [
      'tests/e2e/**',
      'tests/a11y/**',
      'tests/high-value/**',
      'tests/offline/**',
      'tests/**/playwright/**',
      'tests/**/smoke-*.spec.ts',
      'tests/**/routes-smoke.spec.ts',
      'tests/**/basic.test.ts',
    ],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportOnFailure: true,
      all: false,
      exclude: [
        '**/node_modules/**',
        '**/tests/**',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      // Special-case icons to the app's icons module
      '@/components/icons': path.resolve(__dirname, 'apps/web/components/icons.tsx'),
      // Root-level shared components
      '@/components': path.resolve(__dirname, 'components'),
      // App-specific components under apps/web
      '@/apps/web': path.resolve(__dirname, 'apps/web'),
      '@/lib': path.resolve(__dirname, 'lib'),
      '@/styles': path.resolve(__dirname, 'apps/web/styles'),
      // Force single React copy across monorepo
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      // Ensure subpackage-local node_modules don't pull extra React copies
      'apps/web/node_modules/react': path.resolve(__dirname, 'node_modules/react'),
      'apps/web/node_modules/react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      // jsx-runtime must also be unified
      'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime.js'),
      'apps/web/node_modules/react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime.js'),
    },
    // Ensure only one React instance is used during tests
    dedupe: ['react', 'react-dom'],
  },
  // Ensure esbuild uses the automatic JSX runtime so we don't need React in scope
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
    loader: 'tsx',
    tsconfigRaw: {
      compilerOptions: {
        jsx: 'react-jsx',
        jsxImportSource: 'react',
      },
    },
  },
});

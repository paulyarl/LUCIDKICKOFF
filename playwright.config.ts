/// <reference types="@playwright/test" />
import { defineConfig, devices } from '@playwright/test';

// Test data
const TEST_USERS = {
  guest: {
    email: 'guest@example.com',
    password: 'guest123',
    storageState: 'playwright/.auth/guest.json',
  },
  parent: {
    email: 'parent@example.com',
    password: 'parent123',
    storageState: 'playwright/.auth/parent.json',
  },
  child: {
    email: 'child@example.com',
    password: 'child123',
    storageState: 'playwright/.auth/child.json',
  },
};

export default defineConfig({
  testDir: './tests',
  testMatch: ['smoke/**/*.spec.ts'],
  // Only run true Playwright E2E specs. Ignore unit/Jest/Vitest-style tests and heavy suites by default.
  testIgnore: [
    'tests/unit/**',
    'tests/components/**',
    'tests/**/*.test.ts',
    'tests/**/*.test.tsx',
    'tests/auth.test.tsx',
    'tests/analytics/**',
    'tests/high-value/**',
    'tests/export/**',
    'tests/pack/**',
  ],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    // Tablet - 16:10 aspect ratio (1920x1200)
    {
      name: 'tablet-16-10',
      use: {
        ...devices['Desktop Chrome'],
        deviceScaleFactor: 2,
        viewport: { width: 1920, height: 1200 },
        isMobile: false,
        hasTouch: true,
        defaultBrowserType: 'chromium',
      },
    },
    // Mobile - 19.5:9 aspect ratio (1170x2532)
    {
      name: 'mobile-19-5-9',
      use: {
        ...devices['iPhone 15 Pro'],
        deviceScaleFactor: 3,
        viewport: { width: 1170, height: 2532 },
        isMobile: true,
        hasTouch: true,
        defaultBrowserType: 'webkit',
      },
    },
    // Auth setup
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
  ],
  // Global setup for authentication
  // globalSetup: require.resolve('./playwright/global-setup'),
  // Configure web server for testing
  webServer: {
    command: 'npm --prefix apps/web run dev -- -p 3000', // force 3000
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 120_000,
  },
});

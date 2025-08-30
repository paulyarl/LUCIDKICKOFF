import { test, expect } from '@playwright/test';

// Feature flag schema
type FeatureFlag = {
  name: string;
  defaultValue: boolean;
  description: string;
};

const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  community: {
    name: 'community',
    defaultValue: false,
    description: 'Enables community features',
  },
  i18n: {
    name: 'i18n',
    defaultValue: false,
    description: 'Enables internationalization',
  },
};

test.describe('Feature Flags', () => {
  test('should have correct default values', async ({ page }) => {
    // Test each feature flag default
    for (const [key, flag] of Object.entries(FEATURE_FLAGS)) {
      await page.goto('/');
      
      // Check if feature is disabled by default
      const isEnabled = await page.evaluate((feature) => {
        return window.__FEATURES__?.[feature] ?? false;
      }, key);
      
      expect(isEnabled).toBe(flag.defaultValue);
    }
  });

  test('should 404 on gated routes when feature is off', async ({ page }) => {
    const gatedRoutes = [
      { path: '/community', flag: 'community' },
      { path: '/settings/language', flag: 'i18n' },
    ];

    for (const { path, flag } of gatedRoutes) {
      await page.goto(path);
      
      // Should show 404 when feature is off
      if (!FEATURE_FLAGS[flag].defaultValue) {
        await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
      }
    }
  });

  test('should toggle features without page reload', async ({ page }) => {
    // Mock feature flags API
    await page.route('/api/features', (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          features: {
            community: true,
            i18n: true,
          },
        }),
      });
    });

    // Enable features
    await page.evaluate(() => {
      window.__ENABLE_FEATURE__('community');
      window.__ENABLE_FEATURE__('i18n');
    });

    // Verify features are enabled
    const features = await page.evaluate(() => ({
      community: window.__FEATURES__.community,
      i18n: window.__FEATURES__.i18n,
    }));

    expect(features.community).toBe(true);
    expect(features.i18n).toBe(true);

    // Verify no full page reload happened
    const navigationCount = await page.evaluate(
      () => window.performance.getEntriesByType('navigation').length
    );
    expect(navigationCount).toBe(1);
  });

  test('should not leak feature flags between environments', async ({ page }) => {
    // Mock production environment
    await page.route('**', (route) => {
      const headers = { ...route.request().headers() };
      headers['x-env'] = 'production';
      route.continue({ headers });
    });

    await page.goto('/');
    
    // In production, feature flags should be off regardless of local state
    const features = await page.evaluate(() => ({
      community: window.__FEATURES__.community,
      i18n: window.__FEATURES__.i18n,
    }));

    expect(features.community).toBe(false);
    expect(features.i18n).toBe(false);
  });
});

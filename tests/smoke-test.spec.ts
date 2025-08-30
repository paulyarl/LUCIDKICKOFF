// @ts-nocheck
// This is a smoke test to verify Playwright setup

import { test, expect } from '@playwright/test'

// Test will be type-checked at runtime by Playwright
test('basic test', async ({ page }) => {
  try {
    await page.goto('https://playwright.dev/');
    const title = await page.title();
    expect(title).toContain('Playwright');
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
});

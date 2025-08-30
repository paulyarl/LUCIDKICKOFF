import { test, expect, Page } from '@playwright/test';

async function collectConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter out expected external service errors for smoke tests
      if (
        text.includes('PostHog') ||
        text.includes('posthog.com') ||
        text.includes('dangerouslySetInnerHTML') ||
        text.includes('status of 401') ||
        text.includes('status of 404') ||
        text.includes('status of 400') ||
        text.includes('X-Content-Type-Options')
      ) {
        return; // Skip external service and theme hydration errors
      }
      errors.push(text);
    }
  });
  return errors;
}

test.describe('LucidCraft smoke tests', () => {
  test('home page renders correctly', async ({ page }) => {
    const errors = await collectConsoleErrors(page);

    await page.goto('/', { waitUntil: 'networkidle' });

    // Use only the specific test ID - no fallback chains
    await expect(page.getByTestId('home-title')).toBeVisible({ timeout: 15000 });
    expect(errors, `Console errors on home:\n${errors.join('\n')}`).toEqual([]);
  });

  test('packs page renders correctly', async ({ page }) => {
    const errors = await collectConsoleErrors(page);
  
    await page.goto('/packs', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/packs/);

    // Use only the specific test ID - no fallback chains
    await expect(page.getByTestId('packs-title')).toBeVisible({ timeout: 15000 });

    // Check for any pack control element
    const controls = page.locator('[data-testid="packs-sort"], [data-testid="packs-filter"], button[aria-haspopup="listbox"]').first();
    await expect(controls).toBeVisible({ timeout: 10000 });

    expect(errors, `Console errors on /packs:\n${errors.join('\n')}`).toEqual([]);
  });

  test('canvas page renders correctly', async ({ page }) => {
    const errors = await collectConsoleErrors(page);

    await page.goto('/canvas', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/canvas/);

    // Use only the specific test ID - no fallback chains
    await expect(page.getByTestId('konva-stage')).toBeVisible({ timeout: 10000 });
    expect(errors, `Console errors on /canvas:\n${errors.join('\n')}`).toEqual([]);
  });
});

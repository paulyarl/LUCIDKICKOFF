import { test, expect } from '@playwright/test';

// Basic guardrails: button tap targets and intro copy presence

test.describe('Intro screen guardrails', () => {
  test('CTAs are >=44px tall and visible', async ({ page }) => {
    await page.goto('/');
    const start = page.getByRole('link', { name: /Start Drawing/i });
    const browse = page.getByRole('link', { name: /Browse Pages/i });
    await expect(start).toBeVisible();
    await expect(browse).toBeVisible();

    const startBox = await start.boundingBox();
    const browseBox = await browse.boundingBox();
    expect(startBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(browseBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  test('headline and subtext render', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByText('Learn to draw, color, and create with fun lessons and easy tutorials!', { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText('Pick a page or lesson to start your art adventure.', { exact: true })
    ).toBeVisible();
  });
});

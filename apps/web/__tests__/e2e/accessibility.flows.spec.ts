import { test, expect, Page } from '@playwright/test';
import { createTestUser, loginAsUser, logoutUser } from '../utils/auth';
import { mockServiceWorker } from '../utils/mocks';

// Test data
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test123!',
  username: 'testuser',
};

const PARENT_USER = {
  email: 'parent@example.com',
  password: 'Parent123!',
  username: 'parentuser',
};

test.describe('Accessibility and User Flows', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    // Create a new browser context with reduced motion for consistent testing
    const context = await browser.newContext({
      reducedMotion: 'reduce',
      permissions: ['clipboard-read', 'clipboard-write'],
    });
    page = await context.newPage();
    
    // Set up service worker mocks
    await mockServiceWorker(page);
    
    // Create test users if they don't exist
    await createTestUser(TEST_USER);
    await createTestUser(PARENT_USER);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test.beforeEach(async () => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await logoutUser(page);
  });

  test('1. Keyboard navigation across Pack List cards and filter chips', async () => {
    // Navigate to packs page
    await page.goto('/packs');
    
    // Wait for packs to load
    await page.waitForSelector('[data-testid="pack-card"]');
    
    // Test tab navigation through pack cards
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="pack-card"]').first()).toBeFocused();
    
    // Test arrow key navigation between cards
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-testid="pack-card"]').nth(1)).toBeFocused();
    
    // Test filter chip keyboard interaction
    const filterChip = page.locator('[data-testid="filter-chip"]').first();
    await filterChip.focus();
    await page.keyboard.press('Enter');
    
    // Verify URL was updated with filter
    await expect(page).toHaveURL(/\?filter=/);
    
    // Test tab navigation to CTA buttons
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="primary-cta"]').first()).toBeFocused();
  });

  test('2. Canvas tool shortcuts and ARIA states', async () => {
    // Login and navigate to canvas
    await loginAsUser(page, TEST_USER);
    await page.goto('/canvas');
    
    // Test tool shortcuts
    const tools = [
      { key: '1', name: 'brush' },
      { key: '2', name: 'eraser' },
      { key: '3', name: 'fill' },
    ];

    for (const tool of tools) {
      await page.keyboard.press(tool.key);
      await expect(page.locator(`[data-tool="${tool.name}"]`)).toHaveAttribute('aria-selected', 'true');
    }

    // Test undo/redo (Z/Y)
    await page.keyboard.press('z');
    await expect(page.locator('[data-testid="undo-button"]')).toHaveAttribute('aria-disabled', 'true');
    
    // Test zoom in/out ([/])
    const initialZoom = await page.evaluate(() => window.zoomLevel);
    await page.keyboard.press(']');
    const newZoom = await page.evaluate(() => window.zoomLevel);
    expect(newZoom).toBeGreaterThan(initialZoom);
  });

  test('3. Parent PIN lock/unlock and OTP flow', async () => {
    // Login as parent
    await loginAsUser(page, PARENT_USER);
    
    // Navigate to child link page
    await page.goto('/parent/link-child');
    
    // Generate OTP
    const otpButton = page.locator('[data-testid="generate-otp"]');
    await otpButton.click();
    
    // Get OTP from UI (mock)
    const otp = await page.evaluate(() => {
      return document.querySelector('[data-testid="otp-display"]')?.textContent || '';
    });
    
    // Logout and login as child
    await logoutUser(page);
    await loginAsUser(page, TEST_USER);
    
    // Navigate to link with parent
    await page.goto(`/link-parent?otp=${otp}`);
    
    // Verify successful linking
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Test PIN setup
    await page.getByRole('button', { name: /set up pin/i }).click();
    await page.getByLabel(/enter 4-digit pin/i).fill('1234');
    await page.getByRole('button', { name: /confirm pin/i }).click();
    
    // Test PIN unlock
    await page.getByRole('button', { name: /lock/i }).click();
    await page.getByLabel(/enter your pin/i).fill('1234');
    await page.getByRole('button', { name: /unlock/i }).click();
    
    // Verify unlock
    await expect(page.locator('[data-testid="unlocked-state"]')).toBeVisible();
  });

  test('4. Offline save queue and conflict resolution', async () => {
    await loginAsUser(page, TEST_USER);
    await page.goto('/canvas');
    
    // Go offline
    await page.context().setOffline(true);
    
    // Make changes while offline
    await page.getByRole('button', { name: /draw/i }).click();
    await page.mouse.click(100, 100);
    
    // Verify changes are queued
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    
    // Go back online
    await page.context().setOffline(false);
    
    // Trigger sync
    await page.getByRole('button', { name: /sync now/i }).click();
    
    // Simulate conflict
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('conflict-detected'));
    });
    
    // Choose "Keep This Device"
    await page.getByRole('button', { name: /keep this device/i }).click();
    
    // Verify merge
    await expect(page.locator('[data-testid="sync-complete"]')).toBeVisible();
  });

  test('5. Aspect ratio enforcement in pack previews', async ({ browserName }) => {
    test.skip(browserName !== 'chromium', 'Skipping visual tests for non-chromium browsers');
    
    // Test 16:10 aspect ratio
    await testAspectRatio(page, '16:10', 1600, 1000);
    
    // Test 19.5:9 aspect ratio
    await testAspectRatio(page, '19.5:9', 1950, 900);
  });
});

async function testAspectRatio(page: Page, ratio: string, width: number, height: number) {
  // Set viewport size
  await page.setViewportSize({ width, height });
  
  // Navigate to a pack page
  await page.goto('/packs/test-pack');
  
  // Wait for content to load
  await page.waitForSelector('[data-testid="pack-preview"]');
  
  // Take screenshot
  const screenshot = await page.screenshot({
    path: `test-results/pack-preview-${ratio.replace(':', '-')}.png`,
    fullPage: true
  });
  
  // Verify aspect ratio is maintained
  const preview = page.locator('[data-testid="pack-preview"]');
  const previewBox = await preview.boundingBox();
  
  if (!previewBox) {
    throw new Error('Preview element not found');
  }
  
  const aspectRatio = previewBox.width / previewBox.height;
  const targetRatio = ratio === '16:10' ? 1.6 : 2.1667; // 16/10 or 19.5/9
  
  // Allow 2% tolerance
  expect(aspectRatio).toBeGreaterThan(targetRatio * 0.98);
  expect(aspectRatio).toBeLessThan(targetRatio * 1.02);
  
  // Assert no square previews
  const isSquare = Math.abs(previewBox.width - previewBox.height) < 10;
  expect(isSquare).toBeFalsy();
}

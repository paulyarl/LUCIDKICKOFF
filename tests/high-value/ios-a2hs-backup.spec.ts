import { test, expect } from '@playwright/test';

test.describe('iOS A2HS & Backup Now', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the beforeinstallprompt event
    await page.addInitScript(() => {
      // @ts-ignore
      window.deferredPrompt = {
        prompt: () => Promise.resolve(),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      };
      
      // Mock PWA installation
      Object.defineProperty(window.navigator, 'platform', {
        value: 'iPhone',
        configurable: true,
      });
      
      // Mock standalone mode
      // @ts-ignore
      window.navigator.standalone = false;
      
      // Mock indexedDB for backup testing
      const mockDB = {
        canvases: new Map(),
        async get(key: string) { return this.canvases.get(key); },
        async set(key: string, value: any) { this.canvases.set(key, value); },
        async getAll() { return Array.from(this.canvases.entries()); },
      };
      
      // @ts-ignore
      window.mockDB = mockDB;
    });
    
    // Mock backup API
    await page.route('/api/backup', (route) => {
      return route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true }),
      });
    });
  });

  test('should show A2HS guidance on iOS', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'iOS-specific test');
    
    await page.goto('/');
    
    // Check for A2HS guidance
    const a2hsBanner = page.locator('[data-testid="a2hs-banner"]');
    await expect(a2hsBanner).toBeVisible();
    
    // Should have install button
    const installButton = a2hsBanner.getByRole('button', { name: /install/i });
    await expect(installButton).toBeVisible();
    
    // Should have dismiss button
    const dismissButton = a2hsBanner.getByRole('button', { name: /not now/i });
    await expect(dismissButton).toBeVisible();
    
    // Test install flow
    await installButton.click();
    
    // Should show installation instructions
    await expect(page.getByText('Tap the share button')).toBeVisible();
    
    // Simulate successful installation
    await page.evaluate(() => {
      // @ts-ignore
      window.navigator.standalone = true;
      window.dispatchEvent(new Event('appinstalled'));
    });
    
    // Banner should be hidden after installation
    await expect(a2hsBanner).not.toBeVisible();
  });

  test('should backup canvas when clicking Backup Now', async ({ page }) => {
    // Add test canvas to mock DB
    await page.evaluate(() => {
      // @ts-ignore
      window.mockDB.set('canvas1', {
        id: 'canvas1',
        name: 'Test Canvas',
        data: { layers: [] },
        lastModified: Date.now(),
      });
    });
    
    await page.goto('/library');
    
    // Click Backup Now
    const backupButton = page.getByRole('button', { name: /backup now/i });
    await backupButton.click();
    
    // Should show backup in progress
    const progress = page.locator('[role="progressbar"]');
    await expect(progress).toBeVisible();
    
    // Wait for backup to complete
    await expect(page.getByText('Backup complete')).toBeVisible({
      timeout: 10000,
    });
    
    // Verify API was called with correct data
    const apiCalls = await page.evaluate(() => {
      // @ts-ignore
      return window.fetch.calls
        .filter((call: any) => call[0].includes('/api/backup'))
        .map((call: any) => ({
          url: call[0],
          method: call[1].method,
          body: call[1].body ? JSON.parse(call[1].body) : {},
        }));
    });
    
    expect(apiCalls.length).toBe(1);
    expect(apiCalls[0].method).toBe('POST');
    expect(apiCalls[0].body).toMatchObject({
      canvasId: 'canvas1',
      name: 'Test Canvas',
    });
  });

  test('should show queued items during backup', async ({ page }) => {
    // Add multiple canvases to mock DB
    await page.evaluate(() => {
      // @ts-ignore
      const db = window.mockDB;
      for (let i = 1; i <= 5; i++) {
        db.set(`canvas${i}`, {
          id: `canvas${i}`,
          name: `Canvas ${i}`,
          data: { layers: [] },
          lastModified: Date.now() - i * 1000, // Stagger timestamps
        });
      }
    });
    
    await page.goto('/library');
    
    // Start backup
    await page.getByRole('button', { name: /backup now/i }).click();
    
    // Should show progress with queued items
    await expect(page.getByText('1 of 5 items backed up')).toBeVisible();
    
    // Simulate network delay
    await page.route('/api/backup', (route) => {
      return new Promise(resolve => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            body: JSON.stringify({ success: true }),
          });
          resolve();
        }, 500);
      });
    });
    
    // Should update progress as items complete
    await expect(page.getByText('3 of 5 items backed up')).toBeVisible({
      timeout: 5000,
    });
    
    // Should show completion message
    await expect(page.getByText('All items backed up')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should handle backup errors gracefully', async ({ page }) => {
    // Add test canvas
    await page.evaluate(() => {
      // @ts-ignore
      window.mockDB.set('error-canvas', {
        id: 'error-canvas',
        name: 'Error Canvas',
        data: { layers: [] },
      });
    });
    
    // Mock API to fail
    await page.route('/api/backup', (route) => {
      return route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Backup failed' }),
      });
    });
    
    await page.goto('/library');
    
    // Start backup
    await page.getByRole('button', { name: /backup now/i }).click();
    
    // Should show error message
    await expect(page.getByText('Failed to backup some items')).toBeVisible({
      timeout: 5000,
    });
    
    // Should show retry option
    const retryButton = page.getByRole('button', { name: /retry/i });
    await expect(retryButton).toBeVisible();
    
    // Update mock to succeed on retry
    await page.route('/api/backup', (route) => {
      return route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true }),
      });
    });
    
    // Retry backup
    await retryButton.click();
    
    // Should show success message
    await expect(page.getByText('Backup complete')).toBeVisible({
      timeout: 5000,
    });
  });
});

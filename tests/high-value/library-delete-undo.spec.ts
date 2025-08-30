import { test, expect } from '@playwright/test';

test.describe('Library Delete with Undo', () => {
  const TEST_ARTWORK = {
    id: 'test-artwork-123',
    title: 'Test Artwork for Deletion',
  };

  test.beforeEach(async ({ page }) => {
    // Setup test data
    await page.route('/api/artwork/list', (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([TEST_ARTWORK]),
      });
    });

    // Mock delete endpoint
    await page.route('/api/artwork/delete', (route) => {
      return route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true }),
      });
    });
  });

  test('should show undo toast when deleting an artwork', async ({ page }) => {
    await page.goto('/library');
    
    // Find and click delete button
    const deleteButton = page.locator(`[data-testid="delete-${TEST_ARTWORK.id}"]`);
    await deleteButton.click();
    
    // Verify toast appears with undo button
    const undoToast = page.locator('[role="alert"]:has-text("Artwork moved to trash")');
    await expect(undoToast).toBeVisible();
    
    const undoButton = undoToast.locator('button:has-text("Undo")');
    await expect(undoButton).toBeVisible();
  });

  test('should restore artwork when undo is clicked', async ({ page }) => {
    await page.goto('/library');
    
    // Track API calls
    let restoreCalled = false;
    await page.route('/api/artwork/restore', (route) => {
      restoreCalled = true;
      return route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true }),
      });
    });
    
    // Delete and immediately undo
    await page.click(`[data-testid="delete-${TEST_ARTWORK.id}"]`);
    await page.click('[role="alert"] button:has-text("Undo")');
    
    // Verify restore API was called
    expect(restoreCalled).toBe(true);
    
    // Verify artwork is still visible
    await expect(page.getByText(TEST_ARTWORK.title)).toBeVisible();
  });

  test('should permanently delete after timeout', async ({ page }) => {
    await page.goto('/library');
    
    // Track delete API calls
    let deleteCalls = 0;
    await page.route('/api/artwork/delete', (route) => {
      deleteCalls++;
      return route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true }),
      });
    });
    
    // Delete and wait for timeout (using reduced time for test)
    test.setTimeout(15000); // 15s timeout for this test
    
    await page.click(`[data-testid="delete-${TEST_ARTWORK.id}"]`);
    
    // Fast-forward time by 9 seconds
    await page.evaluate(() => {
      // Mock Date.now to simulate time passing
      const originalNow = Date.now;
      const startTime = originalNow();
      
      // @ts-ignore
      globalThis.Date.now = () => startTime + 9000; // 9 seconds later
      
      // Trigger any pending timeouts
      jest.runOnlyPendingTimers();
      
      // Restore original
      // @ts-ignore
      globalThis.Date.now = originalNow;
    });
    
    // Verify undo is still available at 9s
    await expect(page.locator('[role="alert"] button:has-text("Undo")')).toBeVisible();
    
    // Fast-forward past 10s
    await page.evaluate(() => {
      const originalNow = Date.now;
      const startTime = originalNow();
      
      // @ts-ignore
      globalThis.Date.now = () => startTime + 11000; // 11 seconds later
      
      // Trigger any pending timeouts
      jest.runOnlyPendingTimers();
      
      // Restore original
      // @ts-ignore
      globalThis.Date.now = originalNow;
    });
    
    // Verify toast is gone and delete was called
    await expect(page.locator('[role="alert"]')).not.toBeVisible();
    expect(deleteCalls).toBe(1);
  });

  test('should show remaining time in undo toast', async ({ page }) => {
    await page.goto('/library');
    
    // Delete an artwork
    await page.click(`[data-testid="delete-${TEST_ARTWORK.id}"]`);
    
    // Verify initial countdown shows 10s
    const countdown = page.locator('[role="alert"]').getByText(/\d+s/);
    await expect(countdown).toHaveText('10s');
    
    // Fast-forward time by 4 seconds
    await page.evaluate(() => {
      const originalNow = Date.now;
      const startTime = originalNow();
      
      // @ts-ignore
      globalThis.Date.now = () => startTime + 4000; // 4 seconds later
      
      // Trigger any pending timeouts
      jest.runOnlyPendingTimers();
      
      // Restore original
      // @ts-ignore
      globalThis.Date.now = originalNow;
    });
    
    // Verify countdown updated
    await expect(countdown).toHaveText('6s');
  });
});

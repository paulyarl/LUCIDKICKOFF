import { test, expect } from '@playwright/test';

test.describe('Base Routes', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication to avoid login requirements
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'mock-user-id', email: 'test@example.com' }
      }));
    });
  });

  test('should load /learn/mode and display heading and CTA', async ({ page }) => {
    await page.goto('/learn/mode');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for heading
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Choose Your Learning Mode');
    
    // Check for Start Drawing CTA
    const startDrawingCTA = page.locator('.start-drawing-cta');
    await expect(startDrawingCTA).toBeVisible();
    await expect(startDrawingCTA).toContainText('Start Drawing');
  });

  test('should load /learn/lesson/1 and display heading and CTA', async ({ page }) => {
    await page.goto('/learn/lesson/1');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for heading
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Lesson 1');
    
    // Check for Start Drawing CTA
    const startDrawingCTA = page.locator('.start-drawing-cta');
    await expect(startDrawingCTA).toBeVisible();
    await expect(startDrawingCTA).toContainText('Start Drawing');
  });

  test('should load /tutorial/1 and display heading and CTA', async ({ page }) => {
    await page.goto('/tutorial/1');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for heading
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Tutorial 1');
    
    // Check for Start Drawing CTA
    const startDrawingCTA = page.locator('.start-drawing-cta');
    await expect(startDrawingCTA).toBeVisible();
    await expect(startDrawingCTA).toContainText('Start Tutorial');
  });

  test('should navigate from home page Start Drawing CTA to /learn/mode', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Click the Start Drawing Now button
    const startDrawingButton = page.locator('text=Start Drawing Now');
    await expect(startDrawingButton).toBeVisible();
    await startDrawingButton.click();
    
    // Should navigate to /learn/mode
    await expect(page).toHaveURL('/learn/mode');
    
    // Verify we're on the mode selector page
    const heading = page.locator('h1');
    await expect(heading).toContainText('Choose Your Learning Mode');
  });

  test('should navigate from mode selector to lesson', async ({ page }) => {
    await page.goto('/learn/mode');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Click the Start Drawing button
    const startDrawingButton = page.locator('.start-drawing-cta');
    await expect(startDrawingButton).toBeVisible();
    await startDrawingButton.click();
    
    // Should navigate to lesson with mode parameter
    await expect(page).toHaveURL(/\/learn\/lesson\/1\?mode=interactive/);
  });

  test('should display all learning modes in mode selector', async ({ page }) => {
    await page.goto('/learn/mode');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for Interactive Lesson (default)
    const interactiveMode = page.locator('text=Interactive Lesson');
    await expect(interactiveMode).toBeVisible();
    
    // Check for Free Drawing
    const freeDrawingMode = page.locator('text=Free Drawing');
    await expect(freeDrawingMode).toBeVisible();
    
    // Check for Drawing Challenge
    const challengeMode = page.locator('text=Drawing Challenge');
    await expect(challengeMode).toBeVisible();
    
    // Check that Interactive Lesson is marked as default
    const defaultBadge = page.locator('text=Default');
    await expect(defaultBadge).toBeVisible();
  });
});

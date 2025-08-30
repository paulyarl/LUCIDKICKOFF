import { test, expect } from '@playwright/test';

test.describe('Pack List Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/packs');
    // Wait for the pack list to load
    await page.waitForSelector('[data-testid="pack-list"]');
  });

  test('should navigate through grid with Tab/Shift+Tab', async ({ page }) => {
    // Start from the filter section
    const filters = page.locator('[data-testid="filters"]');
    await filters.focus();
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'search-input');
    
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'filter-chip-1');
    
    // Continue tabbing through filter chips
    const chipCount = await page.locator('[data-testid^="filter-chip-"]').count();
    for (let i = 1; i < chipCount; i++) {
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toHaveAttribute('data-testid', `filter-chip-${i}`);
    }
    
    // Should now be in the pack grid
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'pack-card-0');
    
    // Shift+Tab should go back
    await page.keyboard.down('Shift');
    await page.keyboard.press('Tab');
    await page.keyboard.up('Shift');
    await expect(page.locator(':focus')).toHaveAttribute('data-testid', `filter-chip-${chipCount - 1}`);
  });

  test('should navigate within a pack card using arrow keys', async ({ page }) => {
    // Navigate to first pack card
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Should be in the pack card with focus trap active
    const card = page.locator('[data-testid="pack-card-0"]');
    await expect(card).toBeFocused();
    
    // Test arrow key navigation between interactive elements
    const interactiveElements = await page.locator('[tabindex="0"]').all();
    for (let i = 0; i < interactiveElements.length; i++) {
      if (i > 0) {
        await page.keyboard.press('ArrowDown');
      }
      await expect(interactiveElements[i]).toBeFocused();
    }
    
    // Should wrap around to first element
    await page.keyboard.press('ArrowDown');
    await expect(interactiveElements[0]).toBeFocused();
  });

  test('should maintain focus after filter changes', async ({ page }) => {
    // Focus a filter chip
    const chip = page.locator('[data-testid="filter-chip-0"]');
    await chip.focus();
    
    // Get the chip's text to verify selection
    const chipText = await chip.textContent();
    
    // Select the chip
    await page.keyboard.press('Enter');
    
    // Verify URL updated
    await expect(page).toHaveURL(/\?filter=/);
    
    // Verify chip is selected
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    
    // Wait for any re-renders
    await page.waitForTimeout(500);
    
    // Verify focus is maintained on the chip
    await expect(chip).toBeFocused();
  });

  test('should persist filter state and focus after page reload', async ({ page }) => {
    // Select a filter
    const chip = page.locator('[data-testid="filter-chip-0"]');
    await chip.focus();
    await page.keyboard.press('Enter');
    
    // Get the filter value from URL
    const url = page.url();
    
    // Reload the page
    await page.reload();
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="pack-list"]');
    
    // Verify URL is preserved
    await expect(page).toHaveURL(url);
    
    // Verify the chip is still selected
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
  });

  test.describe('with prefers-reduced-motion', () => {
    test.use({ prefersReducedMotion: 'reduce' });
    
    test('should work with reduced motion', async ({ page }) => {
      // Test that animations are disabled
      const animationValue = await page.evaluate(() => 
        window.getComputedStyle(document.documentElement)
          .getPropertyValue('prefers-reduced-motion')
      );
      expect(animationValue).toBe('reduce');
      
      // Verify keyboard navigation still works
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'search-input');
    });
  });

  test.describe('with high contrast mode', () => {
    test.use({ forcedColors: 'active' });
    
    test('should maintain proper contrast in high contrast mode', async ({ page }) => {
      // Test that high contrast mode is detected
      const highContrastValue = await page.evaluate(() => 
        window.matchMedia('(forced-colors: active)').matches
      );
      expect(highContrastValue).toBe(true);
      
      // Verify focus indicators are visible
      await page.keyboard.press('Tab');
      const focusStyle = await page.evaluate((selector) => {
        const el = document.querySelector(selector);
        return el ? window.getComputedStyle(el).outline : '';
      }, ':focus');
      
      expect(focusStyle).not.toBe('none');
    });
  });

  test('should handle virtualized reflow', async ({ page }) => {
    // Scroll to trigger virtualization
    await page.evaluate(() => window.scrollTo(0, 1000));
    
    // Wait for any re-renders
    await page.waitForTimeout(500);
    
    // Focus an element that might be virtualized
    const firstCard = page.locator('[data-testid="pack-card-0"]');
    await firstCard.focus();
    
    // Scroll back up
    await page.evaluate(() => window.scrollTo(0, 0));
    
    // Wait for any re-renders
    await page.waitForTimeout(500);
    
    // Focus should be maintained on the same element
    await expect(firstCard).toBeFocused();
  });
});

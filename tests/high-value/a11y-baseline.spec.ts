import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

// List of major application routes to test
const APP_ROUTES = [
  '/',
  '/library',
  '/create',
  '/settings',
  '/help',
];

// Known issues to temporarily suppress (should be fixed eventually)
const KNOWN_ISSUES = {
  'color-contrast': ['#login-form'],
  'landmark-one-main': [], // False positive in our layout
};

test.describe('Accessibility (a11y) Baseline', () => {
  // Test each major route
  for (const route of APP_ROUTES) {
    test(`should pass accessibility checks on ${route}`, async ({ page }) => {
      await page.goto(route);
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      
      // Run Lighthouse accessibility audit
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude(KNOWN_ISSUES['color-contrast'].map(selector => `#${selector}`))
        .analyze();
      
      // Check Lighthouse score
      const accessibilityScore = accessibilityScanResults.score * 100;
      expect(accessibilityScore, {
        message: `Accessibility score ${accessibilityScore} is below 90`
      }).toBeGreaterThanOrEqual(90);
      
      // Check for critical issues
      const criticalIssues = accessibilityScanResults.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );
      
      if (criticalIssues.length > 0) {
        console.error('Critical accessibility issues found:', 
          JSON.stringify(criticalIssues, null, 2));
      }
      
      expect(criticalIssues).toHaveLength(0);
    });
  }
  
  test('should have alt text for all informative images', async ({ page }) => {
    await page.goto('/');
    
    // Find all images that should have alt text
    const images = await page.$$eval('img:not([alt])', imgs => 
      imgs
        .filter(img => {
          // Skip decorative images
          const isDecorative = img.getAttribute('role') === 'presentation' ||
                            img.getAttribute('aria-hidden') === 'true';
          return !isDecorative;
        })
        .map(img => ({
          src: img.src.split('/').pop(),
          outerHTML: img.outerHTML,
        }))
    );
    
    if (images.length > 0) {
      console.error('Images missing alt text:', images);
    }
    
    expect(images).toHaveLength(0);
  });
  
  test('should not have keyboard traps', async ({ page }) => {
    await page.goto('/');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    
    // Focus should be on the first focusable element
    const firstFocusable = await page.evaluate(() => 
      document.activeElement?.outerHTML
    );
    
    expect(firstFocusable).toBeTruthy();
    
    // Tab through all focusable elements
    const focusHistory = [];
    let focusableCount = 0;
    const MAX_TABS = 100; // Safety limit
    
    while (focusableCount < MAX_TABS) {
      await page.keyboard.press('Tab');
      const currentFocus = await page.evaluate(() => 
        document.activeElement?.getAttribute('data-testid') || 
        document.activeElement?.tagName
      );
      
      if (!currentFocus || focusHistory.includes(currentFocus)) {
        break;
      }
      
      focusHistory.push(currentFocus);
      focusableCount++;
    }
    
    // Verify we didn't hit the max tab limit (potential keyboard trap)
    expect(focusableCount).toBeLessThan(MAX_TABS);
  });
  
  test('should maintain focus management in modals', async ({ page }) => {
    await page.goto('/');
    
    // Open a modal
    await page.click('button[aria-label="Open settings"]');
    await page.waitForSelector('[role="dialog"]');
    
    // Focus should be trapped in the modal
    await page.keyboard.press('Tab');
    const firstFocusable = await page.evaluate(() => 
      document.activeElement?.getAttribute('data-testid')
    );
    
    expect(firstFocusable).toBeTruthy();
    
    // Tab through modal focusable elements
    const modalFocusable = await page.$$eval(
      '[role="dialog"] button, [role="dialog"] [href], [role="dialog"] [tabindex="0"]',
      els => els.map(el => el.getAttribute('data-testid') || el.tagName)
    );
    
    // Press Tab until we cycle back to the first element
    for (let i = 0; i < modalFocusable.length; i++) {
      await page.keyboard.press('Tab');
    }
    
    const focusAfterCycle = await page.evaluate(() => 
      document.activeElement?.getAttribute('data-testid')
    );
    
    // Focus should be back on the first focusable element
    expect(focusAfterCycle).toBe(firstFocusable);
    
    // Close modal with Escape
    await page.keyboard.press('Escape');
    
    // Focus should return to the trigger button
    await expect(page.locator('button[aria-label="Open settings"]')).toBeFocused();
  });
});

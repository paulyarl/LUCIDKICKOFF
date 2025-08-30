// @ts-nocheck
// Basic test to verify Playwright setup

/**
 * This is a basic smoke test to verify Playwright setup.
 * The @ts-nocheck directive is used temporarily to bypass type checking
 * until we can properly install the @playwright/test package.
 */

// Test will be type-checked at runtime by Playwright
test('basic test', async ({ page }) => {
  try {
    console.log('Navigating to example.com...');
    await page.goto('https://example.com');
    const title = await page.title();
    console.log('Page title:', title);
    expect(title).toContain('Example Domain');
    console.log('Test passed!');
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
});

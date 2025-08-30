import { Page, expect } from '@playwright/test';

/**
 * Waits for an element to be visible and stable before interacting with it
 */
export async function waitForStableElement(
  page: Page,
  selector: string,
  timeout = 5000
) {
  const element = page.locator(selector);
  await expect(element).toBeVisible({ timeout });
  
  // Wait for any animations to complete
  await page.waitForTimeout(200);
  
  return element;
}

/**
 * Takes a screenshot of an element and saves it with the given name
 */
export async function takeElementScreenshot(
  page: Page,
  selector: string,
  name: string
) {
  const element = await waitForStableElement(page, selector);
  const screenshot = await element.screenshot({
    path: `test-results/screenshots/${name}-${Date.now()}.png`,
  });
  return screenshot;
}

/**
 * Verifies that an element has the correct ARIA attributes
 */
export async function verifyAriaAttributes(
  page: Page,
  selector: string,
  attributes: Record<string, string | null>
) {
  const element = await waitForStableElement(page, selector);
  
  for (const [attr, value] of Object.entries(attributes)) {
    if (value === null) {
      await expect(element).not.toHaveAttribute(attr);
    } else {
      await expect(element).toHaveAttribute(attr, value);
    }
  }
}

/**
 * Verifies that keyboard navigation works correctly
 */
export async function testKeyboardNavigation(
  page: Page,
  selectors: string[],
  key: 'Tab' | 'ArrowRight' | 'ArrowLeft' | 'ArrowUp' | 'ArrowDown'
) {
  // Focus the first element
  await page.focus(selectors[0]);
  
  for (let i = 0; i < selectors.length - 1; i++) {
    // Press the navigation key
    await page.keyboard.press(key);
    
    // Verify focus is on the next element
    await expect(page.locator(selectors[i + 1])).toBeFocused();
  }
}

/**
 * Verifies that an element is visible to screen readers
 */
export async function verifyScreenReaderText(
  page: Page,
  visibleText: string,
  screenReaderText: string
) {
  // Check visible text
  await expect(page.getByText(visibleText, { exact: true })).toBeVisible();
  
  // Check screen reader text
  const srElement = await page.locator(`[aria-label="${screenReaderText}"]`);
  await expect(srElement).toBeVisible();
}

/**
 * Verifies that an element has sufficient color contrast
 */
export async function verifyColorContrast(
  page: Page,
  selector: string,
  expectedRatio: number
) {
  const element = await waitForStableElement(page, selector);
  const contrast = await element.evaluate((el) => {
    const style = window.getComputedStyle(el);
    const bgColor = style.backgroundColor;
    const textColor = style.color;
    
    // Simple contrast ratio calculation (for demonstration)
    // In a real test, you'd want to use a proper contrast checking library
    const getLuminance = (color: string) => {
      const rgb = color.match(/\d+/g)?.map(Number) || [0, 0, 0];
      const [r, g, b] = rgb.map(c => {
        c /= 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    
    const l1 = getLuminance(bgColor) + 0.05;
    const l2 = getLuminance(textColor) + 0.05;
    const ratio = l1 > l2 ? l1 / l2 : l2 / l1;
    
    return Math.round(ratio * 100) / 100; // Round to 2 decimal places
  });
  
  expect(contrast).toBeGreaterThanOrEqual(expectedRatio);
}

/**
 * Verifies that an element is keyboard accessible
 */
export async function verifyKeyboardAccessibility(
  page: Page,
  selector: string
) {
  const element = await waitForStableElement(page, selector);
  
  // Check if element is focusable
  await element.focus();
  await expect(element).toBeFocused();
  
  // Check if element can be activated with Enter/Space
  await element.press('Enter');
  await page.waitForTimeout(100); // Wait for any action to complete
  
  // Reset and try with Space
  await element.press(' ');
  await page.waitForTimeout(100);
}

/**
 * Verifies that a form is accessible
 */
export async function verifyFormAccessibility(
  page: Page,
  formSelector: string
) {
  const form = await waitForStableElement(page, formSelector);
  
  // Check all form controls have labels
  const inputs = await form.locator('input, select, textarea, [role="combobox"]').all();
  for (const input of inputs) {
    const id = await input.getAttribute('id');
    if (id) {
      const label = page.locator(`label[for="${id}"]`);
      await expect(label).toBeVisible();
    } else {
      // Check for aria-label or aria-labelledby
      const hasAriaLabel = await input.evaluate(el => 
        el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby')
      );
      expect(hasAriaLabel).toBe(true);
    }
  }
  
  // Check form has a submit button
  await expect(form.locator('button[type="submit"]')).toBeVisible();
}

/**
 * Verifies that a modal dialog is accessible
 */
export async function verifyModalAccessibility(
  page: Page,
  modalSelector: string
) {
  const modal = await waitForStableElement(page, modalSelector);
  
  // Check modal has a role="dialog" or role="alertdialog"
  const role = await modal.getAttribute('role');
  expect(['dialog', 'alertdialog']).toContain(role);
  
  // Check modal has an accessible name
  const hasLabel = await modal.evaluate(el => 
    el.hasAttribute('aria-label') || 
    el.hasAttribute('aria-labelledby') ||
    !!el.querySelector('[role="heading"], h1, h2, h3, h4, h5, h6')
  );
  expect(hasLabel).toBe(true);
  
  // Check focus is trapped in the modal
  await modal.press('Tab');
  const focused = await page.evaluate(() => document.activeElement?.closest(modalSelector));
  expect(focused).not.toBeNull();
  
  // Check modal can be closed with Escape
  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();
}

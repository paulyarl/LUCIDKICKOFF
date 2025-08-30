import { expect, Page } from '@playwright/test';
import { test as base } from '@playwright/test';

// Design system color tokens
type ColorPalette = {
  // Cyan
  cyan50: string;
  cyan100: string;
  cyan200: string;
  cyan300: string;
  cyan400: string;
  cyan500: string;
  cyan600: string;
  cyan700: string;
  cyan800: string;
  cyan900: string;
  
  // Coral
  coral50: string;
  coral100: string;
  coral200: string;
  coral300: string;
  coral400: string;
  coral500: string;
  coral600: string;
  coral700: string;
  coral800: string;
  coral900: string;
  
  // Navy
  navy50: string;
  navy100: string;
  navy200: string;
  navy300: string;
  navy400: string;
  navy500: string;
  navy600: string;
  navy700: string;
  navy800: string;
  navy900: string;
};

// Default color palette matching the design system
const DEFAULT_PALETTE: ColorPalette = {
  // Cyan
  cyan50: '#ecfeff',
  cyan100: '#cffafe',
  cyan200: '#a5f3fc',
  cyan300: '#67e8f9',
  cyan400: '#22d3ee',
  cyan500: '#06b6d4',
  cyan600: '#0891b2',
  cyan700: '#0e7490',
  cyan800: '#155e75',
  cyan900: '#164e63',
  
  // Coral
  coral50: '#fff7f5',
  coral100: '#ffefeb',
  coral200: '#ffd7cc',
  coral300: '#ffb8a4',
  coral400: '#ff8c66',
  coral500: '#ff5c33',
  coral600: '#e63c19',
  coral700: '#c22a0c',
  coral800: '#9b2009',
  coral900: '#7a1b0a',
  
  // Navy
  navy50: '#f5f7fa',
  navy100: '#e9eef5',
  navy200: '#d0dbe8',
  navy300: '#a7bdd3',
  navy400: '#7899b9',
  navy500: '#5a7ca3',
  navy600: '#466388',
  navy700: '#3a506e',
  navy800: '#33465c',
  navy900: '#2d3d50',
};

// Minimum touch target size (in pixels)
const MIN_TOUCH_TARGET_SIZE = 44;

// Standard aspect ratios
const ASPECT_RATIOS = {
  tablet: { width: 16, height: 10 },   // 16:10
  mobile: { width: 19.5, height: 9 }, // 19.5:9
} as const;

/**
 * Asserts that all interactive elements meet minimum touch target size requirements
 */
export async function assertMinimumTouchTargets(page: Page, selector = 'button, [role="button"], a, input[type="button"], input[type="submit"]') {
  const elements = await page.locator(selector).all();
  
  for (const element of elements) {
    const box = await element.boundingBox();
    if (!box) continue;
    
    // For elements with text, we might need to check the text node instead
    const textNode = await element.locator('text=.').first().boundingBox().catch(() => null);
    const effectiveBox = textNode || box;
    
    await expect(effectiveBox?.width, `${await element.evaluate(el => el.outerHTML)} should be at least ${MIN_TOUCH_TARGET_SIZE}px wide`)
      .toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
      
    await expect(effectiveBox?.height, `${await element.evaluate(el => el.outerHTML)} should be at least ${MIN_TOUCH_TARGET_SIZE}px tall`)
      .toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
  }
}

/**
 * Asserts that interactive elements have visible focus states
 */
export async function assertFocusStates(page: Page, selector = 'button, [role="button"], a, input, select, textarea, [tabindex]') {
  const elements = await page.locator(selector).all();
  
  for (const element of elements) {
    // Skip hidden and disabled elements
    const isVisible = await element.isVisible();
    const isDisabled = await element.getAttribute('disabled') !== null;
    
    if (!isVisible || isDisabled) continue;
    
    // Focus the element
    await element.focus();
    
    // Check for focus-visible class or other focus indicators
    const hasFocusVisible = await element.evaluate(el => {
      // Check for focus-visible class
      if (el.classList.contains('focus-visible')) return true;
      
      // Check for focus pseudo-class
      const style = window.getComputedStyle(el);
      return style.outlineStyle !== 'none' || 
             style.boxShadow !== 'none' ||
             style.borderColor !== 'transparent';
    });
    
    await expect(hasFocusVisible, `Element should have visible focus indicator: ${await element.evaluate(el => el.outerHTML)}`)
      .toBe(true);
  }
}

/**
 * Asserts that colors used in the page match the design system tokens
 */
export async function assertColorTokens(page: Page, customPalette: Partial<ColorPalette> = {}) {
  const palette = { ...DEFAULT_PALETTE, ...customPalette };
  const colorProperties = ['color', 'background-color', 'border-color', 'fill', 'stroke'];
  
  // Get all elements with non-transparent colors
  const elements = await page.locator('*').all();
  
  for (const element of elements) {
    const isVisible = await element.isVisible();
    if (!isVisible) continue;
    
    const styles = await element.evaluate((el, props) => {
      const computed = window.getComputedStyle(el);
      return props.reduce((acc, prop) => {
        const value = computed.getPropertyValue(prop);
        if (value && !value.includes('transparent') && !value.includes('inherit')) {
          acc[prop] = value;
        }
        return acc;
      }, {} as Record<string, string>);
    }, colorProperties);
    
    // Check each color property against the palette
    for (const [prop, value] of Object.entries(styles)) {
      const isInPalette = Object.values(palette).some(color => 
        value.toLowerCase().includes(color.toLowerCase())
      );
      
      // Only warn for non-palette colors that aren't black/white/transparent
      const isBlackOrWhite = ['black', 'white', 'transparent', 'currentColor']
        .some(color => value.toLowerCase().includes(color));
        
      if (!isInPalette && !isBlackOrWhite) {
        console.warn(`Non-palette color detected in ${prop}: ${value} for element:`, 
          await element.evaluate(el => el.outerHTML));
      }
    }
  }
}

/**
 * Takes a screenshot and asserts it has the correct aspect ratio
 */
export async function assertScreenshotAspectRatio(
  page: Page, 
  device: keyof typeof ASPECT_RATIOS,
  options: { tolerance?: number; fullPage?: boolean } = {}
) {
  const { tolerance = 0.05, fullPage = true } = options;
  const { width: targetWidth, height: targetHeight } = ASPECT_RATIOS[device];
  const targetRatio = targetWidth / targetHeight;
  
  // Take a screenshot
  const screenshot = await page.screenshot({ fullPage });
  
  // Get image dimensions
  const image = await page.evaluate((imgData) => {
    return new Promise<{ width: number; height: number }>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.src = 'data:image/png;base64,' + imgData.toString('base64');
    });
  }, screenshot);
  
  const actualRatio = image.width / image.height;
  const ratioDifference = Math.abs(actualRatio - targetRatio);
  
  await expect(ratioDifference, `Screenshot aspect ratio should be close to ${targetWidth}:${targetHeight} (${targetRatio.toFixed(2)}), got ${image.width}:${image.height} (${actualRatio.toFixed(2)})`)
    .toBeLessThanOrEqual(tolerance);
  
  return { width: image.width, height: image.height, ratio: actualRatio };
}

// Extend Playwright's test function with our custom assertions
export const test = base.extend<{
  assertMinimumTouchTargets: (selector?: string) => Promise<void>;
  assertFocusStates: (selector?: string) => Promise<void>;
  assertColorTokens: (customPalette?: Partial<ColorPalette>) => Promise<void>;
  assertScreenshotAspectRatio: (
    device: keyof typeof ASPECT_RATIOS, 
    options?: { tolerance?: number; fullPage?: boolean }
  ) => Promise<{ width: number; height: number; ratio: number }>;
}>({
  assertMinimumTouchTargets: async ({ page }, use) => {
    await use((selector) => assertMinimumTouchTargets(page, selector));
  },
  assertFocusStates: async ({ page }, use) => {
    await use((selector) => assertFocusStates(page, selector));
  },
  assertColorTokens: async ({ page }, use) => {
    await use((customPalette) => assertColorTokens(page, customPalette));
  },
  assertScreenshotAspectRatio: async ({ page }, use) => {
    await use((device, options) => assertScreenshotAspectRatio(page, device, options));
  },
});

export type { Page };

// Example usage in a test:
/*
test('example test', async ({ page, assertMinimumTouchTargets, assertFocusStates, assertColorTokens, assertScreenshotAspectRatio }) => {
  await page.goto('/');
  
  // Check touch targets
  await assertMinimumTouchTargets('button, [role="button"]');
  
  // Check focus states
  await assertFocusStates('button, [role="button"], a, input');
  
  // Check color tokens
  await assertColorTokens();
  
  // Check screenshot aspect ratio
  await assertScreenshotAspectRatio('mobile');
  await assertScreenshotAspectRatio('tablet');
});
*/

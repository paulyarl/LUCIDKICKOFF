import { expect, type Locator, type Page } from '@playwright/test';

type ColorPalette = {
  cyan: string[];
  coral: string[];
  navy: string[];
};

// Design system color tokens
export const COLORS: ColorPalette = {
  cyan: ['#E6F7FF', '#B3E6FF', '#80D4FF', '#4DC3FF', '#1AB1FF', '#0095FF', '#0077CC', '#005999',
         '#003C66', '#002233'],
  coral: ['#FFEDEB', '#FFC7C2', '#FFA199', '#FF7A70', '#FF5447', '#FF2E1F', '#CC2518', '#991C12',
          '#66120C', '#330906'],
  navy: ['#E6E9F0', '#B3BED9', '#8092C2', '#4D67AB', '#1A3B94', '#002E7D', '#002566', '#001C4D',
         '#001233', '#000919']
};

/**
 * Asserts a button meets minimum touch target size (44x44px)
 */
export async function assertMinimumTouchTarget(element: Locator) {
  const box = await element.boundingBox();
  expect(box?.width, 'Button width should be at least 44px').toBeGreaterThanOrEqual(44);
  expect(box?.height, 'Button height should be at least 44px').toBeGreaterThanOrEqual(44);
}

/**
 * Asserts an element has visible focus styles when focused
 */
export async function assertFocusStyles(element: Locator) {
  await element.focus();
  const hasFocusVisible = await element.evaluate(el => 
    window.getComputedStyle(el).getPropertyValue('--focus-visible') !== 'none'
  );
  
  // Check for either focus-visible class or CSS custom property
  const hasFocusClass = await element.evaluate(el => 
    el.matches(':focus-visible, .focus-visible, [data-focus-visible]')
  );
  
  expect(hasFocusVisible || hasFocusClass, 'Element should have visible focus styles when focused')
    .toBeTruthy();
}

/**
 * Asserts a color value matches the design system palette
 */
export function assertColorToken(color: string) {
  const allColors = Object.values(COLORS).flat();
  expect(allColors, `Color ${color} is not in the design system palette`)
    .toContain(color.toUpperCase());
}

/**
 * Asserts all interactive elements on the page meet accessibility standards
 */
export async function assertInteractiveElements(page: Page) {
  const buttons = await page.locator('button, [role="button"], [tabindex="0"]').all();
  
  for (const button of buttons) {
    await assertMinimumTouchTarget(button);
    await assertFocusStyles(button);
    
    // Check button colors match design system
    const bgColor = await button.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.backgroundColor;
    });
    
    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
      assertColorToken(bgColor);
    }
  }
}

/**
 * Asserts a screenshot matches the expected aspect ratio
 */
export async function assertScreenshotRatio(
  page: Page, 
  viewport: 'mobile' | 'tablet' | 'desktop',
  customSelector?: string
) {
  const element = customSelector ? page.locator(customSelector) : page;
  const box = await element.boundingBox();
  
  if (!box) {
    throw new Error('Could not get bounding box for screenshot');
  }
  
  const { width, height } = box;
  const aspectRatio = width / height;
  
  let expectedRatio: number;
  switch (viewport) {
    case 'mobile':
      expectedRatio = 19.5 / 9;
      break;
    case 'tablet':
      expectedRatio = 16 / 10;
      break;
    case 'desktop':
      expectedRatio = 16 / 9;
      break;
    default:
      expectedRatio = 16 / 9;
  }
  
  // Allow 1% tolerance for rounding
  const tolerance = 0.01;
  expect(
    Math.abs(aspectRatio - expectedRatio) <= tolerance,
    `${viewPort} screenshot should have a ${expectedRatio.toFixed(2)}:1 aspect ratio, got ${aspectRatio.toFixed(2)}:1`
  ).toBeTruthy();
}

/**
 * Takes a screenshot and validates its aspect ratio
 */
export async function takeAndValidateScreenshot(
  page: Page,
  name: string,
  viewport: 'mobile' | 'tablet' | 'desktop',
  options: {
    fullPage?: boolean;
    mask?: Locator[];
    customSelector?: string;
  } = {}
) {
  const { fullPage = false, mask = [], customSelector } = options;
  
  // Take the screenshot
  const screenshot = await (customSelector 
    ? page.locator(customSelector).screenshot()
    : page.screenshot({ fullPage }));
  
  // Validate the aspect ratio
  await assertScreenshotRatio(page, viewport, customSelector);
  
  return screenshot;
}

// Example test usage:
/*
test('button component meets accessibility standards', async ({ page }) => {
  await page.goto('/components/button');
  
  // Test all buttons on the page
  await assertInteractiveElements(page);
  
  // Take and validate a mobile screenshot
  await page.setViewportSize({ width: 375, height: 812 }); // iPhone 13
  await takeAndValidateScreenshot(page, 'button-mobile', 'mobile');
  
  // Take and validate a tablet screenshot
  await page.setViewportSize({ width: 1024, height: 768 });
  await takeAndValidateScreenshot(page, 'button-tablet', 'tablet');
});
*/

// TypeScript type exports
export type { ColorPalette };
// Re-export common expect for convenience
export { expect } from '@playwright/test';

import { test, expect } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

// Helper function to check image aspect ratio
async function getImageAspectRatio(imageBuffer: Buffer): Promise<number> {
  const png = PNG.sync.read(imageBuffer);
  return png.width / png.height;
}

// Helper to check for letterboxing (uniform color borders)
function hasLetterboxing(imageBuffer: Buffer, tolerance = 5): boolean {
  const png = PNG.sync.read(imageBuffer);
  const { width, height, data } = png;
  
  // Check top border
  const topBorderY = 2; // Check a few pixels in to avoid anti-aliasing
  const topBorderColor = [
    data[topBorderY * width * 4],     // R
    data[topBorderY * width * 4 + 1], // G
    data[topBorderY * width * 4 + 2], // B
  ];
  
  // Check bottom border
  const bottomBorderY = height - 3;
  const bottomBorderColor = [
    data[(bottomBorderY * width) * 4],
    data[(bottomBorderY * width) * 4 + 1],
    data[(bottomBorderY * width) * 4 + 2],
  ];
  
  // Check if borders are uniform
  const isUniform = (a: number[], b: number[]) => {
    return a.every((val, i) => Math.abs(val - b[i]) <= tolerance);
  };
  
  return isUniform(topBorderColor, bottomBorderColor);
}

test.describe('Pack View Aspect Ratio', () => {
  const VIEWPORTS = [
    {
      name: 'tablet',
      width: 1024,
      height: 640, // 16:10 aspect ratio
      expectedAspect: 16/10,
      slug: 'sample-pack'
    },
    {
      name: 'mobile',
      width: 390,
      height: 844, // 19.5:9 aspect ratio
      expectedAspect: 19.5/9,
      slug: 'sample-pack'
    }
  ];

  for (const viewport of VIEWPORTS) {
    test(`should maintain ${viewport.name} aspect ratio (${viewport.expectedAspect.toFixed(2)})`, async ({ page }) => {
      // Set viewport
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height
      });

      // Navigate to pack page
      await page.goto(`/packs/${viewport.slug}`);
      
      // Wait for the pack container to be visible
      const container = page.locator('[data-testid="pack-container"]');
      await expect(container).toBeVisible();
      
      // Get the computed dimensions
      const containerBox = await container.boundingBox();
      if (!containerBox) throw new Error('Container not found');
      
      // Calculate the actual aspect ratio
      const actualAspect = containerBox.width / containerBox.height;
      const expectedAspect = viewport.expectedAspect;
      
      // Assert the aspect ratio is within 1% of expected
      const aspectRatioDiff = Math.abs(actualAspect - expectedAspect) / expectedAspect;
      expect(aspectRatioDiff).toBeLessThan(0.01);
      
      // Test export functionality
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByTestId('export-button').click()
      ]);
      
      // Get the downloaded file
      const downloadPath = await download.path();
      if (!downloadPath) throw new Error('Download failed');
      
      // Read the image file
      const imageBuffer = await page.evaluate(async (path) => {
        const fs = require('fs').promises;
        return fs.readFile(path);
      }, downloadPath) as Buffer;
      
      // Verify image aspect ratio
      const imageAspect = await getImageAspectRatio(imageBuffer);
      const imageAspectDiff = Math.abs(imageAspect - expectedAspect) / expectedAspect;
      expect(imageAspectDiff).toBeLessThan(0.01);
      
      // Verify no letterboxing
      const hasLetterbox = hasLetterboxing(imageBuffer);
      expect(hasLetterbox).toBe(false);
    });
  }

  test('should maintain aspect ratio on window resize', async ({ page }) => {
    await page.goto('/packs/sample-pack');
    
    const container = page.locator('[data-testid="pack-container"]');
    await expect(container).toBeVisible();
    
    // Initial size
    await page.setViewportSize({ width: 1024, height: 640 });
    const initialBox = await container.boundingBox();
    
    // Resize to a different aspect ratio
    await page.setViewportSize({ width: 800, height: 800 });
    const resizedBox = await container.boundingBox();
    
    // Calculate aspect ratios
    const initialAspect = initialBox!.width / initialBox!.height;
    const resizedAspect = resizedBox!.width / resizedBox!.height;
    
    // Should maintain the same aspect ratio
    expect(resizedAspect).toBeCloseTo(initialAspect, 2);
  });
});

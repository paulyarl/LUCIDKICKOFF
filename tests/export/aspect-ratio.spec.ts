import { test, expect } from '@playwright/test';
import sharp from 'sharp';

test.describe('Export Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/color/abc');
  });

  test('export respects 16:10 aspect ratio on desktop', async ({ page, isMobile }) => {
    // Skip this test on mobile
    test.skip(isMobile, 'This test is for desktop view only');

    // Wait for the export button to be visible
    const exportButton = page.getByRole('button', { name: /export png/i });
    await expect(exportButton).toBeVisible();

    // Click the export button and capture the download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportButton.click()
    ]);

    // Read the downloaded file
    const buffer = await download.createReadStream()?.read();
    expect(buffer).toBeTruthy();

    if (buffer) {
      // Get image metadata
      const { width, height } = await sharp(buffer).metadata();
      expect(width).toBeTruthy();
      expect(height).toBeTruthy();

      if (width && height) {
        // Calculate aspect ratio and verify it's close to 16:10 (1.6)
        const ratio = width / height;
        const expectedRatio = 16 / 10; // 1.6
        const tolerance = 0.01; // 1% tolerance for compression/rounding
        
        expect(Math.abs(ratio - expectedRatio)).toBeLessThan(tolerance);
      }
    }
  });

  test('export respects 19.5:9 aspect ratio on mobile', async ({ page, isMobile, browserName }) => {
    // Skip this test on desktop
    test.skip(!isMobile, 'This test is for mobile view only');
    // Skip on WebKit due to known issues with downloads
    test.skip(browserName === 'webkit', 'Skipping on WebKit due to download issues');

    // Wait for the export button to be visible
    const exportButton = page.getByRole('button', { name: /export png/i });
    await expect(exportButton).toBeVisible();

    // Click the export button and capture the download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportButton.click()
    ]);

    // Read the downloaded file
    const buffer = await download.createReadStream()?.read();
    expect(buffer).toBeTruthy();

    if (buffer) {
      // Get image metadata
      const { width, height } = await sharp(buffer).metadata();
      expect(width).toBeTruthy();
      expect(height).toBeTruthy();

      if (width && height) {
        // Calculate aspect ratio and verify it's close to 19.5:9 (~2.1667)
        const ratio = width / height;
        const expectedRatio = 19.5 / 9; // ~2.1667
        const tolerance = 0.02; // 2% tolerance for mobile variations
        
        expect(Math.abs(ratio - expectedRatio)).toBeLessThan(tolerance);
      }
    }
  });

  test('exported image has minimum dimensions', async ({ page }) => {
    // Wait for the export button to be visible
    const exportButton = page.getByRole('button', { name: /export png/i });
    await expect(exportButton).toBeVisible();

    // Click the export button and capture the download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportButton.click()
    ]);

    // Read the downloaded file
    const buffer = await download.createReadStream()?.read();
    expect(buffer).toBeTruthy();

    if (buffer) {
      // Get image metadata
      const { width, height } = await sharp(buffer).metadata();
      
      // Verify minimum dimensions
      expect(width).toBeGreaterThanOrEqual(800);
      expect(height).toBeGreaterThanOrEqual(450); // 16:9 minimum
    }
  });

  test('exported image has correct MIME type', async ({ page }) => {
    // Wait for the export button to be visible
    const exportButton = page.getByRole('button', { name: /export png/i });
    await expect(exportButton).toBeVisible();

    // Click the export button and capture the download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportButton.click()
    ]);

    // Verify the file has a .png extension
    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.png$/i);

    // Read the first few bytes to verify PNG signature
    const buffer = await download.createReadStream()?.read(8);
    expect(buffer).toBeTruthy();
    
    if (buffer) {
      // PNG signature: 89 50 4E 47 0D 0A 1A 0A
      const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      expect(buffer.slice(0, 8).equals(pngSignature)).toBe(true);
    }
  });
});

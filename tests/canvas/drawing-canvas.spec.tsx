import { test, expect, Page } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

test.describe('Drawing Canvas Interactions', () => {
  let page: Page;
  
  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/draw');
    await page.waitForSelector('[data-testid="drawing-canvas"]');
  });

  test('should switch tools with keyboard shortcuts', async () => {
    // Test tool switching with 1/2/3 keys
    const tools = [
      { key: '1', tool: 'brush', testId: 'tool-brush' },
      { key: '2', tool: 'eraser', testId: 'tool-eraser' },
      { key: '3', tool: 'fill', testId: 'tool-fill' },
    ];

    for (const { key, tool, testId } of tools) {
      // Press the shortcut key
      await page.keyboard.press(key);
      
      // Verify the tool is selected
      const toolButton = page.locator(`[data-testid="${testId}"]`);
      await expect(toolButton).toHaveAttribute('data-state', 'on');
      await expect(toolButton).toHaveAttribute('aria-pressed', 'true');
      
      // Verify tooltip is present and has correct role
      await toolButton.hover();
      const tooltip = page.locator(`[role="tooltip"]:has-text("${tool}")`);
      await expect(tooltip).toBeVisible();
    }
  });

  test('should adjust brush size with Z/Y shortcuts', async () => {
    // Initial brush size
    const sizeSlider = page.locator('[data-testid="brush-size-slider"]');
    const initialValue = await sizeSlider.getAttribute('aria-valuenow');
    
    // Increase size with 'Y' key
    await page.keyboard.press('y');
    await expect(sizeSlider).toHaveAttribute('aria-valuenow', (parseInt(initialValue || '5') + 1).toString());
    
    // Decrease size with 'Z' key
    await page.keyboard.press('z');
    await expect(sizeSlider).toHaveAttribute('aria-valuenow', initialValue);
  });

  test('should record stroke_committed event with correct payload', async () => {
    // Set up event listener
    const strokePromise = page.evaluate(() => {
      return new Promise<{tool: string, brushSize: number}>(resolve => {
        window.addEventListener('stroke_committed', (e: CustomEvent) => {
          resolve({
            tool: e.detail.tool,
            brushSize: e.detail.brushSize
          });
        }, { once: true });
      });
    });

    // Draw a short stroke
    const canvas = page.locator('[data-testid="drawing-canvas"]');
    await canvas.hover();
    await page.mouse.down();
    await page.mouse.move(100, 100);
    await page.mouse.up();

    // Verify the event was fired with correct data
    const strokeData = await strokePromise;
    expect(strokeData.tool).toBe('brush');
    expect(typeof strokeData.brushSize).toBe('number');
  });

  test('should respect inside-lines-only mode', async () => {
    // Load a test SVG with known boundaries
    await page.evaluate(() => {
      // This would be replaced with actual test SVG loading logic
      document.dispatchEvent(new CustomEvent('loadTestSVG', { 
        detail: { 
          id: 'test-mask',
          // Simple rectangle mask for testing
          svg: '<rect x="50" y="50" width="200" height="200" fill="black"/>'
        } 
      }));
    });

    // Enable inside-lines-only mode
    const toggle = page.locator('[data-testid="inside-lines-toggle"]');
    await toggle.click();
    
    // Take initial snapshot
    const beforeFill = await page.locator('[data-testid="drawing-canvas"]').screenshot();
    
    // Select fill tool and click outside the shape
    await page.keyboard.press('3'); // Select fill tool
    await page.mouse.click(10, 10); // Click outside the shape
    
    // Take after-fill snapshot
    const afterFill = await page.locator('[data-testid="drawing-canvas"]').screenshot();
    
    // Should be no change since we clicked outside the shape
    expect(beforeFill).toMatchSnapshot();
    
    // Click inside the shape
    await page.mouse.click(100, 100);
    
    // Take final snapshot
    const finalFill = await page.locator('[data-testid="drawing-canvas"]').screenshot();
    
    // Should be different now as we filled inside the shape
    expect(finalFill).not.toEqual(beforeFill);
  });

  test('should handle brush size changes via slider', async () => {
    const slider = page.locator('[data-testid="brush-size-slider"]');
    const initialValue = await slider.getAttribute('aria-valuenow');
    
    // Increase size
    await slider.focus();
    await page.keyboard.press('ArrowRight');
    await expect(slider).toHaveAttribute('aria-valuenow', (parseInt(initialValue || '5') + 1).toString());
    
    // Decrease size
    await page.keyboard.press('ArrowLeft');
    await expect(slider).toHaveAttribute('aria-valuenow', initialValue);
  });

  test('should show tooltips on hover', async () => {
    const tools = [
      { testId: 'tool-brush', label: 'Brush' },
      { testId: 'tool-eraser', label: 'Eraser' },
      { testId: 'tool-fill', label: 'Fill' },
      { testId: 'tool-pan', label: 'Pan' },
    ];

    for (const { testId, label } of tools) {
      const tool = page.locator(`[data-testid="${testId}"]`);
      await tool.hover();
      
      // Check tooltip appears with correct label
      const tooltip = page.locator(`[role="tooltip"]:has-text("${label}")`);
      await expect(tooltip).toBeVisible();
      
      // Move away and check tooltip disappears
      await page.mouse.move(0, 0);
      await expect(tooltip).not.toBeVisible();
    }
  });
});

// Helper function to simulate drawing a shape on the canvas
async function drawShape(page: Page, points: Array<[number, number]>, closePath = false) {
  await page.mouse.move(points[0][0], points[0][1]);
  await page.mouse.down();
  
  for (let i = 1; i < points.length; i++) {
    await page.mouse.move(points[i][0], points[i][1]);
  }
  
  if (closePath) {
    await page.mouse.move(points[0][0], points[0][1]);
  }
  
  await page.mouse.up();
}

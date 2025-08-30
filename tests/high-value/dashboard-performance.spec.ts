// @ts-nocheck
// This file uses Playwright's test runner
// Types will be available at runtime

// Performance budgets in KB
const PERFORMANCE_BUDGETS = {
  'main.js': 100, // 100KB
  'vendor.js': 300, // 300KB
  'styles.css': 50, // 50KB
  'total': 500, // 500KB total for all scripts
};

// Maximum allowed TTF stroke (Time to First Stroke) in milliseconds
const MAX_TTF_STROKE = 2000; // 2 seconds

test.describe('Dashboard Performance', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cache and storage for consistent testing
    await page.goto('about:blank');
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    
    // Enable performance monitoring
    await page.route('**', (route) => {
      // Add cache-busting to prevent caching
      const url = new URL(route.request().url());
      url.searchParams.set('_', Date.now().toString());
      route.continue({ url: url.toString() });
    });
  });

  test('should load scripts within size budget', async ({ page }) => {
    const resources: {[key: string]: number} = {};
    
    // Listen to all responses and track resource sizes
    page.on('response', (response) => {
      const url = response.url();
      const contentLength = response.headers()['content-length'];
      
      if (contentLength) {
        const sizeKB = Math.ceil(parseInt(contentLength) / 1024);
        const fileName = url.split('/').pop()?.split('?')[0] || '';
        
        // Track main resources
        if (fileName.endsWith('.js') || fileName.endsWith('.css')) {
          resources[fileName] = sizeKB;
        }
      }
    });
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Check individual script sizes
    for (const [resource, maxSize] of Object.entries(PERFORMANCE_BUDGETS)) {
      if (resource === 'total') continue;
      
      const size = resources[resource] || 0;
      expect(size, `${resource} size (${size}KB) exceeds budget (${maxSize}KB)`)
        .toBeLessThanOrEqual(maxSize);
    }
    
    // Check total size
    const totalSize = Object.values(resources).reduce((sum, size) => sum + size, 0);
    expect(totalSize, `Total size (${totalSize}KB) exceeds budget (${PERFORMANCE_BUDGETS.total}KB)`)
      .toBeLessThanOrEqual(PERFORMANCE_BUDGETS.total);
  });

  test('should respond to first stroke within threshold', async ({ page }) => {
    // Start performance measurement
    await page.goto('/dashboard');
    
    // Wait for canvas to be interactive
    const canvas = page.locator('canvas');
    await canvas.waitFor({ state: 'visible' });
    
    // Measure time to first stroke
    const startTime = Date.now();
    
    // Simulate first stroke
    await page.mouse.move(100, 100);
    await page.mouse.down();
    await page.mouse.move(150, 150);
    
    // Wait for the stroke to be rendered
    await page.waitForTimeout(100);
    
    const strokeTime = Date.now() - startTime;
    
    // Verify stroke was rendered
    const strokeRendered = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return false;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      
      // Check if any non-transparent pixels were drawn
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let i = 3; i < imageData.length; i += 4) {
        if (imageData[i] > 0) return true; // Non-transparent pixel found
      }
      return false;
    });
    
    expect(strokeRendered, 'Stroke was not rendered').toBe(true);
    expect(strokeTime, `First stroke took ${strokeTime}ms, expected < ${MAX_TTF_STROKE}ms`)
      .toBeLessThan(MAX_TTF_STROKE);
    
    console.log(`Time to first stroke: ${strokeTime}ms`);
  });

  test('should have optimized resource loading', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      return {
        dns: navigationTiming.domainLookupEnd - navigationTiming.domainLookupStart,
        tcp: navigationTiming.connectEnd - navigationTiming.connectStart,
        ttfb: navigationTiming.responseStart - navigationTiming.requestStart,
        domContentLoaded: navigationTiming.domContentLoadedEventEnd - navigationTiming.startTime,
        load: navigationTiming.loadEventStart - navigationTiming.startTime,
        resources: resources
          .filter((r): r is PerformanceResourceTiming => 'initiatorType' in r && 'transferSize' in r)
          .map((r) => ({
            name: r.name,
            duration: r.duration,
            initiatorType: r.initiatorType,
            transferSize: r.transferSize,
          })),
      };
    });
    
    // Log metrics for debugging
    console.log('Performance Metrics:', JSON.stringify(metrics, null, 2));
    
    // Check critical metrics
    expect(metrics.ttfb, 'Time to First Byte should be < 500ms')
      .toBeLessThan(500);
    
    expect(metrics.domContentLoaded, 'DOM Content Loaded should be < 2000ms')
      .toBeLessThan(2000);
    
    expect(metrics.load, 'Page load time should be < 3000ms')
      .toBeLessThan(3000);
    
    // Check for render-blocking resources
    const renderBlocking = metrics.resources.filter((r) => {
      return r.initiatorType === 'link' && r.name.endsWith('.css');
    });
    
    expect(renderBlocking.length, 'No render-blocking CSS should be present')
      .toBe(0);
    
    // Check for large images without proper optimization
    const largeImages = metrics.resources.filter((r) => {
      return r.initiatorType === 'img' && r.transferSize > 200000; // > 200KB
    });
    
    expect(largeImages.length, `Found ${largeImages.length} large images (>200KB)`)
      .toBe(0);
  });

  test('should maintain 60fps during drawing', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Start frame rate monitoring
    await page.evaluate(() => {
        window._frameTimes = [];
      
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window._frameTimes.push(entry);
        }
      });
      
      observer.observe({ entryTypes: ['measure', 'render', 'paint'] });
    });
    
    // Draw a complex shape
    const canvas = page.locator('canvas');
    const { x, y } = await canvas.boundingBox() || { x: 100, y: 100 };
    
    await page.mouse.move(x + 50, y + 50);
    await page.mouse.down();
    
    // Draw a spiral
    for (let i = 0; i < 360; i++) {
      const radius = i / 10;
      const angle = (i * Math.PI) / 180;
      const posX = x + 50 + Math.cos(angle) * radius;
      const posY = y + 50 + Math.sin(angle) * radius;
      await page.mouse.move(posX, posY);
    }
    
    await page.mouse.up();
    
    // Get frame rate metrics
    const frameStats = await page.evaluate(() => {
      // @ts-ignore
      const times = window._frameTimes || [];
      const frameDurations = times.map((entry: any) => entry.duration);
      const avgFrameTime = frameDurations.reduce((a: number, b: number) => a + b, 0) / frameDurations.length;
      const fps = 1000 / avgFrameTime;
      
      // Count frames that took too long (>16.67ms for 60fps)
      const slowFrames = frameDurations.filter((d: number) => d > 16.67).length;
      const slowFramePercentage = (slowFrames / frameDurations.length) * 100;
      
      return {
        frameCount: frameDurations.length,
        averageFPS: fps,
        slowFrames,
        slowFramePercentage,
        frameTimes: frameDurations,
      };
    });
    
    console.log('Frame Rate Metrics:', JSON.stringify({
      averageFPS: frameStats.averageFPS.toFixed(2),
      slowFrames: `${frameStats.slowFrames} (${frameStats.slowFramePercentage.toFixed(2)}%)`,
    }, null, 2));
    
    // Performance assertions
    expect(frameStats.averageFPS, 'Average FPS should be > 50')
      .toBeGreaterThan(50);
      
    expect(frameStats.slowFramePercentage, 'Less than 10% of frames should be slow')
      .toBeLessThan(10);
  });
});

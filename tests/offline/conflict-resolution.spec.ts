import { test, expect, Page } from '@playwright/test';

test.describe('Offline Queue Conflict Resolution', () => {
  let page: Page;
  
  // Mock data
  const ARTWORK_ID = 'test-artwork-123';
  const LOCAL_CHANGES = [
    { type: 'stroke', points: [[10, 10], [20, 20]], color: '#000000', size: 5 },
    { type: 'stroke', points: [[30, 30], [40, 40]], color: '#000000', size: 5 }
  ];
  const SERVER_VERSION = {
    id: ARTWORK_ID,
    version: 2,
    data: {
      strokes: [
        { type: 'stroke', points: [[5, 5], [15, 15]], color: '#000000', size: 5 }
      ]
    }
  };

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    
    // Mock IndexedDB for offline storage
    await page.addInitScript(() => {
      // Mock offline queue
      const queue: any[] = [];
      
      // Mock service worker registration
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          ready: Promise.resolve({
            postMessage: (message: any) => {
              if (message.type === 'STORE_OFFLINE_ACTION') {
                queue.push(message.payload);
              }
            }
          })
        },
        configurable: true
      });
      
      // Mock online/offline state
      Object.defineProperty(navigator, 'onLine', {
        get: () => window['__isOnline'] || true,
        configurable: true
      });
      
      // Helper to set online/offline state
      window['__setOnline'] = (isOnline: boolean) => {
        window['__isOnline'] = isOnline;
        window.dispatchEvent(new Event(isOnline ? 'online' : 'offline'));
      };
      
      // Mock fetch for API calls
      const originalFetch = window.fetch;
      window.fetch = async (input: RequestInfo, init?: RequestInit) => {
        const url = input.toString();
        
        // Simulate network error when offline
        if (!window['__isOnline']) {
          throw new Error('NetworkError when attempting to fetch resource.');
        }
        
        // Handle conflict resolution
        if (url.endsWith('/api/artwork/save') && init?.method === 'POST') {
          const body = JSON.parse(init.body as string);
          
          // Simulate conflict if local version is behind
          if (body.version < 2) {
            return Promise.resolve({
              status: 409,
              json: () => Promise.resolve({
                error: 'Conflict',
                serverVersion: SERVER_VERSION,
                localVersion: { ...body, version: 1 }
              })
            });
          }
          
          return Promise.resolve({
            status: 200,
            json: () => Promise.resolve({
              success: true,
              artwork: { ...body, version: body.version + 1 }
            })
          });
        }
        
        // Default to original fetch
        return originalFetch(input, init);
      };
      
      // Track PostHog events
      window.posthog = {
        capture: (event: string, props: any) => {
          window['lastEvent'] = { event, props };
        },
        // @ts-ignore
        __loaded: true
      };
    });
    
    // Start with online state
    await page.evaluate(() => window['__setOnline'](true));
    
    // Go to the artwork page
    await page.goto(`/artwork/${ARTWORK_ID}`);
    await page.waitForSelector('[data-testid="drawing-canvas"]');
  });

  const simulateOfflineSaves = async () => {
    // Go offline
    await page.evaluate(() => window['__setOnline'](false));
    
    // Make two offline saves
    for (let i = 0; i < 2; i++) {
      await page.evaluate((change) => {
        // Simulate drawing action
        window.dispatchEvent(new CustomEvent('drawing-action', {
          detail: change
        }));
        
        // Simulate auto-save
        window.dispatchEvent(new CustomEvent('save-artwork', {
          detail: {
            id: window['ARTWORK_ID'],
            data: { strokes: [change] },
            version: 1 + i
          }
        }));
      }, LOCAL_CHANGES[i]);
      
      await page.waitForTimeout(100);
    }
    
    // Verify changes are in the queue
    const queueLength = await page.evaluate(() => {
      return window['queue']?.length || 0;
    });
    
    expect(queueLength).toBe(2);
  };

  test('should show conflict banner when going back online', async () => {
    await simulateOfflineSaves();
    
    // Go back online
    await page.evaluate(() => window['__setOnline'](true));
    
    // Should show conflict banner
    const banner = page.locator('[data-testid="conflict-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Conflict detected');
    
    // Should show both options
    await expect(page.getByText('Keep This Device')).toBeVisible();
    await expect(page.getByText('Keep Server Version')).toBeVisible();
  });

  test('should resolve conflict by keeping local changes', async () => {
    await simulateOfflineSaves();
    await page.evaluate(() => window['__setOnline'](true));
    
    // Click "Keep This Device"
    await page.getByText('Keep This Device').click();
    
    // Should show merge in progress
    await expect(page.getByText('Merging changes...')).toBeVisible();
    
    // Wait for merge to complete
    await expect(page.locator('[data-testid="conflict-banner"]')).not.toBeVisible();
    
    // Verify PostHog event
    const event = await page.evaluate(() => window['lastEvent']);
    expect(event).toMatchObject({
      event: 'artwork_saved',
      props: {
        artworkId: ARTWORK_ID,
        resolution: 'device',
        merged: true
      }
    });
    
    // Verify local changes are preserved
    const canvasData = await page.evaluate(() => {
      return window['getCanvasState']();
    });
    
    expect(canvasData.strokes).toHaveLength(2);
    expect(canvasData.strokes[0].points).toEqual(LOCAL_CHANGES[0].points);
  });

  test('should resolve conflict by keeping server version', async () => {
    await simulateOfflineSaves();
    await page.evaluate(() => window['__setOnline'](true));
    
    // Click "Keep Server Version"
    await page.getByText('Keep Server Version').click();
    
    // Should show recovery notice
    await expect(page.getByText('Recovered Version')).toBeVisible();
    
    // Verify PostHog event
    const event = await page.evaluate(() => window['lastEvent']);
    expect(event).toMatchObject({
      event: 'artwork_saved',
      props: {
        artworkId: ARTWORK_ID,
        resolution: 'server',
        discardedChanges: 2
      }
    });
    
    // Verify server version is loaded
    const canvasData = await page.evaluate(() => {
      return window['getCanvasState']();
    });
    
    expect(canvasData.strokes).toHaveLength(1);
    expect(canvasData.strokes[0].points).toEqual(SERVER_VERSION.data.strokes[0].points);
    
    // Verify recovery link is present
    await expect(page.getByRole('link', { name: 'Recovered Version' })).toHaveAttribute(
      'href',
      `/artwork/${ARTWORK_ID}/recovery/${expect.any(String)}`
    );
  });
});

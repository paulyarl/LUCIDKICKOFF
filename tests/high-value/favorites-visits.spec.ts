import { test, expect } from '@playwright/test';

const TEST_ITEMS = [
  { id: 'item1', name: 'Template 1', type: 'template' },
  { id: 'item2', name: 'Template 2', type: 'template' },
  { id: 'item3', name: 'Brush 1', type: 'brush' },
];

const MOCK_DATE = new Date('2025-01-01T12:00:00Z').getTime();

test.describe('Most Visited & Favorites', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the current date
    await page.addInitScript(`
      // Mock Date.now to return a fixed date
      const OriginalDate = Date;
      globalThis.Date = class extends OriginalDate {
        constructor() {
          super();
          return new OriginalDate(${MOCK_DATE});
        }
        static now() {
          return ${MOCK_DATE};
        }
      };
    `);

    // Mock API responses
    await page.route('/api/items', (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(TEST_ITEMS),
      });
    });

    // Mock favorites and visits
    await page.route('/api/user/favorites', (route) => {
      return route.fulfill({
        status: 200,
        body: JSON.stringify([]), // Start with no favorites
      });
    });

    // Mock visit tracking
    await page.route('/api/visit', (route) => {
      return route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true }),
      });
    });
  });

  test('should track visits and show most visited items', async ({ page }) => {
    // Simulate visits over time
    const visits = [
      { id: 'item1', daysAgo: 1 },
      { id: 'item1', daysAgo: 2 },
      { id: 'item2', daysAgo: 3 },
      { id: 'item1', daysAgo: 5 },
      { id: 'item3', daysAgo: 10 },
    ];

    // Record visits
    for (const visit of visits) {
      const timestamp = MOCK_DATE - (visit.daysAgo * 24 * 60 * 60 * 1000);
      await page.evaluate(({ id, timestamp }) => {
        const visits = JSON.parse(localStorage.getItem('itemVisits') || '{}');
        visits[id] = visits[id] || [];
        visits[id].push(timestamp);
        localStorage.setItem('itemVisits', JSON.stringify(visits));
      }, { id: visit.id, timestamp });
    }

    await page.goto('/browse');
    
    // Verify "Last visited X days ago" text
    const item1 = page.locator(`[data-testid="item-item1"]`);
    await expect(item1.getByText('Last visited 1 day ago')).toBeVisible();
    
    const item2 = page.locator(`[data-testid="item-item2"]`);
    await expect(item2.getByText('Last visited 3 days ago')).toBeVisible();
    
    // Verify most visited section
    const mostVisited = page.locator('[data-testid="most-visited"]');
    await expect(mostVisited).toBeVisible();
    
    // Verify order (item1 should be first as it's most visited)
    const items = mostVisited.locator('[data-testid^="item-"]');
    await expect(items.nth(0)).toHaveAttribute('data-testid', 'item-item1');
    await expect(items.nth(1)).toHaveAttribute('data-testid', 'item-item2');
  });

  test('should sync favorites across devices when signed in', async ({ browser }) => {
    // Create two contexts to simulate different devices
    const context1 = await browser.newContext({ storageState: 'playwright/.auth/parent.json' });
    const context2 = await browser.newContext({ storageState: 'playwright/.auth/child.json' });
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Device 1: Add favorite
    await page1.goto('/browse');
    await page1.click('[data-testid="favorite-item1"]');
    await expect(page1.locator('[data-testid="favorite-item1"][aria-pressed="true"]')).toBeVisible();
    
    // Device 2: Should see the favorite
    await page2.goto('/favorites');
    await expect(page2.locator('[data-testid="item-item1"]')).toBeVisible();
    
    // Cleanup
    await context1.close();
    await context2.close();
  });

  test('should store favorites locally for guests', async ({ page }) => {
    // Start as guest
    await page.goto('/browse');
    
    // Add favorite
    await page.click('[data-testid="favorite-item1"]');
    await expect(page.locator('[data-testid="favorite-item1"][aria-pressed="true"]')).toBeVisible();
    
    // Check local storage
    const favorites = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('guestFavorites') || '[]');
    });
    
    expect(favorites).toContain('item1');
    
    // Verify no API call was made
    const apiCalls = await page.evaluate(() => {
      return window.performance.getEntries()
        .filter(entry => entry.entryType === 'resource' && 
                        entry.name.includes('/api/favorites'));
    });
    
    expect(apiCalls.length).toBe(0);
  });

  test('should show 30-day visit ranking', async ({ page }) => {
    // Simulate visits over 45 days
    const now = MOCK_DATE;
    const visits = [];
    
    // Create visits within last 30 days
    for (let i = 1; i <= 30; i++) {
      const timestamp = now - (i * 24 * 60 * 60 * 1000);
      const itemId = `item${i % 3 + 1}`; // Cycle through items 1-3
      visits.push({ id: itemId, timestamp });
    }
    
    // Create older visits (should be ignored)
    for (let i = 31; i <= 45; i++) {
      const timestamp = now - (i * 24 * 60 * 60 * 1000);
      visits.push({ id: 'item-old', timestamp });
    }
    
    // Store visits in localStorage
    await page.evaluate((visits) => {
      const visitData = {};
      visits.forEach(visit => {
        visitData[visit.id] = visitData[visit.id] || [];
        visitData[visit.id].push(visit.timestamp);
      });
      localStorage.setItem('itemVisits', JSON.stringify(visitData));
    }, visits);
    
    await page.goto('/browse');
    
    // Verify only last 30 days are considered
    const mostVisited = page.locator('[data-testid="most-visited"]');
    await expect(mostVisited.locator('[data-testid="item-item-old"]')).not.toBeVisible();
    
    // Verify visit counts are correct
    const visitCounts = await mostVisited.evaluate(() => {
      const items = Array.from(document.querySelectorAll('[data-testid^="item-"]'));
      return items.map(item => {
        const match = item.textContent?.match(/(\d+) visits/);
        return {
          id: item.getAttribute('data-testid'),
          count: match ? parseInt(match[1]) : 0
        };
      });
    });
    
    // Should have 10 visits each (30 total visits / 3 items)
    expect(visitCounts.every(item => item.count === 10)).toBe(true);
  });
});

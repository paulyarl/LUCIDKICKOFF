import { test, expect, Page } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

// Mock data
const CORRECT_PIN = '1234';
const WRONG_PIN = '0000';
const PARENT_EMAIL = 'parent@example.com';
const CHILD_EMAIL = 'child@example.com';
const OTP_CODE = '123456';

// Mock time for testing auto-lock
const AUTO_LOCK_MS = 5 * 60 * 1000; // 5 minutes
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

test.describe('Parent PIN + OTP Flow', () => {
  let page: Page;
  
  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    // Mock the API responses
    await page.route('**/api/auth/verify-pin', route => {
      const pin = route.request().postData()?.includes(WRONG_PIN) 
        ? { success: false, attemptsRemaining: 2 } // Mock failed attempt
        : { success: true, token: 'mock-jwt-token' };
      return route.fulfill({ json: pin });
    });

    await page.route('**/api/auth/request-otp', async (route) => {
      // Mock rate limiting
      const rateLimit = await page.evaluate(() => 
        window.localStorage.getItem('otp_rate_limit')
      );
      
      if (rateLimit && parseInt(rateLimit) > Date.now()) {
        return route.fulfill({
          status: 429,
          json: { error: 'Too many requests' }
        });
      }
      
      // Set rate limit for next request
      await page.evaluate(`
        window.localStorage.setItem('otp_rate_limit', 
          Date.now() + 60000
        )
      `);
      
      return route.fulfill({
        json: { success: true, expiresIn: OTP_TTL_MS / 1000 }
      });
    });

    // Mock PostHog capture
    await page.addInitScript(() => {
      window.posthog = {
        capture: (event, props) => {
          window.lastPostHogEvent = { event, props };
        },
        // Mock other posthog methods
        identify: () => {},
        reset: () => {},
        // @ts-ignore
        __loaded: true
      };
    });
  });

  test('should lock after 3 failed PIN attempts', async () => {
    await page.goto('/parent/lock');
    
    // Attempt wrong PIN 3 times
    for (let i = 0; i < 3; i++) {
      await page.fill('input[type="password"]', WRONG_PIN);
      await page.click('button[type="submit"]');
      await page.waitForResponse('**/api/auth/verify-pin');
    }
    
    // Should show lockout message
    await expect(page.getByText(/account locked/i)).toBeVisible();
    
    // Try correct PIN - should still be locked
    await page.fill('input[type="password"]', CORRECT_PIN);
    await page.click('button[type="submit"]');
    await expect(page.getByText(/account locked/i)).toBeVisible();
    
    // Mock unlock time passing
    await page.evaluate(`
      window.localStorage.setItem('unlock_time', 
        Date.now() - (AUTO_LOCK_MS + 1000)
      )
    `);
    
    // Should accept correct PIN after lockout period
    await page.reload();
    await page.fill('input[type="password"]', CORRECT_PIN);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should enforce OTP rate limiting', async () => {
    await page.goto('/request-otp');
    
    // First request should succeed
    await page.fill('input[type="email"]', PARENT_EMAIL);
    await page.click('button[type="submit"]');
    await expect(page.getByText(/OTP sent/i)).toBeVisible();
    
    // Second request immediately after should be rate limited
    await page.click('button[type="submit"]');
    await expect(page.getByText(/too many requests/i)).toBeVisible();
    
    // Mock time passing to reset rate limit
    await page.evaluate(`
      window.localStorage.setItem('otp_rate_limit', 
        Date.now() - 1000
      )
    `);
    
    // Should work again after rate limit resets
    await page.click('button[type="submit"]');
    await expect(page.getByText(/OTP sent/i)).toBeVisible();
  });

  test('should expire OTP after TTL', async () => {
    // Mock an expired OTP
    await page.route('**/api/auth/verify-otp', route => {
      return route.fulfill({
        status: 400,
        json: { error: 'OTP expired' }
      });
    });
    
    await page.goto('/verify-otp');
    await page.fill('input[type="text"]', OTP_CODE);
    await page.click('button[type="submit"]');
    
    // Should show expired message
    await expect(page.getByText(/OTP expired/i)).toBeVisible();
    
    // Should show option to request new OTP
    await expect(page.getByText(/request new OTP/i)).toBeVisible();
  });

  test('should complete full approval flow', async () => {
    // Mock the approval request
    await page.route('**/api/approvals/request', route => {
      return route.fulfill({
        json: { 
          requestId: 'mock-request-id',
          status: 'pending'
        }
      });
    });
    
    // Mock the approval check
    await page.route('**/api/approvals/check/*', route => {
      return route.fulfill({
        json: { 
          status: 'approved',
          expiresAt: Date.now() + 3600000 // 1 hour from now
        }
      });
    });
    
    // Start as child requesting access
    await page.goto('/request-access');
    await page.fill('input[name="reason"]', 'I need to access this feature');
    await page.click('button[type="submit"]');
    
    // Should show pending approval
    await expect(page.getByText(/waiting for approval/i)).toBeVisible();
    
    // Switch to parent context to approve
    const parentPage = await page.context().newPage();
    await parentPage.goto('/parent/approvals');
    
    // Mock PostHog event capture
    const captureEvent = (event: string) => 
      parentPage.evaluate((e) => {
        window.posthog.capture(e, { requestId: 'mock-request-id' });
        return window.lastPostHogEvent;
      }, event);
    
    // Parent approves the request
    await parentPage.click('button:has-text("Approve")');
    await parentPage.click('button:has-text("Confirm Approval")');
    
    // Verify PostHog event
    const approvalEvent = await captureEvent('approval_decided');
    expect(approvalEvent).toMatchObject({
      event: 'approval_decided',
      props: { 
        requestId: 'mock-request-id',
        decision: 'approved'
      }
    });
    
    // Switch back to child view
    await page.bringToFront();
    await page.reload();
    
    // Should show approved and grant access
    await expect(page.getByText(/access granted/i)).toBeVisible();
    
    // Verify PostHog event for approval request
    const requestEvent = await page.evaluate(() => 
      // @ts-ignore
      window.lastPostHogEvent
    );
    
    expect(requestEvent).toMatchObject({
      event: 'approval_requested',
      props: {
        requestId: 'mock-request-id',
        requester: CHILD_EMAIL
      }
    });
  });
});

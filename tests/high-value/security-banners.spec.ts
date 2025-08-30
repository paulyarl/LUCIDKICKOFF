import { test, expect } from '@playwright/test';

const ALLOWED_IPS = ['192.168.1.1', '10.0.0.1'];
const BLOCKED_IPS = ['192.168.1.2', '10.0.0.2'];

const TEST_FILE = {
  name: 'test-image.png',
  type: 'image/png',
  size: 1024 * 1024 * 4, // 4MB
  content: Buffer.alloc(1024 * 1024 * 4), // 4MB file
};

const LARGE_FILE = {
  name: 'large-file.jpg',
  type: 'image/jpeg',
  size: 1024 * 1024 * 11, // 11MB
  content: Buffer.alloc(1024 * 1024 * 11), // 11MB file
};

const INVALID_FILE = {
  name: 'malicious.exe',
  type: 'application/x-msdownload',
  size: 1024 * 1024, // 1MB
  content: Buffer.alloc(1024 * 1024), // 1MB file
};

test.describe('Security Banners & IP Gate', () => {
  test.beforeEach(async ({ page }) => {
    // Mock IP detection
    await page.route('**/api/ip-lookup', (route) => {
      const clientIp = route.request().headers()['x-forwarded-for'] || '';
      const isAllowed = ALLOWED_IPS.includes(clientIp);
      
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ip: clientIp,
          isAllowed,
          country: isAllowed ? 'US' : 'XX',
        }),
      });
    });
    
    // Mock file upload
    await page.route('**/api/upload', (route) => {
      const contentLength = parseInt(route.request().headers()['content-length'] || '0');
      const contentType = route.request().headers()['content-type'] || '';
      
      // Check file size
      if (contentLength > 10 * 1024 * 1024) { // 10MB limit
        return route.fulfill({
          status: 413,
          body: JSON.stringify({ error: 'File too large' }),
        });
      }
      
      // Check file type
      if (!contentType.startsWith('image/')) {
        return route.fulfill({
          status: 415,
          body: JSON.stringify({ error: 'Unsupported file type' }),
        });
      }
      
      // Success
      return route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true, url: '/uploads/test.png' }),
      });
    });
  });

  test('should show IP warning banner for non-allowed IPs', async ({ page }) => {
    // Mock IP as blocked
    await page.setExtraHTTPHeaders({ 'x-forwarded-for': BLOCKED_IPS[0] });
    
    await page.goto('/import');
    
    // Should show IP warning banner
    const banner = page.locator('[role="alert"]:has-text("Restricted Access")');
    await expect(banner).toBeVisible();
    
    // Should show country code in banner
    await expect(banner).toContainText('XX');
    
    // Should have acknowledge button
    const ackButton = banner.getByRole('button', { name: /acknowledge/i });
    await expect(ackButton).toBeVisible();
    
    // Click acknowledge
    await ackButton.click();
    
    // Banner should be dismissed
    await expect(banner).not.toBeVisible();
    
    // Should set a cookie to prevent showing again
    const cookies = await page.context().cookies();
    const ackCookie = cookies.find(c => c.name === 'ip-warning-acknowledged');
    expect(ackCookie).toBeTruthy();
    expect(ackCookie?.value).toBe('true');
  });

  test('should block file uploads from disallowed IPs', async ({ page }) => {
    // Mock IP as blocked
    await page.setExtraHTTPHeaders({ 'x-forwarded-for': BLOCKED_IPS[0] });
    
    await page.goto('/import');
    
    // Try to upload a file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: TEST_FILE.name,
      mimeType: TEST_FILE.type,
      buffer: TEST_FILE.content,
    });
    
    // Should show IP restriction error
    await expect(page.getByText('Uploads not allowed from your region')).toBeVisible();
    
    // Upload button should be disabled
    const uploadButton = page.getByRole('button', { name: /upload/i });
    await expect(uploadButton).toBeDisabled();
  });

  test('should block disallowed file types', async ({ page }) => {
    // Mock IP as allowed
    await page.setExtraHTTPHeaders({ 'x-forwarded-for': ALLOWED_IPS[0] });
    
    await page.goto('/import');
    
    // Try to upload an invalid file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: INVALID_FILE.name,
      mimeType: INVALID_FILE.type,
      buffer: INVALID_FILE.content,
    });
    
    // Should show file type error
    await expect(page.getByText('Unsupported file type')).toBeVisible();
    
    // Upload button should be disabled
    const uploadButton = page.getByRole('button', { name: /upload/i });
    await expect(uploadButton).toBeDisabled();
  });

  test('should block files over size limit', async ({ page }) => {
    // Mock IP as allowed
    await page.setExtraHTTPHeaders({ 'x-forwarded-for': ALLOWED_IPS[0] });
    
    await page.goto('/import');
    
    // Try to upload a large file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: LARGE_FILE.name,
      mimeType: LARGE_FILE.type,
      buffer: LARGE_FILE.content,
    });
    
    // Should show file size error
    await expect(page.getByText(/file is too large/i)).toBeVisible();
    
    // Upload button should be disabled
    const uploadButton = page.getByRole('button', { name: /upload/i });
    await expect(uploadButton).toBeDisabled();
  });

  test('should allow uploads from allowed IPs with valid files', async ({ page }) => {
    // Mock IP as allowed
    await page.setExtraHTTPHeaders({ 'x-forwarded-for': ALLOWED_IPS[0] });
    
    await page.goto('/import');
    
    // Upload a valid file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: TEST_FILE.name,
      mimeType: TEST_FILE.type,
      buffer: TEST_FILE.content,
    });
    
    // Should show file preview
    await expect(page.getByAltText('Preview')).toBeVisible();
    
    // Should enable upload button
    const uploadButton = page.getByRole('button', { name: /upload/i });
    await expect(uploadButton).toBeEnabled();
    
    // Upload the file
    await uploadButton.click();
    
    // Should show success message
    await expect(page.getByText('Upload successful')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should show security headers', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();
    
    // Check security headers
    expect(headers?.['x-content-type-options']).toBe('nosniff');
    expect(headers?.['x-frame-options']).toBe('DENY');
    expect(headers?.['x-xss-protection']).toBe('1; mode=block');
    expect(headers?.['referrer-policy']).toBe('strict-origin-when-cross-origin');
    
    // Check CSP header
    const csp = headers?.['content-security-policy'] || '';
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).toContain("img-src 'self' data: blob:");
  });
});

import { Page } from '@playwright/test';

type MockResponse = {
  url: string | RegExp;
  method?: string;
  status?: number;
  contentType?: string;
  body?: any;
  headers?: Record<string, string>;
};

export async function mockServiceWorker(page: Page) {
  await page.addInitScript(() => {
    // Mock service worker registration
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: async () => ({
          // Mock registration object
          unregister: async () => true,
          update: async () => {},
        }),
        ready: Promise.resolve(),
      },
      configurable: true,
    });
  });
}

export function setupMocks(page: Page, mocks: MockResponse[]) {
  return page.route('**/*', (route, request) => {
    const url = request.url();
    const method = request.method().toUpperCase();
    
    const mock = mocks.find(m => {
      const urlMatches = 
        typeof m.url === 'string' 
          ? url.includes(m.url) 
          : m.url.test(url);
      
      const methodMatches = !m.method || m.method.toUpperCase() === method;
      
      return urlMatches && methodMatches;
    });
    
    if (mock) {
      return route.fulfill({
        status: mock.status || 200,
        contentType: mock.contentType || 'application/json',
        body: typeof mock.body === 'string' ? mock.body : JSON.stringify(mock.body || {}),
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': mock.contentType || 'application/json',
          ...mock.headers,
        },
      });
    }
    
    // Continue with the actual request if no mock matches
    return route.continue();
  });
}

export const mockResponses = {
  // Auth
  loginSuccess: {
    url: '/api/auth/callback/credentials',
    method: 'POST',
    body: { success: true, user: { id: 'test-user-id' } },
  },
  
  // User data
  userProfile: {
    url: '/api/user/profile',
    body: {
      id: 'test-user-id',
      username: 'testuser',
      email: 'test@example.com',
      full_name: 'Test User',
    },
  },
  
  // Packs
  packsList: {
    url: '/api/packs',
    body: [
      { id: 'pack1', name: 'Test Pack 1', thumbnail: '/images/pack1.jpg' },
      { id: 'pack2', name: 'Test Pack 2', thumbnail: '/images/pack2.jpg' },
    ],
  },
  
  // Canvas
  canvasState: {
    url: '/api/canvas/state',
    body: {
      id: 'canvas-123',
      elements: [],
      version: 1,
      lastModified: new Date().toISOString(),
    },
  },
  
  // Parent/Child
  parentLinkOtp: {
    url: '/api/parent/generate-otp',
    method: 'POST',
    body: { otp: '123456', expiresIn: 300 },
  },
  
  // Mock error response
  notFound: {
    url: /.*/,
    status: 404,
    body: { error: 'Not Found' },
  },
};

export function mockNetworkErrors(page: Page) {
  page.on('requestfailed', request => {
    console.log(`Request failed: ${request.url()}`, request.failure()?.errorText);
  });
}

export function mockOfflineMode(page: Page, isOffline = true) {
  return page.context().setOffline(isOffline);
}

// Helper to wait for all network requests to complete
export async function waitForNetworkIdle(page: Page, timeout = 500) {
  await page.waitForLoadState('networkidle', { timeout });
}

// Helper to mock indexedDB for offline testing
export async function mockIndexedDB(page: Page) {
  await page.addInitScript(() => {
    // Mock IndexedDB
    const mockDB = {
      store: new Map(),
      get: async (key: string) => mockDB.store.get(key),
      set: async (key: string, value: any) => {
        mockDB.store.set(key, value);
        return value;
      },
      delete: async (key: string) => {
        mockDB.store.delete(key);
      },
      clear: async () => {
        mockDB.store.clear();
      },
    };

    // @ts-ignore
    window.mockDB = mockDB;
  });
}

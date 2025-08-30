// Service Worker for LucidKickoff
// Version: 1.0.0

const CACHE_NAME = 'lucidkickoff-v1';
const MAX_PAGE_CACHE = 10; // Maximum number of pages to cache
const ASSET_CACHE = 'assets-v1';
const API_CACHE = 'api-cache-v1';
const CANVAS_CACHE = 'active-canvas-v1';
const SYNC_QUEUE = 'sync-queue';
const OFFLINE_URL = '/offline.html';

const ASSETS_TO_CACHE = [
  '/',
  OFFLINE_URL,
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-256x256.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  // Add other critical assets here
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(ASSET_CACHE)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME, ASSET_CACHE, API_CACHE, CANVAS_CACHE, SYNC_QUEUE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Stale-while-revalidate strategy for HTML pages
const staleWhileRevalidate = (request) => {
  return caches.match(request).then((cachedResponse) => {
    const fetchPromise = fetch(request).then((networkResponse) => {
      // Don't cache error responses
      if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
        return networkResponse;
      }

      // Clone the response
      const responseToCache = networkResponse.clone();

      // Add to cache if it's a page
      if (request.method === 'GET' && networkResponse.headers.get('Content-Type')?.includes('text/html')) {
        caches.open(CACHE_NAME).then((cache) => {
          cache.keys().then((keys) => {
            // If we have more than MAX_PAGE_CACHE, remove the oldest
            if (keys.length >= MAX_PAGE_CACHE) {
              cache.delete(keys[0]);
            }
            cache.put(request, responseToCache);
          });
        });
      }

      return networkResponse;
    }).catch(() => {
      // If both cache and network fail, show offline page for HTML requests
      if (request.headers.get('Accept').includes('text/html')) {
        return caches.match(OFFLINE_URL);
      }
    });

    // Return cached response immediately, then update from network
    return cachedResponse || fetchPromise;
  });
};

// Handle fetch events
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension URLs
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle API requests with network-first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached response if available
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || new Response(JSON.stringify({ error: 'You are offline' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // Handle HTML page requests with stale-while-revalidate
  if (request.headers.get('Accept').includes('text/html')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // For other assets, try cache first, then network
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request).catch(() => {
        // If both cache and network fail, return offline page for navigation requests
        if (request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
      });
    })
  );
});

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-artwork') {
    event.waitUntil(syncArtwork());
  }
});

// Background sync implementation
async function syncArtwork() {
  const cache = await caches.open(SYNC_QUEUE);
  const requests = await cache.keys();
  
  for (const request of requests) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        await cache.delete(request);
        
        // Notify the page that sync was successful
        const clients = await self.clients.matchAll({ type: 'window' });
        clients.forEach(client => {
          client.postMessage({
            type: 'SYNC_SUCCESS',
            url: request.url
          });
        });
      }
    } catch (error) {
      console.error('Sync failed:', error);
      // Will retry on next sync event
    }
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const title = data.title || 'LucidKickoff';
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge.png',
    data: data.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Cache the active canvas
self.addEventListener('message', async (event) => {
  if (!event.data) return;
  
  const { type, payload } = event.data;
  
  if (type === 'CACHE_CANVAS') {
    const { canvasId, data } = payload;
    const cache = await caches.open(CANVAS_CACHE);
    
    // Clear previous canvas cache
    const keys = await cache.keys();
    await Promise.all(keys.map(key => cache.delete(key)));
    
    // Cache the new canvas
    const response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    await cache.put(`/api/canvas/${canvasId}`, response);
  }
});

// Helper function to queue failed requests for background sync
async function queueFailedRequest(request) {
  const cache = await caches.open(SYNC_QUEUE);
  await cache.put(request.clone().url, request.clone());
  
  // Register for background sync
  if ('sync' in self.registration) {
    try {
      await self.registration.sync.register('sync-artwork');
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  }
}

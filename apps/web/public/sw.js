// Service Worker for LucidKickoff
// Version: 3.2.0
//
// S3.6 runtime rules (evaluated in fetch-handler order):
//   1. non-GET / chrome-extension        → bypass
//   2. /packs/**.json                    → network-first, ASSET_CACHE fallback
//   3. /api/health                       → network-only, NEVER cached (2.15)
//   4. /api/**                           → network-first, API_CACHE fallback
//   5. text/html requests                → stale-while-revalidate, PAGE cap
//   6. everything else                   → cache-first, then network
// Budgets: entry caps per runtime cache below; pack/lesson caches are bounded
// by their manifest. Quota is surfaced to clients via STORAGE_PRESSURE and
// answered on GET_STORAGE_ESTIMATE.

const CACHE_NAME = 'lucidkickoff-v3.3';
// S3.8 — tier-aware cache budgets (D34). L0 devices get a minimal runtime
// cache; L2 devices get roomier limits alongside persisted storage.
// Updated live via SET_TIER messages from lib/offline/tier.ts.
const TIER_CAPS = {
  L0: { page: 3, api: 10, asset: 50 },
  L1: { page: 10, api: 60, asset: 200 },
  L2: { page: 25, api: 120, asset: 400 },
};
let cacheCaps = TIER_CAPS.L1;
const ASSET_CACHE = 'assets-v3.1';
const API_CACHE = 'api-cache-v3';
const CANVAS_CACHE = 'active-canvas-v3';
const SYNC_QUEUE = 'sync-queue-v3';
const OFFLINE_URL = '/offline.html';
// Post STORAGE_PRESSURE to clients when usage crosses this share of quota.
const QUOTA_PRESSURE_THRESHOLD = 0.85;

// Sprint 2.6: pack offline caches are versioned `pack-<appBuild>-<packVersion>`.
// Bump APP_BUILD together with APP_BUILD in lib/offline/packs.ts whenever the
// cache format changes — activate purges pack caches from older builds.
const APP_BUILD = 'v3';
const PACK_PREFIX = `pack-${APP_BUILD}-`;
// Sprint 2.14: per-lesson L0 buffers (D35), keyed by lesson id.
const LESSON_PREFIX = `lessonbuf-${APP_BUILD}-`;

// NOTE: '/' must never be precached — it is a 307 redirector, not a page.
// cache.addAll follows the redirect and stores a response with redirected=true
// keyed under '/'; serving that back to a navigation makes Chrome fail the
// load with ERR_FAILED (navigation responses may not be redirected responses).
const ASSETS_TO_CACHE = [
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

// Activate event - purge every cache key that is not current on this build.
// Pack/lesson buffers survive only while their APP_BUILD matches; any name not
// on the whitelist or matching the current prefixes is deleted, so stale
// formats from older versions can never accumulate.
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME, ASSET_CACHE, API_CACHE, CANVAS_CACHE, SYNC_QUEUE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.includes(cacheName)) return;
          if (cacheName.startsWith(PACK_PREFIX)) return;
          if (cacheName.startsWith(LESSON_PREFIX)) return;
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim()).then(() => reportStorageEstimate())
  );
});

// S3.6 — quota surfacing. Posts the storage estimate to open windows; flags
// STORAGE_PRESSURE once usage crosses the threshold so the UI can warn before
// the browser evicts caches.
async function reportStorageEstimate() {
  if (!self.navigator.storage || !self.navigator.storage.estimate) return;
  try {
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clients.forEach((c) =>
      c.postMessage({
        type: 'STORAGE_ESTIMATE',
        payload: { usage, quota, pressure: quota > 0 && usage / quota >= QUOTA_PRESSURE_THRESHOLD },
      }),
    );
  } catch {
    // estimate unsupported — ignore
  }
}

// S3.6 — cache budget: oldest-insertion-order entries are evicted past the cap.
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - maxEntries; i++) {
    await cache.delete(keys[i]);
  }
}

// Stale-while-revalidate strategy for HTML pages
const staleWhileRevalidate = (request) => {
  return caches.match(request).then((cachedResponse) => {
    const fetchPromise = fetch(request).then((networkResponse) => {
      // Don't cache error responses — and never cache redirected responses:
      // a fetch of '/' follows the 307 to /welcome, and storing that
      // redirected=true response re-poisons the cache (ERR_FAILED on serve).
      if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' || networkResponse.redirected) {
        return networkResponse;
      }

      // Clone the response
      const responseToCache = networkResponse.clone();

      // Add to cache if it's a page
      if (request.method === 'GET' && networkResponse.headers.get('Content-Type')?.includes('text/html')) {
        caches.open(CACHE_NAME).then(async (cache) => {
          await cache.put(request, responseToCache);
          await trimCache(CACHE_NAME, cacheCaps.page);
        });
      }

      return networkResponse;
    }).catch(() => {
      // If both cache and network fail, show offline page for HTML requests
      if (request.headers.get('Accept').includes('text/html')) {
        return caches.match(OFFLINE_URL);
      }
    });

    // Return cached response immediately, then update from network.
    // Redirected responses must never be served to navigations (ERR_FAILED) —
    // treat them as a miss and let the network path replace them.
    if (cachedResponse && cachedResponse.redirected) {
      return fetchPromise;
    }
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

  // Pack manifests/content: network-first so updates propagate, cache when offline
  if (url.pathname.startsWith('/packs/') && url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(ASSET_CACHE).then(async (cache) => {
              await cache.put(request, clone);
              await trimCache(ASSET_CACHE, cacheCaps.asset);
            });
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Sprint 2.15 — the connectivity probe must NEVER be cached: a cached 200
  // would fake "online" while offline. Network-only; 503 fallback on failure.
  if (url.pathname === '/api/health') {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(JSON.stringify({ error: 'You are offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          })
      )
    );
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
            caches.open(API_CACHE).then(async (cache) => {
              await cache.put(request, responseToCache);
              await trimCache(API_CACHE, cacheCaps.api);
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

  // '/' is the role-router redirector, never cacheable content. Online, pass
  // the redirect through untouched. Offline, resolve to the cached welcome
  // hub — its client hydration (trusted chips, picker replica, guest entry)
  // is the offline entry authority (E.8).
  if (url.pathname === '/' && request.headers.get('Accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request).catch(async () => {
        return (await caches.match('/welcome')) || (await caches.match(OFFLINE_URL));
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
  // S3.4 — drain the IndexedDB outbox first (the durable queue), then the
  // legacy request-cache queue for backward compatibility.
  await drainOutboxSW();

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

// S3.4 — raw-IDB outbox drain. The page-side queue lives in the `lucidcraft`
// DB's `outbox` store; ops are settled by /api/sync/batch per-op results.
// Raw indexedDB (no Dexie) since the SW can't import the app's modules.
function openOutboxDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('lucidcraft');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onupgradeneeded = () => reject(new Error('outbox db not initialized'));
  });
}

function outboxTx(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('outbox', mode);
    const req = fn(tx.objectStore('outbox'));
    tx.oncomplete = () => resolve(req ? req.result : undefined);
    tx.onerror = () => reject(tx.error);
  });
}

// S3.9 — mirrors backoffMs() in lib/offline/networkPolicy.ts (SW can't import).
const BACKOFF_BASE_MS = 5_000;
const BACKOFF_CAP_MS = 5 * 60_000;
const backoffMs = (attempts) => {
  const exp = Math.min(BACKOFF_CAP_MS, BACKOFF_BASE_MS * 2 ** Math.max(0, attempts));
  return Math.floor(exp * (0.5 + Math.random() * 0.5));
};

async function drainOutboxSW() {
  let db;
  try {
    db = await openOutboxDB();
  } catch {
    return; // no outbox DB on this device — nothing to do
  }
  try {
    const now = Date.now();
    const pending = await outboxTx(db, 'readonly', (s) => s.getAll());
    const batch = (pending || [])
      .filter((r) => r.status === 'pending' && r.attempts < 8 && (r.nextRetryAt ?? 0) <= now)
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(0, 50);
    if (!batch.length) return;

    let results = null;
    try {
      const res = await fetch('/api/sync/batch', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ops: batch.map((r) => ({ opId: r.opId, type: r.type, payloadVersion: 1, payload: r.payload })),
        }),
      });
      if (res.ok) results = (await res.json()).results || null;
    } catch {
      // still offline — leave rows pending
    }
    if (!results) return;

    const byOpId = new Map(results.map((r) => [r.opId, r]));
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const row of batch) {
      const res = byOpId.get(row.opId);
      if (!res) continue;
      if (res.status === 'applied' || res.status === 'duplicate') {
        await outboxTx(db, 'readwrite', (s) => s.delete(row.id));
        clients.forEach((c) => c.postMessage({ type: 'SYNC_SUCCESS', payload: { opId: row.opId } }));
      } else if (res.status === 'rejected') {
        await outboxTx(db, 'readwrite', (s) => {
          row.status = 'failed';
          row.lastError = res.reason || 'rejected';
          return s.put(row);
        });
        if (res.reason === 'artwork_conflict') {
          clients.forEach((c) =>
            c.postMessage({
              type: 'SYNC_CONFLICT',
              payload: { opId: row.opId, payload: row.payload, serverUpdatedAt: res.serverUpdatedAt },
            }),
          );
        }
      } else {
        await outboxTx(db, 'readwrite', (s) => {
          row.status = 'pending';
          row.attempts = (row.attempts || 0) + 1;
          row.nextRetryAt = Date.now() + backoffMs(row.attempts);
          return s.put(row);
        });
      }
    }
  } finally {
    db.close();
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

// Sprint 2.6/2.14 — fetch + SHA-256-verify assets into a named cache, used by
// pack downloads (PACK_*) and per-lesson L0 buffers (LESSON_*). All-or-nothing:
// the destination cache is deleted up front and again on any failure, so a
// partial prefetch can never masquerade as complete. Assets without a sha256
// (not in the manifest) are cached unverified rather than failing the batch.
async function prefetchAssets(event, { cacheName, assets }, tag) {
  const reply = (msg) => {
    if (event.source && event.source.postMessage) {
      event.source.postMessage({ ...msg, cacheName });
    }
  };
  await caches.delete(cacheName);
  const cache = await caches.open(cacheName);
  try {
    let done = 0;
    for (const asset of assets) {
      const res = await fetch(asset.url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`${asset.url} -> ${res.status}`);
      const buf = await res.arrayBuffer();
      if (asset.sha256) {
        const digest = await crypto.subtle.digest('SHA-256', buf);
        const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
        if (hex !== asset.sha256) throw new Error(`sha256 mismatch: ${asset.url}`);
      }
      await cache.put(asset.url, new Response(buf, {
        headers: {
          'Content-Type': res.headers.get('Content-Type') || 'application/octet-stream',
          'X-Pack-Verified': '1',
        },
      }));
      done += 1;
      reply({ type: `${tag}_PROGRESS`, done, total: assets.length });
    }
    reply({ type: `${tag}_DONE`, done, total: assets.length });
    reportStorageEstimate();
  } catch (err) {
    await caches.delete(cacheName);
    reply({ type: `${tag}_ERROR`, error: String(err && err.message ? err.message : err) });
  }
}

// Cache the active canvas
self.addEventListener('message', async (event) => {
  if (!event.data) return;

  const { type, payload } = event.data;

  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (type === 'PREFETCH_PACK') {
    event.waitUntil(prefetchAssets(event, payload, 'PACK'));
    return;
  }

  if (type === 'DELETE_PACK') {
    event.waitUntil(caches.delete(payload.cacheName));
    return;
  }

  if (type === 'PREFETCH_LESSON') {
    event.waitUntil(prefetchAssets(event, payload, 'LESSON'));
    return;
  }

  if (type === 'DELETE_LESSON') {
    event.waitUntil(caches.delete(payload.cacheName));
    return;
  }

  if (type === 'GET_STORAGE_ESTIMATE') {
    event.waitUntil(reportStorageEstimate());
    return;
  }

  if (type === 'SET_TIER') {
    // S3.8 — apply the tier's cache budgets and trim down immediately.
    const caps = TIER_CAPS[payload?.tier];
    if (caps) {
      cacheCaps = caps;
      event.waitUntil(
        Promise.all([
          trimCache(CACHE_NAME, caps.page),
          trimCache(API_CACHE, caps.api),
          trimCache(ASSET_CACHE, caps.asset),
        ]),
      );
    }
    return;
  }

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

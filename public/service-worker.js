/**
 * Service Worker for PWA Support
 * Enables offline functionality, caching, and background sync
 */

const CACHE_NAME = 'fepei360-v1';
const API_CACHE = 'fepei360-api-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

/**
 * Install event - Cache essential assets
 */
self.addEventListener('install', (event: any) => {
  console.log('[ServiceWorker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching core assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );

  // Force activate immediately
  self.skipWaiting();
});

/**
 * Activate event - Clean up old caches
 */
self.addEventListener('activate', (event: any) => {
  console.log('[ServiceWorker] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames: string[]) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Claim clients immediately
  (self as any).clients.claim();
});

/**
 * Fetch event - Implement cache strategies
 */
self.addEventListener('fetch', (event: any) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API requests - Network first, fall back to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets - Cache first, fall back to network
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // HTML pages - Network first for SPAs
  event.respondWith(networkFirstStrategy(request));
});

/**
 * Network first strategy - Try network, fall back to cache
 */
async function networkFirstStrategy(request: Request): Promise<Response> {
  try {
    const response = await fetch(request);

    // Cache successful API responses
    if (request.url.includes('/api/') && response.status === 200) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[ServiceWorker] Network failed, using cache:', request.url);

    // Try to get from cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // Return offline page if available
    if (request.destination === 'document') {
      const offlineCache = await caches.open(CACHE_NAME);
      return offlineCache.match('/offline.html') || new Response('Offline');
    }

    return new Response('Resource not found', { status: 404 });
  }
}

/**
 * Cache first strategy - Try cache first, fall back to network
 */
async function cacheFirstStrategy(request: Request): Promise<Response> {
  const cached = await caches.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);

    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[ServiceWorker] Failed to fetch:', request.url);
    return new Response('Resource not found', { status: 404 });
  }
}

/**
 * Check if URL is a static asset
 */
function isStaticAsset(pathname: string): boolean {
  return /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/.test(pathname);
}

/**
 * Background sync - Sync when back online
 */
self.addEventListener('sync', (event: any) => {
  console.log('[ServiceWorker] Background sync:', event.tag);

  if (event.tag === 'sync-actions') {
    event.waitUntil(syncPendingActions());
  }

  if (event.tag === 'sync-logs') {
    event.waitUntil(syncPendingLogs());
  }
});

/**
 * Sync pending actions when back online
 */
async function syncPendingActions(): Promise<void> {
  try {
    const db = await openIndexedDB();
    const pending = await getAllFromIndexedDB(db, 'pendingActions');

    for (const action of pending) {
      try {
        await fetch('/api/actions/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action),
        });

        // Delete from IndexedDB after successful sync
        await deleteFromIndexedDB(db, 'pendingActions', action.id);
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync action:', error);
      }
    }

    console.log('[ServiceWorker] Synced', pending.length, 'pending actions');
  } catch (error) {
    console.error('[ServiceWorker] Sync failed:', error);
  }
}

/**
 * Sync pending logs when back online
 */
async function syncPendingLogs(): Promise<void> {
  try {
    const db = await openIndexedDB();
    const pending = await getAllFromIndexedDB(db, 'pendingLogs');

    for (const log of pending) {
      try {
        await fetch('/api/logs/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(log),
        });

        // Delete from IndexedDB after successful sync
        await deleteFromIndexedDB(db, 'pendingLogs', log.id);
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync log:', error);
      }
    }

    console.log('[ServiceWorker] Synced', pending.length, 'pending logs');
  } catch (error) {
    console.error('[ServiceWorker] Sync failed:', error);
  }
}

/**
 * IndexedDB helpers
 */

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('fepei360', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as any).result;

      // Create object stores
      if (!db.objectStoreNames.contains('pendingActions')) {
        db.createObjectStore('pendingActions', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('pendingLogs')) {
        db.createObjectStore('pendingLogs', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('cachedData')) {
        db.createObjectStore('cachedData', { keyPath: 'key' });
      }
    };
  });
}

function getAllFromIndexedDB(db: IDBDatabase, storeName: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

function deleteFromIndexedDB(db: IDBDatabase, storeName: string, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Message handling - Communicate with app
 */
self.addEventListener('message', (event: any) => {
  const { type, payload } = event.data;

  if (type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(payload.urls);
      })
    );
  }

  if (type === 'SAVE_TO_INDEXEDDB') {
    event.waitUntil(
      openIndexedDB().then((db) => {
        const transaction = db.transaction(payload.storeName, 'readwrite');
        const store = transaction.objectStore(payload.storeName);
        return new Promise((resolve) => {
          const request = store.add(payload.data);
          request.onsuccess = () => resolve(undefined);
        });
      })
    );
  }
});

// Prevent TypeScript errors
export {};

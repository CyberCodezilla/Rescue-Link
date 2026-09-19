// RescueLink Survivor Portal Service Worker - Offline Captive Caching
const CACHE_NAME = 'rescuelink-survivor-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Strictly bypass API endpoints, SSE streams, non-GET, and range requests
  if (
    request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('/events') ||
    url.pathname.includes('/incidents') ||
    request.headers.has('range')
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // 2. Only cache successful, non-opaque, non-streamed static assets
        if (
          !response ||
          response.status !== 200 ||
          response.type !== 'basic' ||
          response.bodyUsed // Guard against already-consumed streams
        ) {
          return response;
        }

        try {
          // 3. Clone synchronously BEFORE any async cache opening
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache).catch(() => {});
          });
        } catch (err) {
          // Non-fatal: if cloning fails, serve the original network response
          console.warn('[SW] Cache clone skipped:', err);
        }

        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          if (request.mode === 'navigate') return caches.match('/');
        });
      })
  );
});

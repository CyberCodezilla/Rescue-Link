// Rescue-Link responder-web service worker.
//
// Scope: cache OSM map tiles (stale-while-revalidate) and the last-seen
// /api/incidents response (network-first, cache fallback) safely.

const TILE_CACHE = 'rescue-link-tiles-v1';
const API_CACHE = 'rescue-link-api-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== TILE_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

function isTileRequest(url) {
  return /tile\.openstreetmap\.org/.test(url) || /arcgisonline\.com/.test(url) || /opentopomap\.org/.test(url);
}

function isIncidentListRequest(url, request) {
  return (
    request.method === 'GET' &&
    url.includes('/api/incidents') &&
    !url.includes('/api/incidents/') &&
    !request.headers.has('range')
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = request.url;
  const parsedUrl = new URL(url);

  // 1. Strictly bypass SSE streams, non-GET, audio range requests, mutations
  if (
    parsedUrl.pathname.includes('/events') ||
    request.headers.has('range') ||
    parsedUrl.pathname.includes('/broadcast') ||
    parsedUrl.pathname.includes('/acknowledge')
  ) {
    return;
  }

  // Map tiles: stale-while-revalidate.
  if (isTileRequest(url)) {
    event.respondWith(
      caches.open(TILE_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const fetchPromise = fetch(request)
            .then((response) => {
              if (response && response.status === 200 && !response.bodyUsed) {
                try {
                  const clone = response.clone();
                  cache.put(request, clone).catch(() => {});
                } catch (err) {
                  // Non-fatal: if cloning fails, serve original
                }
              }
              return response;
            })
            .catch(() => cached);
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // Incident list: network-first, fall back to cached response
  if (isIncidentListRequest(url, request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200 && !response.bodyUsed) {
            try {
              // Synchronously clone BEFORE async caches.open()
              const clone = response.clone();
              caches.open(API_CACHE).then((cache) => {
                cache.put(request, clone).catch(() => {});
              });
            } catch (err) {
              // Non-fatal: if cloning fails, proceed with response
            }
          }
          return response;
        })
        .catch(() => caches.open(API_CACHE).then((cache) => cache.match(request)))
    );
    return;
  }
});

// Service Worker for production caching (optional)
// This file is ready for when PWA features are needed

const CACHE_NAME = 'reym-course-flow-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  // Add other static assets as needed
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when possible
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
          .then((fetchResponse) => {
            // Don't cache API responses or large files
            if (!shouldCache(event.request, fetchResponse)) {
              return fetchResponse;
            }
            
            // Clone the response to cache it
            const responseToCache = fetchResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(event.request, responseToCache));
            
            return fetchResponse;
          });
      })
      .catch(() => {
        // Return offline fallback if available
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

function shouldCache(request, response) {
  // Don't cache API responses
  if (request.url.includes('/api/')) return false;
  
  // Don't cache large files
  const contentLength = response.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 1024 * 1024) return false; // 1MB
  
  // Only cache successful responses
  return response.status === 200;
}
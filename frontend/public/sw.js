const CACHE_NAME = 'arogya-raksha-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/logo.jpg',
  '/favicon.svg',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Only handle GET requests and skip API requests or external links
  if (
    e.request.method !== 'GET' || 
    !e.request.url.startsWith(self.location.origin) ||
    e.request.url.includes('/api/')
  ) {
    return;
  }
  
  // Network First strategy for navigation/HTML requests to prevent stale asset hashes from rendering blank pages
  if (e.request.mode === 'navigate' || e.request.url.endsWith('.html') || e.request.url === self.location.origin + '/') {
    e.respondWith(
      fetch(e.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        return caches.match('/').then(cached => cached || caches.match('/index.html'));
      })
    );
    return;
  }
  
  // Cache First strategy for static assets (JS, CSS, images) which are immutable and have unique hashes
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(e.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        
        // Cache newly fetched assets dynamically
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });
        
        return networkResponse;
      });
    })
  );
});

const CACHE_NAME = 'music-antenna-v186';
self.addEventListener('install', function(e) { self.skipWaiting(); });
self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(function(cacheNames) {
    return Promise.all(cacheNames.map(function(cacheName) { return caches.delete(cacheName); }));
  }));
});
self.addEventListener('fetch', function(e) {
  e.respondWith(fetch(e.request).catch(function() { return caches.match(e.request); }));
});
// Force update by changing cache version
const CACHE = 'sxc-attend-v4';
const BASE = '/sxc_atttendence/';
const ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'icon-192.png',
  BASE + 'icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  // Force immediate activation
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    // Delete ALL old caches
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => {
        console.log('Deleting old cache:', k);
        return caches.delete(k);
      }))
    )
  );
  // Take control of all pages immediately
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Skip cross-origin requests
  if (!e.request.url.includes('ajay70042.github.io')) return;

  e.respondWith(
    // Network first — always get fresh content
    fetch(e.request).then(res => {
      if (res && res.status === 200) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => {
      // Only use cache if network fails
      return caches.match(e.request).then(cached =>
        cached || caches.match(BASE + 'index.html')
      );
    })
  );
});

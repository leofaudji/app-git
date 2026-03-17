// ============================================================
// Service Worker for GitDeploy PWA
// ============================================================
const CACHE_NAME = 'gitdeploy-v4';
const STATIC_CACHE = 'gitdeploy-static-v4';

// Using relative paths so it works regardless of the app's subdirectory
const STATIC_ASSETS = [
  './',
  './index.php',
  './assets/css/app.css',
  './assets/js/api.js',
  './assets/js/router.js',
  './assets/js/main.js',
  './assets/js/app.js',
  './assets/js/pages/projects.js',
  './assets/js/pages/dashboard.js',
  './assets/js/pages/git.js',
  './assets/js/pages/logs.js',
  './assets/js/pages/users.js',
  './assets/js/pages/roles.js',
  './assets/js/pages/settings.js',
  './assets/js/pages/profile.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];

// Install: cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // API calls — always network, never cache
  // We check if "/api/" is in the path
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ success: false, message: 'Offline' }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // Static assets — cache first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

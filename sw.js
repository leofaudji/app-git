// ============================================================
// Service Worker for GitDeploy PWA
// ============================================================
const CACHE_NAME   = 'gitdeploy-v2';
const STATIC_CACHE = 'gitdeploy-static-v2';

const STATIC_ASSETS = [
  '/app-git/',
  '/app-git/index.php',
  '/app-git/assets/css/app.css',
  '/app-git/assets/js/api.js',
  '/app-git/assets/js/router.js',
  '/app-git/assets/js/app.js',
  '/app-git/assets/js/pages/dashboard.js',
  '/app-git/assets/js/pages/git.js',
  '/app-git/assets/js/pages/logs.js',
  '/app-git/assets/js/pages/users.js',
  '/app-git/assets/js/pages/roles.js',
  '/app-git/assets/js/pages/settings.js',
  '/app-git/assets/js/pages/profile.js',
  '/app-git/assets/icons/icon-192.png',
  '/app-git/assets/icons/icon-512.png',
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
  if (url.pathname.startsWith('/app-git/api/')) {
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

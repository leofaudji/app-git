// ============================================================
// router.js - Hash-based SPA Router
// ============================================================
export const Router = (() => {
  const routes = {};
  let currentRoute = null;

  // Register route:  Router.on('dashboard', PageDashboard.render)
  function on(name, handler) {
    routes[name] = handler;
  }

  function navigate(hash) {
    window.location.hash = hash;
  }

  function resolve() {
    const fullHash = window.location.hash.replace('#', '') || 'dashboard';
    const [hash, queryString] = fullHash.split('?');
    const params = new URLSearchParams(queryString || '');
    const view = document.getElementById('page-view');
    const loading = document.getElementById('page-loading');

    // Find handler: exact match or prefix match
    const parts = hash.split('-');
    let handler = null;
    let matched = hash;

    for (let i = parts.length; i >= 1; i--) {
      const attempt = parts.slice(0, i).join('-');
      if (routes[attempt]) {
        handler = routes[attempt];
        matched = attempt;
        break;
      }
    }

    if (!handler) {
      view.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>Halaman tidak ditemukan</h3>
          <p>Route <code>${hash}</code> tidak ada</p>
        </div>`;
      loading.style.display = 'none';
      view.style.display = '';
      return;
    }

    currentRoute = hash;
    loading.style.display = 'flex';
    view.style.display = 'none';

    // Update active menu
    document.querySelectorAll('.nav-item, .nav-sub-item').forEach(el => {
      const route = el.dataset.route;
      if (route) {
        el.classList.toggle('active', route === '#' + hash || route === '#' + matched);
      }
    });

    // Run handler (may be async)
    Promise.resolve(handler(hash, params)).then(() => {
      loading.style.display = 'none';
      view.style.display = '';
    }).catch(err => {
      console.error('[Router]', err);
      view.innerHTML = `<div class="alert alert-error">Gagal memuat halaman: ${err.message}</div>`;
      loading.style.display = 'none';
      view.style.display = '';
    });
  }

  function init() {
    window.addEventListener('hashchange', resolve);
    resolve();
  }

  function getCurrent() { return currentRoute; }

  return { on, navigate, init, resolve, getCurrent };
})();

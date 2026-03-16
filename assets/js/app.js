// ============================================================
// app.js - Main Application Controller
// ============================================================
const App = (() => {
  let currentUser = null;

  // ─── Icons for menu ───
  const ICONS = {
    dashboard: '◈',
    git:       '⎇',
    logs:      '📋',
    users:     '👥',
    roles:     '🔑',
    settings:  '⚙',
    profile:   '👤',
  };

  // ─── Render sidebar menu from RBAC API ───
  async function renderMenu() {
    const res = await Api.get('menu');
    if (!res || !res.success) return;

    const nav = document.getElementById('sidebar-nav');
    nav.innerHTML = '';

    // Group items
    const mainItems = res.data.filter(m => !['profile','settings'].includes(m.id));
    const bottomItems = res.data.filter(m => ['profile','settings'].includes(m.id));

    const buildItem = (item) => {
      if (item.children) {
        // Parent with submenu
        const wrap = document.createElement('div');
        wrap.innerHTML = `
          <div class="nav-item" data-menu="${item.id}">
            <div class="nav-item-inner">
              <span class="nav-icon">${ICONS[item.icon] ?? '●'}</span>
              <span>${item.label}</span>
              <span class="nav-chevron">›</span>
            </div>
          </div>
          <div class="nav-submenu" id="sub-${item.id}">
            ${item.children.map(child => `
              <div class="nav-sub-item" data-route="${child.route}" onclick="Router.navigate('${child.route.replace('#','')}');closeMobileSidebar()">
                ${child.label}
              </div>`).join('')}
          </div>`;

        const parent = wrap.querySelector('.nav-item');
        const submenu = wrap.querySelector('.nav-submenu');
        parent.addEventListener('click', () => {
          const open = submenu.classList.toggle('open');
          parent.classList.toggle('expanded', open);
        });
        return wrap;
      } else {
        // Single item
        const el = document.createElement('div');
        el.className = 'nav-item';
        el.dataset.route = item.route;
        el.innerHTML = `
          <div class="nav-item-inner">
            <span class="nav-icon">${ICONS[item.icon] ?? '●'}</span>
            <span>${item.label}</span>
          </div>`;
        el.addEventListener('click', () => {
          Router.navigate(item.route.replace('#', ''));
          closeMobileSidebar();
        });
        return el;
      }
    };

    if (mainItems.length) {
      const label = document.createElement('div');
      label.className = 'nav-section-label';
      label.textContent = 'Menu Utama';
      nav.appendChild(label);
      mainItems.forEach(item => nav.appendChild(buildItem(item)));
    }

    if (bottomItems.length) {
      const label = document.createElement('div');
      label.className = 'nav-section-label';
      label.textContent = 'Akun';
      nav.appendChild(label);
      bottomItems.forEach(item => nav.appendChild(buildItem(item)));
    }
  }

  // ─── Update topbar user info ───
  function updateUserUI(user) {
    const initials = user.full_name.split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase();
    document.getElementById('user-avatar-initials').textContent = initials;
    document.getElementById('user-full-name').textContent = user.full_name;
    document.getElementById('user-role-label').textContent = user.roles.map(r => r.label).join(', ') || 'User';
    document.getElementById('topbar-user').textContent = user.username;
  }

  // ─── Update page title ───
  function setPageTitle(title) {
    document.getElementById('page-title').textContent = title;
    document.title = `${title} — ${document.getElementById('sidebar-app-name').textContent}`;
  }

  // ─── Register routes ───
  function registerRoutes() {
    Router.on('dashboard', async () => {
      setPageTitle('Dashboard');
      await PageDashboard.render();
    });
    Router.on('git', async (hash) => {
      setPageTitle('Git Operations');
      if (hash === 'git-pull') await PageGit.render('pull');
      else await PageGit.render('status');
    });
    Router.on('logs', async () => {
      setPageTitle('Deploy Logs');
      await PageLogs.render();
    });
    Router.on('users', async () => {
      setPageTitle('User Management');
      await PageUsers.render();
    });
    Router.on('roles', async () => {
      setPageTitle('Roles & Permissions');
      await PageRoles.render();
    });
    Router.on('settings', async () => {
      setPageTitle('Settings');
      await PageSettings.render();
    });
    Router.on('profile', async () => {
      setPageTitle('Profil Saya');
      await PageProfile.render();
    });
  }

  // ─── Login ───
  async function handleLogin(e) {
    e.preventDefault();
    const btn     = document.getElementById('login-btn');
    const spinner = document.getElementById('login-spinner');
    const alert   = document.getElementById('login-alert');
    const username = document.getElementById('inp-username').value.trim();
    const password = document.getElementById('inp-password').value;

    btn.disabled = true;
    spinner.style.display = 'inline-block';
    alert.style.display = 'none';

    const res = await Api.post('auth?action=login', { username, password });
    btn.disabled = false;
    spinner.style.display = 'none';

    if (!res || !res.success) {
      alert.textContent = res?.message || 'Login gagal';
      alert.style.display = 'flex';
      return;
    }

    Api.setCsrf(res.data.csrf_token);
    await showApp();
  }

  // ─── Show main app after login ───
  async function showApp() {
    const statusRes = await Api.get('auth?action=status');
    if (!statusRes?.data?.authenticated) {
      showLogin();
      return;
    }

    currentUser = statusRes.data.user;
    Api.setCsrf(statusRes.data.csrf_token);

    // Switch UI
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('app-layout').style.display = 'flex';

    updateUserUI(currentUser);
    await renderMenu();
    registerRoutes();
    Router.init();

    // Expose user globally for pages
    window.CurrentUser = currentUser;
  }

  // ─── Show login ───
  function showLogin() {
    document.getElementById('app-layout').style.display = 'none';
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('inp-username').value = '';
    document.getElementById('inp-password').value = '';
    document.getElementById('login-alert').style.display = 'none';
  }

  // ─── Logout ───
  async function logout(forced = false) {
    if (!forced) {
      const res = await Api.post('auth?action=logout', {});
      if (res) { /* success */ }
    }
    currentUser = null;
    window.CurrentUser = null;
    showLogin();
    Toast.info('Anda telah logout');
  }

  // ─── Init ───
  async function init() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);

    // Toggle password visibility
    document.getElementById('toggle-pass').addEventListener('click', () => {
      const inp = document.getElementById('inp-password');
      inp.type = inp.type === 'password' ? 'text' : 'password';
    });

    // Logout button
    document.getElementById('logout-btn').addEventListener('click', () => logout());

    // Mobile sidebar toggle
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
      const overlay = document.getElementById('sidebar-overlay');
      overlay.style.display = document.getElementById('sidebar').classList.contains('open') ? 'block' : 'none';
    });

    // PWA install
    initPWA();

    // Check if already logged in
    const statusRes = await Api.get('auth?action=status');
    if (statusRes?.data?.authenticated) {
      await showApp();
    }
    // (login page is already visible by default)
  }

  return { init, logout, setPageTitle };
})();

// ─── Mobile sidebar close helper ───
function closeMobileSidebar() {
  if (window.innerWidth <= 900) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').style.display = 'none';
  }
}

// ─── PWA ───
function initPWA() {
  let deferredPrompt = null;
  const banner = document.getElementById('pwa-banner');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (!localStorage.getItem('pwa-dismissed')) {
      setTimeout(() => banner.classList.add('show'), 2000);
    }
  });

  document.getElementById('pwa-install-btn').addEventListener('click', async () => {
    banner.classList.remove('show');
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') Toast.success('Aplikasi berhasil diinstall!');
    deferredPrompt = null;
  });

  document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
    banner.classList.remove('show');
    localStorage.setItem('pwa-dismissed', '1');
  });

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/app-git/sw.js')
      .then(reg => console.log('[SW] Registered:', reg.scope))
      .catch(err => console.warn('[SW] Registration failed:', err));
  }
}

// ─── Start app ───
document.addEventListener('DOMContentLoaded', () => App.init());

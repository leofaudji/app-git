// ============================================================
// app.js - Main Application Controller
// ============================================================
import { Api, Toast } from "./api.js";
import { Router } from "./router.js";
import { PageDashboard } from "./pages/dashboard.js";
import { PageProjects } from "./pages/projects.js";
import { PageGit } from "./pages/git.js";
import { PageLogs } from "./pages/logs.js";
import { PageWebhookLogs } from "./pages/webhook_logs.js";
import { PageUsers } from "./pages/users.js";
import { PageRoles } from "./pages/roles.js";
import { PageSettings } from "./pages/settings.js";
import { PageProfile } from "./pages/profile.js";
import { PageChangelog } from "./pages/changelog.js";
import { PageAuditLogs } from "./pages/audit_logs.js";
import { PageBackup } from "./pages/backup.js";
import { PageEnvManager } from "./pages/envmanager.js";

export const App = (() => {
  let currentUser = null;

  // ─── Icons for menu ───
  const ICONS = {
    dashboard: '⊞',
    projects:  '📂',
    git:       '⎇',
    logs:      '📜',
    webhook:   '📡',
    audit:     '📋',
    users:     '👥',
    roles:     '🔑',
    settings:  '⚙',
    profile:   '👤',
    changelog: '✨',
    backup:    '💾',
    env:       '🔐',
  };

  // ─── Render sidebar menu from RBAC API ───
  async function renderMenu() {
    const nav = document.getElementById('sidebar-nav');
    const res = await Api.get('menu');
    
    if (!res || !res.success) {
      console.error('[App] Failed to load menu:', res);
      if (nav) {
        nav.innerHTML = `
          <div class="p-4 text-[10px] text-danger bg-red-50 rounded-lg border border-red-100 m-2">
            <strong>Gagal memuat menu:</strong><br>
            ${res?.message || 'Unknown error'}
          </div>`;
      }
      return;
    }
    nav.innerHTML = '';

    // Group items for a cleaner look
    const groups = [
      { label: 'Utama', items: res.data.filter(m => ['dashboard', 'projects'].includes(m.id)) },
      { label: 'Monitoring', items: res.data.filter(m => m.id.includes('-logs') || m.id === 'logs') },
      { label: 'Security & Config', items: res.data.filter(m => ['env-manager', 'backup'].includes(m.id)) },
      { label: 'Akses', items: res.data.filter(m => ['users', 'roles'].includes(m.id)) },
      { label: 'Sistem', items: res.data.filter(m => ['settings', 'changelog', 'profile'].includes(m.id)) }
    ];

    const buildItem = (item) => {
      const el = document.createElement('div');
      el.className = 'nav-item';
      
      // Highlight active route
      if (window.location.hash === item.route || (window.location.hash === '' && item.id === 'dashboard')) {
        el.classList.add('active');
      }

      el.dataset.route = item.route;
      el.innerHTML = `
        <div class="nav-item-inner">
          ${item.icon ? `<span class="nav-icon">${ICONS[item.icon] ?? '●'}</span>` : '<span class="nav-icon-spacer"></span>'}
          <span>${item.label}</span>
        </div>`;
      el.addEventListener('click', () => {
        Router.navigate(item.route.replace('#', ''));
        // Close sidebar on mobile
        if (window.innerWidth < 1024) document.getElementById('sidebar').classList.remove('open');
      });
      return el;
    };

    groups.forEach(group => {
      if (group.items.length === 0) return;
      
      const groupWrapper = document.createElement('div');
      groupWrapper.className = 'nav-group mb-4';
      
      const label = document.createElement('div');
      label.className = 'nav-section-label';
      label.textContent = group.label;
      groupWrapper.appendChild(label);
      
      group.items.forEach(item => {
        groupWrapper.appendChild(buildItem(item));
      });
      
      nav.appendChild(groupWrapper);
    });
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
    Router.on('dashboard', async (hash, params) => {
      setPageTitle('Dashboard');
      await PageDashboard.render(params);
    });
    Router.on('projects', async (hash, params) => {
      setPageTitle('Manage Projects');
      await PageProjects.render(params);
    });
    Router.on('git', async (hash, params) => {
      setPageTitle('Git Operations');
      let action = 'status';
      if (hash === 'git-pull') action = 'pull';
      if (hash === 'git-history') action = 'history';
      await PageGit.render(action, params);
    });
    Router.on('logs', async (hash, params) => {
      setPageTitle('Deploy Logs');
      await PageLogs.render(params);
    });
    Router.on('webhook-logs', (hash, params) => {
      setPageTitle('Webhook Logs');
      PageWebhookLogs.render(hash, params);
    });
    Router.on('users', async (hash, params) => {
      setPageTitle('User Management');
      await PageUsers.render(params);
    });
    Router.on('roles', async (hash, params) => {
      setPageTitle('Roles & Permissions');
      await PageRoles.render(params);
    });
    Router.on('settings', async (hash, params) => {
      setPageTitle('Settings');
      await PageSettings.render(params);
    });
    Router.on('profile', async (hash, params) => {
      setPageTitle('Profil Saya');
      await PageProfile.render(params);
    });
    Router.on('changelog', async (hash, params) => {
      setPageTitle('Changelog');
      await PageChangelog.render(params);
    });
    Router.on('audit-logs', async (hash, params) => {
      setPageTitle('Audit Logs');
      await PageAuditLogs.render(params);
    });
    Router.on('backup', async (hash, params) => {
      setPageTitle('Database Backup');
      await PageBackup.render(params);
    });
    Router.on('env-manager', async (hash, params) => {
      setPageTitle('Environment Manager');
      await PageEnvManager.render(params);
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
    window.CurrentUser = currentUser; // Move this early

    // Switch UI
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('app-layout').style.display = 'flex';

    updateUserUI(currentUser);
    await renderMenu();
    registerRoutes();
    Router.init();

    // Fetch and display latest version
    updateAppVersion();
  }

  async function updateAppVersion() {
    const res = await Api.get('changelog?action=latest_version');
    const version = res?.success ? res.data.version : '1.0.0';
    
    // Update Sidebar
    const sideVer = document.getElementById('sidebar-version');
    if (sideVer) sideVer.textContent = 'v' + version;

    // Update Login
    const loginVer = document.getElementById('login-version');
    if (loginVer) loginVer.textContent = 'Version ' + version;
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
    
    // Version load (safe now as it's public, but good to have after initial status)
    App.updateAppVersion();

    if (statusRes?.data?.authenticated) {
      await showApp();
    }
    // (login page is already visible by default)
  }

  return { init, logout, setPageTitle, updateAppVersion };
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
    navigator.serviceWorker.register((typeof window.APP_PATH !== 'undefined' ? window.APP_PATH : '/app-git') + '/sw.js')
      .then(reg => console.log('[SW] Registered:', reg.scope))
      .catch(err => console.warn('[SW] Registration failed:', err));
  }
}

// (End of App module)

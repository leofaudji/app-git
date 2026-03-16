<?php
require_once __DIR__ . '/includes/config.php';

// Determine page title from settings if DB is available
$appName = 'GitDeploy';
try {
    require_once __DIR__ . '/includes/db.php';
    $appName = DB::getSetting('app_name', 'GitDeploy');
} catch (Exception $e) {
    // DB not ready yet
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="<?= htmlspecialchars($appName) ?> - Git Webhook Auto-Deploy Dashboard">
  <meta name="theme-color" content="#f6821f">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="<?= htmlspecialchars($appName) ?>">

  <title><?= htmlspecialchars($appName) ?></title>

  <!-- PWA -->
  <link rel="manifest" href="/app-git/manifest.json">
  <link rel="apple-touch-icon" href="/app-git/assets/icons/icon-192.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/app-git/assets/icons/icon-96.png">

  <!-- Tailwind CSS via CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: { sans: ['Inter', 'sans-serif'] }
        }
      }
    }
  </script>

  <!-- Custom CSS -->
  <link rel="stylesheet" href="/app-git/assets/css/app.css">
  
  <!-- SweetAlert2 -->
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
</head>
<body>

<!-- ╔══════════════════════════════════════╗
     ║         LOGIN PAGE                   ║
     ╚══════════════════════════════════════╝ -->
<div id="login-page">
  <div class="login-card">
    <div class="login-logo">
      <div class="logo-ring">🚀</div>
      <h1><?= htmlspecialchars($appName) ?></h1>
      <p>Git Webhook Auto-Deploy</p>
    </div>

    <div id="login-alert" class="alert alert-error" style="display:none"></div>

    <form id="login-form">
      <div class="form-group">
        <label class="form-label" for="inp-username">Username / Email</label>
        <input type="text" id="inp-username" name="username" class="form-input"
               placeholder="admin" autocomplete="username" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="inp-password">Password</label>
        <div style="position:relative">
          <input type="password" id="inp-password" name="password" class="form-input"
                 placeholder="••••••••" autocomplete="current-password" required>
          <button type="button" id="toggle-pass"
            style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:16px;">👁</button>
        </div>
      </div>
      <button type="submit" class="btn btn-primary" id="login-btn" style="width:100%;justify-content:center;margin-top:8px;">
        <span id="login-btn-text">Masuk</span>
        <span id="login-spinner" class="spinner" style="display:none;width:16px;height:16px;"></span>
      </button>
    </form>

    <div style="margin-top:20px;text-align:center;font-size:12px;color:var(--text-muted)">
      &copy; <?= date('Y') ?> <?= htmlspecialchars($appName) ?> &mdash; Secure Deployment Platform
    </div>
  </div>
</div>

<!-- ╔══════════════════════════════════════╗
     ║         MAIN APP (SPA)               ║
     ╚══════════════════════════════════════╝ -->
<div id="app-layout" style="display:none">

  <!-- ── Sidebar ── -->
  <aside id="sidebar">
    <div id="sidebar-logo">
      <div class="logo-icon">🚀</div>
      <div>
        <div class="logo-text" id="sidebar-app-name"><?= htmlspecialchars($appName) ?></div>
        <div class="logo-version">v<?= APP_VERSION ?></div>
      </div>
    </div>

    <nav id="sidebar-nav">
      <!-- Populated by app.js -->
    </nav>

    <div id="sidebar-user">
      <div class="user-avatar" id="user-avatar-initials">A</div>
      <div class="user-info">
        <div class="user-name" id="user-full-name">—</div>
        <div class="user-role" id="user-role-label">—</div>
      </div>
      <button class="user-logout-btn" id="logout-btn" title="Logout">⇥</button>
    </div>
  </aside>

  <!-- ── Main Content ── -->
  <div id="main">
    <!-- Topbar -->
    <header id="topbar">
      <button id="sidebar-toggle">☰</button>
      <div class="page-title" id="page-title">Dashboard</div>
      <span class="badge-online">● Online</span>
      <div style="font-size:13px;color:var(--text-muted);" id="topbar-user">—</div>
    </header>

    <!-- Page Content -->
    <div id="page-content">
      <div id="page-loading" style="display:flex;align-items:center;justify-content:center;padding:80px 0;gap:12px;">
        <div class="spinner" style="width:28px;height:28px"></div>
        <span style="color:var(--text-muted)">Memuat halaman…</span>
      </div>
      <div id="page-view"></div>
    </div>
  </div>

</div>

<!-- ── Sidebar Overlay (mobile) ── -->
<div id="sidebar-overlay"
  style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:99;"
  onclick="document.getElementById('sidebar').classList.remove('open');this.style.display='none'">
</div>

<!-- ── Toast Container ── -->
<div id="toast-container"></div>

<!-- ── PWA Install Banner ── -->
<div id="pwa-banner">
  <span style="font-size:24px">📱</span>
  <p>Install <strong><?= htmlspecialchars($appName) ?></strong> di perangkat Anda untuk akses cepat!</p>
  <button class="btn btn-primary btn-sm" id="pwa-install-btn">Install</button>
  <button class="btn btn-ghost btn-sm" id="pwa-dismiss-btn">Nanti</button>
</div>

<!-- ── JavaScript Modules ── -->
<script src="/app-git/assets/js/api.js?v=<?= APP_VERSION ?>"></script>
<script src="/app-git/assets/js/pages/projects.js?v=<?= APP_VERSION ?>"></script>
<script src="/app-git/assets/js/pages/dashboard.js?v=<?= APP_VERSION ?>"></script>
<script src="/app-git/assets/js/pages/git.js?v=<?= APP_VERSION ?>"></script>
<script src="/app-git/assets/js/pages/logs.js?v=<?= APP_VERSION ?>"></script>
<script src="/app-git/assets/js/pages/webhook_logs.js?v=<?= APP_VERSION ?>"></script>
<script src="/app-git/assets/js/pages/users.js?v=<?= APP_VERSION ?>"></script>
<script src="/app-git/assets/js/pages/roles.js?v=<?= APP_VERSION ?>"></script>
<script src="/app-git/assets/js/pages/settings.js?v=<?= APP_VERSION ?>"></script>
<script src="/app-git/assets/js/pages/profile.js?v=<?= APP_VERSION ?>"></script>
<script src="/app-git/assets/js/router.js?v=<?= APP_VERSION ?>"></script>
<script src="/app-git/assets/js/app.js?v=<?= APP_VERSION ?>"></script>

</body>
</html>

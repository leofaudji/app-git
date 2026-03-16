// ============================================================
// pages/settings.js - App Settings Page
// ============================================================
const PageSettings = (() => {

  async function render() {
    const view = document.getElementById('page-view');
    const canEdit = window.CurrentUser?.permissions?.settings?.includes('edit');

    const res = await Api.get('settings', { action: 'get' });
    if (!res?.success) {
      view.innerHTML = `<div class="alert alert-error">${res?.message || 'Gagal memuat settings'}</div>`;
      return;
    }

    const settings = {};
    res.data.forEach(s => { settings[s.key] = s; });

    const webhookUrl = `${window.location.origin}/app-git/api/webhook.php`;

    view.innerHTML = `
      <div class="grid-2">

        <!-- Git Configuration -->
        <div class="card">
          <div class="card-title">⎇ Git Configuration</div>
          <div id="settings-alert" class="alert alert-success" style="display:none"></div>

          <div class="form-group">
            <label class="form-label">Nama Aplikasi</label>
            <input type="text" id="set-app_name" class="form-input" value="${settings.app_name?.value || ''}"
              placeholder="GitDeploy" ${canEdit ? '' : 'disabled'}>
          </div>
          <div class="form-group">
            <label class="form-label">Git Repository Directory</label>
            <input type="text" id="set-git_dir" class="form-input" value="${settings.git_dir?.value || ''}"
              placeholder="/var/www/html/myapp" ${canEdit ? '' : 'disabled'}>
            <div class="form-hint">Path absolut ke folder repository (yang berisi .git/)</div>
          </div>
          <div class="form-group">
            <label class="form-label">Default Branch</label>
            <input type="text" id="set-git_branch" class="form-input" value="${settings.git_branch?.value || 'main'}"
              placeholder="main" ${canEdit ? '' : 'disabled'}>
          </div>
          <div class="form-group">
            <label class="form-label">Notification Email</label>
            <input type="email" id="set-notify_email" class="form-input" value="${settings.notify_email?.value || ''}"
              placeholder="ops@company.com" ${canEdit ? '' : 'disabled'}>
          </div>
          <div class="form-group">
            <div class="toggle-wrap">
              <label class="toggle">
                <input type="checkbox" id="set-auto_deploy" ${settings.auto_deploy?.value === '1' ? 'checked' : ''} ${canEdit ? '' : 'disabled'}>
                <span class="toggle-slider"></span>
              </label>
              <span class="form-label" style="margin:0">Auto Deploy on Webhook</span>
            </div>
            <div class="form-hint">Jika dinonaktifkan, webhook tidak akan menjalankan git pull</div>
          </div>

          ${canEdit ? '<button class="btn btn-primary" onclick="PageSettings.save()">💾 Simpan Settings</button>' : ''}
        </div>

        <!-- Webhook Info -->
        <div>
          <div class="card mb-4">
            <div class="card-title">🔗 Webhook URL</div>
            <p class="text-sm text-muted mb-3">Gunakan URL ini di GitHub / GitLab / Bitbucket:</p>
            <div style="display:flex;gap:8px">
              <input type="text" class="form-input font-mono" value="${webhookUrl}" id="webhook-url-inp" readonly style="font-size:12px">
              <button class="btn btn-ghost btn-sm" onclick="PageSettings.copyWebhookUrl()" title="Copy">📋</button>
            </div>
            <div class="form-group" style="margin-top:16px">
              <label class="form-label">Webhook Secret Key</label>
              <div style="display:flex;gap:8px">
                <input type="password" id="set-webhook_secret" class="form-input font-mono" placeholder="Masukkan secret baru untuk mengubah"
                  ${canEdit ? '' : 'disabled'}>
                <button class="btn btn-ghost btn-sm" onclick="PageSettings.toggleSecret()" title="Show/Hide">👁</button>
              </div>
              <div class="form-hint">Secret harus sama di platform Git. Biarkan kosong untuk mempertahankan nilai sekarang.</div>
            </div>
          </div>

          <!-- Setup Guide -->
          <div class="card">
            <div class="card-title">📖 Cara Setup Webhook</div>
            <div style="display:flex;flex-direction:column;gap:14px;font-size:13.5px">
              <div>
                <div style="font-weight:600;margin-bottom:6px;color:#818cf8">🐙 GitHub</div>
                <ol style="padding-left:18px;color:var(--text-muted);line-height:1.8">
                  <li>Buka Settings → Webhooks → Add webhook</li>
                  <li>Payload URL: copy URL di atas</li>
                  <li>Content type: <code>application/json</code></li>
                  <li>Secret: sama dengan Webhook Secret di atas</li>
                  <li>Event: <strong>Just the push event</strong></li>
                </ol>
              </div>
              <div>
                <div style="font-weight:600;margin-bottom:6px;color:#f97316">🦊 GitLab</div>
                <ol style="padding-left:18px;color:var(--text-muted);line-height:1.8">
                  <li>Buka Settings → Webhooks</li>
                  <li>URL: copy URL di atas</li>
                  <li>Secret token: sama dengan Webhook Secret</li>
                  <li>Trigger: <strong>Push events</strong></li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  async function save() {
    const alertEl = document.getElementById('settings-alert');
    const data = {
      settings: {
        app_name:       document.getElementById('set-app_name')?.value || '',
        git_dir:        document.getElementById('set-git_dir')?.value || '',
        git_branch:     document.getElementById('set-git_branch')?.value || 'main',
        notify_email:   document.getElementById('set-notify_email')?.value || '',
        auto_deploy:    document.getElementById('set-auto_deploy')?.checked ? '1' : '0',
        webhook_secret: document.getElementById('set-webhook_secret')?.value || '',
      }
    };

    const res = await Api.post('settings?action=save', data);
    if (!res?.success) {
      Toast.error(res?.message || 'Gagal menyimpan');
      return;
    }
    alertEl.textContent = '✓ Settings berhasil disimpan';
    alertEl.className = 'alert alert-success';
    alertEl.style.display = 'flex';
    Toast.success('Settings disimpan');
    setTimeout(() => alertEl.style.display = 'none', 3000);
  }

  function copyWebhookUrl() {
    const inp = document.getElementById('webhook-url-inp');
    inp.select();
    navigator.clipboard.writeText(inp.value);
    Toast.success('URL disalin!');
  }

  function toggleSecret() {
    const inp = document.getElementById('set-webhook_secret');
    inp.type = inp.type === 'password' ? 'text' : 'password';
  }

  return { render, save, copyWebhookUrl, toggleSecret };
})();

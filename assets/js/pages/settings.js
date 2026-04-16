// ============================================================
// pages/settings.js - App Settings Page
// ============================================================
import { Api, Toast } from "../api.js";

export const PageSettings = (() => {

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

    const webhookUrl = `${window.location.origin}${window.APP_PATH}/api/webhook`;

    view.innerHTML = `
      <div class="fade-in-up">
        <div class="grid-2 gap-6">

        <!-- Global Configuration -->
        <div class="card">
          <div class="p-4 border-b bg-gray-50"><h3 class="font-bold">⚙ Global Configuration</h3></div>
          <div class="p-4">
            <div id="settings-alert" class="alert alert-success mb-4" style="display:none"></div>

            <div class="form-group">
              <label class="form-label text-xs uppercase font-bold tracking-tight">Nama Aplikasi</label>
              <input type="text" id="set-app_name" class="form-input" value="${settings.app_name?.value || ''}"
                placeholder="GitDeploy" ${canEdit ? '' : 'disabled'}>
            </div>
            
            <div class="form-group">
              <label class="form-label text-xs uppercase font-bold tracking-tight">Global Projects Base Directory</label>
              <input type="text" id="set-git_base_dir" class="form-input font-mono" value="${settings.git_base_dir?.value || ''}"
                placeholder="D:\\projects" ${canEdit ? '' : 'disabled'}>
              <div class="form-hint">Folder utama yang berisi banyak subfolder project Git.</div>
            </div>

            <div class="form-group">
              <label class="form-label text-xs uppercase font-bold tracking-tight">Global Backups Directory</label>
              <input type="text" id="set-backup_base_dir" class="form-input font-mono" value="${settings.backup_base_dir?.value || ''}"
                placeholder="D:\\backups\\gitdeploy" ${canEdit ? '' : 'disabled'}>
              <div class="form-hint">Folder penyimpanan hasil backup database project (di luar project root).</div>
            </div>

            <div class="form-group">
              <label class="form-label text-xs uppercase font-bold tracking-tight">Default Webhook Secret</label>
              <div class="flex gap-2">
                <input type="password" id="set-webhook_secret_default" class="form-input font-mono" placeholder="Kosongkan untuk mempertahankan"
                  ${canEdit ? '' : 'disabled'}>
                <button class="btn btn-ghost" type="button" onclick="PageSettings.toggleSecret('set-webhook_secret_default')" title="Show/Hide">👁</button>
              </div>
              <div class="form-hint">Digunakan jika project tidak menentukan secret sendiri.</div>
            </div>

            <div class="form-group">
              <label class="form-label text-xs uppercase font-bold tracking-tight">Notification Email</label>
              <input type="email" id="set-notify_email" class="form-input" value="${settings.notify_email?.value || ''}"
                placeholder="ops@company.com" ${canEdit ? '' : 'disabled'}>
            </div>

            <div class="form-group">
              <div class="toggle-wrap">
                <label class="toggle">
                  <input type="checkbox" id="set-auto_deploy" ${settings.auto_deploy?.value === '1' ? 'checked' : ''} ${canEdit ? '' : 'disabled'}>
                  <span class="toggle-slider"></span>
                </label>
                <span class="text-sm font-medium">Enable Auto Deploy (Global)</span>
              </div>
              <div class="form-hint">Jika mati, semua webhook akan diabaikan.</div>
            </div>

            <div class="pt-4 border-t mt-4">
              <h4 class="text-xs font-bold uppercase text-primary mb-3">📅 Automatic Backup Schedule</h4>
              
              <div class="form-group">
                <div class="toggle-wrap">
                  <label class="toggle">
                    <input type="checkbox" id="set-backup_auto_enable" ${settings.backup_auto_enable?.value === '1' ? 'checked' : ''} ${canEdit ? '' : 'disabled'}>
                    <span class="toggle-slider"></span>
                  </label>
                  <span class="text-sm font-medium">Enable Automatic Backups</span>
                </div>
              </div>

              <div class="grid-2 gap-4">
                <div class="form-group">
                  <label class="form-label text-xs uppercase font-bold tracking-tight">Schedule Time</label>
                  <input type="time" id="set-backup_schedule_time" class="form-input" value="${settings.backup_schedule_time?.value || '02:00'}" ${canEdit ? '' : 'disabled'}>
                </div>
                <div class="form-group">
                  <label class="form-label text-xs uppercase font-bold tracking-tight">Cron Secret</label>
                  <div class="flex gap-2">
                    <input type="password" id="set-backup_cron_secret" class="form-input font-mono" value="${settings.backup_cron_secret?.value || ''}" ${canEdit ? '' : 'disabled'}>
                    <button class="btn btn-ghost" type="button" onclick="PageSettings.toggleSecret('set-backup_cron_secret')" title="Show/Hide">👁</button>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label text-xs uppercase font-bold tracking-tight">Schedule Days</label>
                <div class="grid grid-cols-4 sm:grid-cols-7 gap-2 mt-2" id="backup-days-selector">
                  ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => `
                    <label class="flex items-center gap-2 p-2 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                      <input type="checkbox" name="backup_day" value="${day}" 
                        ${(settings.backup_schedule_days?.value || '').includes(day) ? 'checked' : ''} 
                        ${canEdit ? '' : 'disabled'}>
                      <span class="text-xs font-medium">${day}</span>
                    </label>
                  `).join('')}
                </div>
                <div class="form-hint">Pilih hari kapan saja backup otomatis akan dijalankan.</div>
              </div>
              
              <div class="bg-gray-50 p-3 rounded text-[10px] font-mono text-muted border">
                <strong>Cron Command:</strong><br>
                curl -s "${window.location.origin}${window.APP_PATH}/api/cron.php?secret=${settings.backup_cron_secret?.value || 'SECRET'}"
              </div>
            </div>

            ${canEdit ? '<button class="btn btn-primary w-full justify-center" onclick="PageSettings.save()">💾 Simpan Konfigurasi</button>' : ''}
          </div>
        </div>

        <!-- Database Maintenance -->
        <div class="card">
          <div class="p-4 border-b bg-gray-50"><h3 class="font-bold">📦 Database Maintenance</h3></div>
          <div class="p-4">
            <div class="mb-4">
              <p class="text-sm text-muted mb-3 italic">Simpan cadangan data Anda atau pulihkan dari file backup sebelumnya.</p>
              <button class="btn btn-ghost w-full justify-center mb-3" onclick="PageSettings.downloadBackup()">
                📥 Download Backup (.sql)
              </button>
            </div>

            ${canEdit ? `
            <div class="pt-4 border-t">
              <p class="text-xs font-bold uppercase text-danger mb-2">⚠ Restore Database</p>
              <p class="text-xs text-muted mb-3">Pilih file .sql hasil backup untuk menimpa data saat ini.</p>
              <input type="file" id="restore-file" class="form-input text-xs mb-3" accept=".sql">
              <button class="btn btn-danger w-full justify-center" onclick="PageSettings.restoreBackup()">
                📤 Restore Data
              </button>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Webhook Info & Help -->
        <div>
          <div class="card mb-6">

            <div class="p-4 border-b bg-gray-50"><h3 class="font-bold">🔗 Webhook Endpoint</h3></div>
            <div class="p-4">
              <p class="text-sm text-muted mb-3">Gunakan satu URL ini untuk SEMUA project Anda di GitHub / GitLab:</p>
              <div class="flex gap-2">
                <input type="text" class="form-input font-mono bg-gray-50 text-xs" value="${webhookUrl}" id="webhook-url-inp" readonly>
                <button class="btn btn-ghost btn-sm" onclick="PageSettings.copyWebhookUrl()" title="Copy">📋</button>
              </div>
              <p class="text-xs text-muted mt-3 italic">Aplikasi akan otomatis mencocokkan payload repository ke project yang terdaftar.</p>
            </div>
          </div>

          <div class="card">
            <div class="p-4 border-b bg-gray-50"><h3 class="font-bold">📖 Setup Guide</h3></div>
            <div class="p-4 space-y-4 text-sm">
              <div>
                <div class="font-bold text-indigo-600 mb-2">🐙 GitHub Setup</div>
                <ol class="list-decimal pl-4 space-y-1 text-muted">
                  <li>Repository Settings → Webhooks → Add</li>
                  <li>Payload URL: (Copy di atas)</li>
                  <li>Content type: <code>application/json</code></li>
                  <li>Secret: (Default Webhook Secret Anda)</li>
                </ol>
              </div>
              <div class="pt-4 border-t">
                <div class="font-bold text-orange-600 mb-2">🦊 GitLab Setup</div>
                <ol class="list-decimal pl-4 space-y-1 text-muted">
                  <li>Repository Settings → Webhooks</li>
                  <li>URL: (Copy di atas)</li>
                  <li>Secret token: (Default Webhook Secret Anda)</li>
                  <li>Trigger: Push events</li>
                </ol>
              </div>
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
        app_name:               document.getElementById('set-app_name')?.value || '',
        git_base_dir:           document.getElementById('set-git_base_dir')?.value || '',
        backup_base_dir:        document.getElementById('set-backup_base_dir')?.value || '',
        notify_email:           document.getElementById('set-notify_email')?.value || '',
        auto_deploy:            document.getElementById('set-auto_deploy')?.checked ? '1' : '0',
        webhook_secret_default: document.getElementById('set-webhook_secret_default')?.value || '',
        backup_auto_enable:     document.getElementById('set-backup_auto_enable')?.checked ? '1' : '0',
        backup_schedule_time:   document.getElementById('set-backup_schedule_time')?.value || '',
        backup_schedule_days:   Array.from(document.querySelectorAll('input[name="backup_day"]:checked')).map(cb => cb.value).join(','),
        backup_cron_secret:     document.getElementById('set-backup_cron_secret')?.value || '',
      }
    };

    const res = await Api.post('settings?action=save', data);
    if (!res?.success) {
      Toast.error(res?.message || 'Gagal menyimpan');
      return;
    }
    alertEl.textContent = '✓ Konfigurasi berhasil disimpan';
    alertEl.style.display = 'block';
    Toast.success('Settings disimpan');
    setTimeout(() => alertEl.style.display = 'none', 3000);
  }

  function copyWebhookUrl() {
    const inp = document.getElementById('webhook-url-inp');
    inp.select();
    navigator.clipboard.writeText(inp.value);
    Toast.success('URL disalin!');
  }

  function toggleSecret(id) {
    const inp = document.getElementById(id);
    inp.type = inp.type === 'password' ? 'text' : 'password';
  }

  async function downloadBackup() {
    window.location.href = `${window.APP_PATH}/api/backup?action=export`;
  }

  async function restoreBackup() {
    const fileInp = document.getElementById('restore-file');
    if (!fileInp.files.length) {
      Toast.error('Pilih file backup (.sql) terlebih dahulu');
      return;
    }

    const result = await Swal.fire({
      title: 'Konfirmasi Restore?',
      text: 'PERHATIAN: Data saat ini akan DIHAPUS dan digantikan oleh data dari file backup!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Lakukan Restore!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    const formData = new FormData();
    formData.append('backup_file', fileInp.files[0]);

    // CSRF is handled by Api.post automatically if we pass FormData
    const res = await Api.post('backup?action=import', formData);
    if (res?.success) {
      await Swal.fire('Berhasil', 'Database berhasil direstore. Aplikasi akan direfresh.', 'success');
      window.location.reload();
    } else {
      Toast.error(res?.message || 'Gagal restore');
    }
  }

  return { render, save, copyWebhookUrl, toggleSecret, downloadBackup, restoreBackup };
})();


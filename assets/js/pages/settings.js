// ============================================================
// pages/settings.js - App Settings Page (Interactive Schedule)
// ============================================================
import { Api, Toast } from "../api.js";

export const PageSettings = (() => {
  let settings = {};
  let currentTab = 'general';
  let selectedDays = [];

  async function render() {
    const view = document.getElementById('page-view');
    const res = await Api.get('settings');
    if (!res?.success) return;

    settings = res.data.reduce((acc, s) => {
      acc[s.key] = s;
      return acc;
    }, {});

    // Parse existing days from CSV string
    const daysCsv = settings.backup_schedule_days?.value || 'Mon,Tue,Wed,Thu,Fri,Sat,Sun';
    selectedDays = daysCsv.split(',').map(d => d.trim()).filter(d => d);

    view.innerHTML = `
      <div class="fade-in-up max-w-6xl mx-auto pb-32">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h1 class="text-3xl font-black text-slate-900 tracking-tight">System Settings</h1>
            <p class="text-slate-500 text-sm mt-1">Configure global application behavior and integrations.</p>
          </div>
          <div class="flex gap-3">
             <button class="btn bg-white border-slate-200 text-slate-600 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all" onclick="location.reload()">
               Discard Changes
             </button>
             <button class="btn bg-slate-900 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all" onclick="PageSettings.save()">
               Save Settings
             </button>
          </div>
        </div>

        <div class="flex items-center gap-2 mb-8 bg-slate-100/50 p-1.5 rounded-2xl w-fit">
          <button onclick="PageSettings.switchTab('general')" id="tab-btn-general" class="tab-btn-prof ${currentTab === 'general' ? 'active' : ''}">
            <i data-lucide="settings-2" class="w-4 h-4"></i> General
          </button>
          <button onclick="PageSettings.switchTab('backups')" id="tab-btn-backups" class="tab-btn-prof ${currentTab === 'backups' ? 'active' : ''}">
            <i data-lucide="cloud-upload" class="w-4 h-4"></i> Backups & Cloud
          </button>
          <button onclick="PageSettings.switchTab('smtp')" id="tab-btn-smtp" class="tab-btn-prof ${currentTab === 'smtp' ? 'active' : ''}">
            <i data-lucide="mail" class="w-4 h-4"></i> Mail Server
          </button>
          <button onclick="PageSettings.switchTab('security')" id="tab-btn-security" class="tab-btn-prof ${currentTab === 'security' ? 'active' : ''}">
            <i data-lucide="shield-check" class="w-4 h-4"></i> Security
          </button>
        </div>

        <div id="settings-tab-content" class="fade-in">
          ${renderActiveTab()}
        </div>

        <div class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4 pointer-events-none">
          <div class="bg-white/80 backdrop-blur-xl border border-slate-200/50 p-4 rounded-[28px] shadow-2xl flex justify-between items-center pointer-events-auto">
            <div class="flex items-center gap-4 pl-4">
              <div class="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                <i data-lucide="info" class="w-5 h-5"></i>
              </div>
              <div>
                <p class="text-xs font-black text-slate-900 leading-none">Unsaved Changes</p>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">System wide configuration</p>
              </div>
            </div>
            <button class="btn bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.1em] shadow-xl shadow-indigo-200 transition-all" onclick="PageSettings.save()">
              Deploy Settings
            </button>
          </div>
        </div>
      </div>

      <style>
        .tab-btn-prof { display: flex; align-items: center; gap: 10px; padding: 10px 24px; border-radius: 14px; font-size: 13px; font-weight: 700; color: #64748b; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .tab-btn-prof:hover { color: #1e293b; background: white; }
        .tab-btn-prof.active { color: #4f46e5; background: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05); }
        .input-prof { width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px 16px; font-size: 14px; font-weight: 500; color: #1e293b; transition: all 0.2s; outline: none; }
        .input-prof:focus { border-color: #4f46e5; background: white; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.05); }
        .form-label-prof { display: block; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
        .form-group { margin-bottom: 24px; }
        
        .day-pill {
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 800;
          color: #64748b;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          user-select: none;
        }
        .day-pill:hover { border-color: #cbd5e1; color: #1e293b; }
        .day-pill.active {
          background: #4f46e5;
          color: white;
          border-color: #4338ca;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
          transform: scale(1.05);
        }
      </style>
    `;

    lucide.createIcons();
  }

  function renderActiveTab() {
    const canEdit = true;
    const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    switch (currentTab) {
      case 'general': return `
        <div class="card-enterprise p-10 bg-white">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
            <div class="form-group"><label class="form-label-prof">Application Name</label><input type="text" id="set-app_name" class="input-prof" value="${settings.app_name?.value || ''}" ${canEdit ? '' : 'disabled'}></div>
            <div class="form-group"><label class="form-label-prof">Notification Email</label><input type="email" id="set-notify_email" class="input-prof" value="${settings.notify_email?.value || ''}" placeholder="admin@example.com" ${canEdit ? '' : 'disabled'}></div>
            <div class="form-group"><label class="form-label-prof">Git Base Directory</label><input type="text" id="set-git_base_dir" class="input-prof font-mono text-sm" value="${settings.git_base_dir?.value || ''}" ${canEdit ? '' : 'disabled'}></div>
            <div class="form-group"><label class="form-label-prof">Backup Storage Path</label><input type="text" id="set-backup_base_dir" class="input-prof font-mono text-sm" value="${settings.backup_base_dir?.value || ''}" ${canEdit ? '' : 'disabled'}></div>
          </div>

          
          <div class="mt-6 flex items-center justify-between p-6 bg-slate-50 rounded-2xl">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-indigo-600"><i data-lucide="zap" class="w-5 h-5"></i></div>
              <div><p class="text-xs font-black text-slate-900">Auto-Deploy Engine</p><p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Deploy immediately on webhook arrival</p></div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="set-auto_deploy" class="sr-only peer" ${settings.auto_deploy?.value === '1' ? 'checked' : ''} ${canEdit ? '' : 'disabled'}>
              <div class="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div class="mt-8">
            <label class="form-label-prof">Global Webhook Endpoint</label>
            <div class="flex gap-2">
              <input type="text" readonly class="input-prof font-mono text-[11px] bg-slate-100 border-dashed" value="${window.location.origin}${window.APP_PATH}/api/webhook">
              <button class="btn btn-ghost border border-slate-200 px-4 rounded-xl" onclick="copyToClipboard('${window.location.origin}${window.APP_PATH}/api/webhook')"><i data-lucide="copy" class="w-4 h-4"></i></button>
            </div>
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Use this URL in your GitHub/GitLab repository settings</p>
          </div>
        </div>`;

      case 'backups': return `
        <div class="card-enterprise p-10 bg-white">
          <div class="flex items-center justify-between p-6 bg-slate-50 rounded-2xl mb-8">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100"><i data-lucide="calendar-clock" class="w-6 h-6"></i></div>
              <div><p class="text-sm font-black text-slate-900">Automatic Backup Schedule</p><p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Automated Database & Project Dumps</p></div>
            </div>
            <div class="flex items-center gap-3">
              <div class="flex flex-col items-end mr-4">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Reports</span>
                <span class="text-[9px] font-bold ${settings.backup_notify_enable?.value === '1' ? 'text-emerald-500' : 'text-slate-300'} uppercase">${settings.backup_notify_enable?.value === '1' ? 'On' : 'Off'}</span>
              </div>
              <label class="relative inline-flex items-center cursor-pointer mr-6">
                <input type="checkbox" id="set-backup_notify_enable" class="sr-only peer" ${settings.backup_notify_enable?.value === '1' ? 'checked' : ''} ${canEdit ? '' : 'disabled'}>
                <div class="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>

              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">${settings.backup_auto_enable?.value === '1' ? 'Enabled' : 'Disabled'}</span>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" id="set-backup_auto_enable" class="sr-only peer" ${settings.backup_auto_enable?.value === '1' ? 'checked' : ''} ${canEdit ? '' : 'disabled'}>
                <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-x-12 mb-10">
            <div class="form-group md:col-span-1">
              <label class="form-label-prof">Execution Time</label>
              <input type="time" id="set-backup_schedule_time" class="input-prof font-black text-lg" value="${settings.backup_schedule_time?.value || '02:00'}" ${canEdit ? '' : 'disabled'}>
              <p class="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">Server local time</p>
            </div>
            <div class="form-group md:col-span-2">
              <label class="form-label-prof">Repeat Every</label>
              <div class="flex flex-wrap gap-2">
                ${allDays.map(day => `
                  <div class="day-pill ${selectedDays.includes(day) ? 'active' : ''}" onclick="PageSettings.toggleDay('${day}', this)">${day}</div>
                `).join('')}
              </div>
              <p class="text-[10px] text-slate-400 font-bold mt-3 uppercase tracking-widest">Select days for automated tasks</p>
            </div>
          </div>

          <div class="mb-10 bg-slate-900 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-slate-200">
            <div class="absolute top-0 right-0 p-4 opacity-10"><i data-lucide="terminal" class="w-24 h-24 text-white"></i></div>
            <div class="relative z-10">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white"><i data-lucide="command" class="w-4 h-4"></i></div>
                <h4 class="text-xs font-black text-white uppercase tracking-[0.2em]">Cron Command (Linux/cPanel)</h4>
              </div>
              <p class="text-slate-400 text-[10px] font-bold mb-4 uppercase tracking-widest leading-relaxed">Add this command to your system crontab to trigger scheduled backups:</p>
              <div class="flex gap-3">
                <input type="text" readonly class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-emerald-400 font-mono text-[11px] outline-none" value="curl -s &quot;${window.location.origin}${window.APP_PATH}/api/cron.php?secret=${settings.backup_cron_secret?.value || 'YOUR_TOKEN'}&quot; > /dev/null 2>&1">
                <button class="btn bg-white/10 hover:bg-white/20 text-white border-white/10 px-4 rounded-xl transition-all" onclick="copyToClipboard('curl -s &quot;${window.location.origin}${window.APP_PATH}/api/cron.php?secret=${settings.backup_cron_secret?.value || 'YOUR_TOKEN'}&quot; > /dev/null 2>&1')"><i data-lucide="copy" class="w-4 h-4"></i></button>
              </div>

              <p class="mt-4 text-[9px] text-slate-500 font-bold italic">* Frequency should match your execution time above (e.g. Daily at 02:00).</p>
            </div>
          </div>

          <hr class="border-slate-100 mb-10">


          <div class="flex items-center justify-between p-6 bg-slate-50 rounded-2xl mb-8">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-indigo-600"><i data-lucide="cloud" class="w-6 h-6"></i></div>
              <div><p class="text-sm font-black text-slate-900">Cloudflare R2 Integration</p><p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">S3-Compatible Object Storage</p></div>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">${settings.r2_enable?.value === '1' ? 'Active' : 'Disabled'}</span>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" id="set-r2_enable" class="sr-only peer" ${settings.r2_enable?.value === '1' ? 'checked' : ''} ${canEdit ? '' : 'disabled'}>
                <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12">
            <div class="form-group"><label class="form-label-prof">R2 Account ID</label><input type="text" id="set-r2_account_id" class="input-prof font-mono text-sm" value="${settings.r2_account_id?.value || ''}" placeholder="Cloudflare Account ID" ${canEdit ? '' : 'disabled'}></div>
            <div class="form-group"><label class="form-label-prof">R2 Bucket Name</label><input type="text" id="set-r2_bucket_name" class="input-prof font-mono text-sm" value="${settings.r2_bucket_name?.value || ''}" placeholder="Bucket Name" ${canEdit ? '' : 'disabled'}></div>
            <div class="form-group"><label class="form-label-prof">Access Key ID</label><input type="text" id="set-r2_access_key" class="input-prof font-mono text-sm" value="${settings.r2_access_key?.value || ''}" placeholder="Access Key" ${canEdit ? '' : 'disabled'}></div>
            <div class="form-group"><label class="form-label-prof">Secret Access Key</label><input type="password" id="set-r2_secret_key" class="input-prof font-mono" placeholder="Maintain current key" ${canEdit ? '' : 'disabled'}></div>
            <div class="form-group"><label class="form-label-prof">Auto-Retention (Days)</label><input type="number" id="set-r2_retention_days" class="input-prof" value="${settings.r2_retention_days?.value || '30'}" placeholder="30" ${canEdit ? '' : 'disabled'}></div>
          </div>
        </div>`;

      case 'smtp': return `
        <div class="card-enterprise p-10 bg-white">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12">
            <div class="form-group"><label class="form-label-prof">SMTP Host</label><input type="text" id="set-smtp_host" class="input-prof" value="${settings.smtp_host?.value || ''}" ${canEdit ? '' : 'disabled'}></div>
            <div class="form-group"><label class="form-label-prof">SMTP Port</label><input type="text" id="set-smtp_port" class="input-prof" value="${settings.smtp_port?.value || ''}" ${canEdit ? '' : 'disabled'}></div>
            <div class="form-group"><label class="form-label-prof">SMTP Username</label><input type="text" id="set-smtp_user" class="input-prof" value="${settings.smtp_user?.value || ''}" ${canEdit ? '' : 'disabled'}></div>
            <div class="form-group"><label class="form-label-prof">SMTP Password</label><input type="password" id="set-smtp_pass" class="input-prof" placeholder="Maintain current key" ${canEdit ? '' : 'disabled'}></div>
          </div>
        </div>`;

      case 'security': return `
        <div class="card-enterprise p-10 bg-white">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12">
            <div class="form-group"><label class="form-label-prof">Default Webhook Secret</label><div class="flex gap-2"><input type="password" id="set-webhook_secret_default" class="input-prof font-mono" placeholder="Maintain current key" ${canEdit ? '' : 'disabled'}><button class="btn btn-ghost" type="button" onclick="PageSettings.toggleSecret('set-webhook_secret_default')">👁</button></div></div>
            <div class="form-group"><label class="form-label-prof">Backup Cron Token</label><div class="flex gap-2"><input type="password" id="set-backup_cron_secret" class="input-prof font-mono" value="${settings.backup_cron_secret?.value || ''}" ${canEdit ? '' : 'disabled'}><button class="btn btn-ghost" type="button" onclick="PageSettings.toggleSecret('set-backup_cron_secret')">👁</button></div></div>
          </div>

          <div class="mt-10 pt-10 border-t border-slate-100">
            <h3 class="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Database & System Maintenance</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="p-6 border border-slate-100 rounded-2xl hover:border-indigo-100 transition-all group">
                <div class="flex items-center gap-4 mb-4">
                  <div class="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all"><i data-lucide="refresh-cw" class="w-5 h-5"></i></div>
                  <div><p class="text-xs font-black text-slate-900">System Backup</p><p class="text-[10px] text-slate-400 font-bold">Trigger full backup cycle now</p></div>
                </div>
                <button onclick="PageSettings.runManualBackup()" class="btn w-full bg-slate-900 text-white font-bold py-2 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-slate-100">Run Backup Now</button>
              </div>

              <div class="p-6 border border-slate-100 rounded-2xl hover:border-emerald-100 transition-all group">
                <div class="flex items-center gap-4 mb-4">
                  <div class="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all"><i data-lucide="upload-cloud" class="w-5 h-5"></i></div>
                  <div><p class="text-xs font-black text-slate-900">System Restore</p><p class="text-[10px] text-slate-400 font-bold">Restore database from SQL file</p></div>
                </div>
                <button onclick="PageSettings.triggerRestore()" class="btn w-full bg-emerald-600 text-white font-bold py-2 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-50">Restore Database</button>
              </div>

              <div class="p-6 border border-slate-100 rounded-2xl hover:border-slate-200 transition-all group">
                <div class="flex items-center gap-4 mb-4">
                  <div class="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-all"><i data-lucide="trash-2" class="w-5 h-5"></i></div>
                  <div><p class="text-xs font-black text-slate-900">Purge Deploy Logs</p><p class="text-[10px] text-slate-400 font-bold">Clear historical deployment history</p></div>
                </div>
                <button onclick="PageSettings.purgeLogs()" class="btn w-full bg-slate-100 text-slate-600 font-bold py-2 rounded-xl text-[10px] uppercase tracking-widest transition-all">Execute Purge</button>
              </div>

              <div class="p-6 border border-slate-100 rounded-2xl hover:border-orange-100 transition-all group">
                <div class="flex items-center gap-4 mb-4">
                  <div class="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all"><i data-lucide="archive" class="w-5 h-5"></i></div>
                  <div><p class="text-xs font-black text-slate-900">Local Cleanup</p><p class="text-[10px] text-slate-400 font-bold">Remove old local .sql files</p></div>
                </div>
                <button onclick="PageSettings.cleanupLocalBackups()" class="btn w-full bg-slate-100 text-slate-600 font-bold py-2 rounded-xl text-[10px] uppercase tracking-widest transition-all">Clear Local Data</button>
              </div>
            </div>
          </div>
          <input type="file" id="restore-file-input" class="hidden" accept=".sql" onchange="PageSettings.handleRestoreFile(this)">
        </div>`;
      
      default: return '';
    }
  }

  function switchTab(tabId) {
    currentTab = tabId;
    document.querySelectorAll('.tab-btn-prof').forEach(btn => {
      btn.classList.remove('active');
      if (btn.id === `tab-btn-${tabId}`) btn.classList.add('active');
    });

    const contentArea = document.getElementById('settings-tab-content');
    if (contentArea) {
      contentArea.classList.remove('fade-in');
      void contentArea.offsetWidth;
      contentArea.innerHTML = renderActiveTab();
      contentArea.classList.add('fade-in');
      lucide.createIcons();
    }
  }

  function toggleDay(day, el) {
    if (selectedDays.includes(day)) {
      selectedDays = selectedDays.filter(d => d !== day);
      el.classList.remove('active');
    } else {
      selectedDays.push(day);
      el.classList.add('active');
    }
  }

  async function save() {
    const data = {
      settings: {
        app_name: document.getElementById('set-app_name')?.value || settings.app_name?.value,
        git_base_dir: document.getElementById('set-git_base_dir')?.value || settings.git_base_dir?.value,
        backup_base_dir: document.getElementById('set-backup_base_dir')?.value || settings.backup_base_dir?.value,
        notify_email: document.getElementById('set-notify_email')?.value || settings.notify_email?.value,
        auto_deploy: document.getElementById('set-auto_deploy')?.checked ? '1' : '0',
        backup_auto_enable: document.getElementById('set-backup_auto_enable')?.checked ? '1' : '0',
        backup_notify_enable: document.getElementById('set-backup_notify_enable')?.checked ? '1' : '0',


        backup_schedule_time: document.getElementById('set-backup_schedule_time')?.value || settings.backup_schedule_time?.value,
        backup_schedule_days: selectedDays.join(','), // Collect from interactive state
        
        r2_enable: document.getElementById('set-r2_enable')?.checked ? '1' : '0',
        r2_account_id: document.getElementById('set-r2_account_id')?.value || settings.r2_account_id?.value,
        r2_bucket_name: document.getElementById('set-r2_bucket_name')?.value || settings.r2_bucket_name?.value,
        r2_access_key: document.getElementById('set-r2_access_key')?.value || settings.r2_access_key?.value,
        r2_secret_key: document.getElementById('set-r2_secret_key')?.value || '',
        r2_retention_days: document.getElementById('set-r2_retention_days')?.value || settings.r2_retention_days?.value,
        smtp_host: document.getElementById('set-smtp_host')?.value || settings.smtp_host?.value,
        smtp_port: document.getElementById('set-smtp_port')?.value || settings.smtp_port?.value,
        smtp_user: document.getElementById('set-smtp_user')?.value || settings.smtp_user?.value,
        smtp_pass: document.getElementById('set-smtp_pass')?.value || '',
        webhook_secret_default: document.getElementById('set-webhook_secret_default')?.value || '',
        backup_cron_secret: document.getElementById('set-backup_cron_secret')?.value || settings.backup_cron_secret?.value,
      }
    };

    Swal.fire({ title: 'Saving Settings...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const res = await Api.post('settings?action=save', data);
    if (res?.success) {
      Swal.fire('Saved!', 'System settings updated successfully.', 'success');
      render();
    } else {
      Swal.fire('Error', res?.message || 'Failed to save settings', 'error');
    }
  }

  function toggleSecret(id) {
    const input = document.getElementById(id);
    if (input) input.type = input.type === 'password' ? 'text' : 'password';
  }

  async function runManualBackup() {
    const res = await Swal.fire({ title: 'Jalankan Backup Sistem?', text: 'Sistem akan mencadangkan seluruh database project dan sistem sekarang juga.', icon: 'question', showCancelButton: true, confirmButtonText: 'Ya, Jalankan', confirmButtonColor: '#4f46e5' });
    if (!res.isConfirmed) return;
    Swal.fire({ title: 'Processing Backup...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const apiRes = await Api.get('backup', { action: 'run' });
    if (apiRes?.success) Swal.fire('Berhasil', 'Backup sistem selesai dilakukan.', 'success');
    else Swal.fire('Gagal', apiRes?.message || 'Terjadi kesalahan saat backup.', 'error');
  }

  function triggerRestore() { document.getElementById('restore-file-input').click(); }

  async function handleRestoreFile(input) {
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const res = await Swal.fire({ title: 'Pulihkan Database?', text: `Database sistem akan ditimpa dengan data dari file "${file.name}". Tindakan ini tidak dapat dibatalkan!`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya, Restore Sekarang', confirmButtonColor: '#10b981' });
    if (!res.isConfirmed) { input.value = ''; return; }
    Swal.fire({ title: 'Restoring Database...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const formData = new FormData();
    formData.append('sql_file', file);
    const apiRes = await fetch(`${window.APP_PATH}/api/backup?action=restore&csrf_token=${Api.getCsrf()}`, { method: 'POST', body: formData }).then(r => r.json());
    if (apiRes?.success) Swal.fire('Restore Berhasil', 'Database sistem telah diperbarui. Halaman akan dimuat ulang.', 'success').then(() => location.reload());
    else Swal.fire('Restore Gagal', apiRes?.message || 'Gagal memproses file SQL.', 'error');
    input.value = '';
  }

  async function purgeLogs() {
    const res = await Swal.fire({ title: 'Purge Logs?', text: 'Semua riwayat deployment akan dihapus permanen.', icon: 'warning', showCancelButton: true });
    if (!res.isConfirmed) return;
    const apiRes = await Api.post('monitoring', { action: 'purge_logs' });
    if (apiRes?.success) Toast.success('Logs purged.');
  }

  async function cleanupLocalBackups() {
    const res = await Swal.fire({ title: 'Clean Local Backups?', text: 'File backup lokal (.sql) akan dibersihkan.', icon: 'warning', showCancelButton: true });
    if (!res.isConfirmed) return;
    const apiRes = await Api.post('backup', { action: 'cleanup' });
    if (apiRes?.success) Toast.success('Local storage cleaned.');
  }

  async function testR2() {
    Swal.fire({ title: 'Testing R2 Connection...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const res = await Api.get('settings', { action: 'test_r2' });
    if (res?.success) Swal.fire('Success', 'Cloudflare R2 connection established!', 'success');
    else Swal.fire('Failed', res?.message || 'Connection error', 'error');
  }

  return { render, switchTab, toggleDay, save, toggleSecret, runManualBackup, triggerRestore, handleRestoreFile, purgeLogs, cleanupLocalBackups, testR2 };
})();

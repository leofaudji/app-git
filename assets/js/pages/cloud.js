// ============================================================
// pages/cloud.js - Premium Cloud Storage Explorer (v3 with Chart)
// ============================================================
import { Api, Toast } from "../api.js";

export const PageCloud = (() => {
  let files = [];
  let searchQuery = '';
  let storageChart = null;

  async function render() {
    const view = document.getElementById('page-view');
    
    view.innerHTML = `
      <div class="fade-in-up max-w-6xl mx-auto pb-32">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h1 class="text-3xl font-black text-slate-900 tracking-tight">Cloud Storage</h1>
            <p class="text-slate-500 text-sm mt-1">Manage database backups stored in Cloudflare R2.</p>
          </div>
          <button class="btn bg-white border-slate-200 text-slate-600 hover:bg-slate-50 px-6 py-2.5 rounded-xl transition-all flex items-center gap-3 font-bold text-sm shadow-sm" onclick="PageCloud.loadFiles()">
            <i data-lucide="refresh-cw" class="w-4 h-4"></i> Sync Storage
          </button>
        </div>

        <!-- Dashboard Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <!-- Left Column: Stats -->
          <div class="lg:col-span-1 flex flex-col gap-6">
            <div class="stat-card-glass border-l-4 border-indigo-500 p-6">
              <div class="flex flex-col gap-1">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Stored Backups</span>
                <div class="flex items-end gap-2">
                  <h2 class="text-4xl font-black text-slate-900 tracking-tight" id="stat-count">0</h2>
                  <span class="text-xs font-bold text-slate-400 mb-1.5 uppercase">Files</span>
                </div>
              </div>
              <div class="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <i data-lucide="layers" class="w-6 h-6"></i>
              </div>
            </div>
            
            <div class="stat-card-glass border-l-4 border-orange-500 p-6">
              <div class="flex flex-col gap-1">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Current Capacity</span>
                <div class="flex items-end gap-2">
                  <h2 class="text-4xl font-black text-slate-900 tracking-tight" id="stat-size">0</h2>
                  <span class="text-xs font-bold text-slate-400 mb-1.5 uppercase" id="stat-size-unit">B</span>
                </div>
              </div>
              <div class="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                <i data-lucide="hard-drive" class="w-6 h-6"></i>
              </div>
            </div>

            <div class="stat-card-glass border-l-4 border-emerald-500 p-6">
              <div class="flex flex-col gap-1">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Retention Policy</span>
                <h2 class="text-sm font-bold text-slate-800 mt-2 leading-tight" id="stat-retention">Auto-Purge (30 Days)</h2>
                <p class="text-[10px] text-slate-400 font-medium">Automatic cost optimization</p>
              </div>
              <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <i data-lucide="shield-check" class="w-6 h-6"></i>
              </div>
            </div>
          </div>

          <!-- Right Column: Growth Chart -->
          <div class="lg:col-span-2 card-enterprise p-8 bg-white relative">
            <div class="flex justify-between items-center mb-6">
              <div>
                <h3 class="text-lg font-black text-slate-900 tracking-tight">Storage Trend</h3>
                <p class="text-xs text-slate-400 font-medium uppercase tracking-widest">Usage growth over time</p>
              </div>
              <div class="p-2 bg-slate-50 rounded-lg"><i data-lucide="trending-up" class="w-4 h-4 text-indigo-500"></i></div>
            </div>
            <div class="h-[280px] w-full">
              <canvas id="storageChart"></canvas>
            </div>
          </div>
        </div>

        <!-- Search & Filter Bar -->
        <div class="flex flex-col md:flex-row gap-4 mb-8">
          <div class="relative flex-grow">
            <i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300"></i>
            <input type="text" class="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all shadow-sm" placeholder="Search backup filename..." oninput="PageCloud.search(this.value)">
          </div>
        </div>

        <!-- Clean Modern Table -->
        <div class="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead>
                <tr class="bg-slate-50/50">
                  <th class="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Backup Asset</th>
                  <th class="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Capacity</th>
                  <th class="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Timestamp</th>
                  <th class="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Controls</th>
                </tr>
              </thead>
              <tbody id="cloud-files-body" class="divide-y divide-slate-50">
                <tr><td colspan="4" class="px-8 py-32 text-center text-slate-400 italic">Syncing with Cloudflare R2...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>
        .stat-card-glass {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .stat-card-glass:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(0,0,0,0.04); }
      </style>
    `;

    lucide.createIcons();
    loadFiles();
    loadChart();
  }

  async function loadFiles() {
    const tbody = document.getElementById('cloud-files-body');
    if (!tbody) return;

    try {
      const res = await Api.get('settings', { action: 'list_r2_backups' });
      const settings = await Api.get('settings', { action: 'get' });
      
      if (res?.success) {
        files = res.data;
        updateStats(files, settings.data);
        renderTable(files);
      } else {
        tbody.innerHTML = `<tr><td colspan="4" class="px-8 py-32 text-center text-red-500 font-bold">${res?.message || 'Error connecting to R2.'}</td></tr>`;
      }
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="4" class="px-8 py-32 text-center text-red-500">API connection lost.</td></tr>`;
    }
  }

  async function loadChart() {
    try {
      const res = await Api.get('settings', { action: 'get_storage_stats' });
      if (!res?.success || res.data.length === 0) return;

      const ctx = document.getElementById('storageChart').getContext('2d');
      if (storageChart) storageChart.destroy();

      const labels = res.data.map(d => d.date);
      const values = res.data.map(d => d.size / 1048576); // Convert to MB

      storageChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Usage (MB)',
            data: values,
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            borderWidth: 3,
            pointRadius: 4,
            pointBackgroundColor: '#4f46e5',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f1f5f9' }, border: { display: false } },
            x: { grid: { display: false }, border: { display: false } }
          }
        }
      });
    } catch (err) { console.error('Chart load failed', err); }
  }

  function renderTable(data) {
    const tbody = document.getElementById('cloud-files-body');
    if (!tbody) return;

    const filtered = searchQuery 
      ? data.filter(f => f.key.toLowerCase().includes(searchQuery.toLowerCase()))
      : data;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="px-8 py-32 text-center text-slate-400 font-medium">No backups found.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(file => `
      <tr class="group hover:bg-indigo-50/30 transition-all duration-300">
        <td class="px-8 py-6">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 bg-slate-100 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm">
              <i data-lucide="file-archive" class="w-5 h-5"></i>
            </div>
            <div><p class="text-sm font-bold text-slate-800 mb-1">${file.key}</p><p class="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Database Backup</p></div>
          </div>
        </td>
        <td class="px-8 py-6"><span class="text-sm font-black text-slate-700">${file.size_fmt}</span></td>
        <td class="px-8 py-6"><span class="text-xs font-bold text-slate-500">${new Date(file.last_modified).toLocaleString()}</span></td>
        <td class="px-8 py-6 text-right">
          <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
             <button class="btn bg-white border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm" onclick="PageCloud.downloadFile('${file.key}')">Download</button>
             <button class="btn bg-white border-slate-200 hover:bg-red-50 hover:text-red-600 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm" onclick="PageCloud.deleteFile('${file.key}')">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
    lucide.createIcons();
  }

  function search(query) { searchQuery = query; renderTable(files); }

  function updateStats(files, settingsArr) {
    const countEl = document.getElementById('stat-count');
    const sizeEl  = document.getElementById('stat-size');
    const unitEl  = document.getElementById('stat-size-unit');
    const retEl   = document.getElementById('stat-retention');
    
    if (!countEl) return;

    const retentionDays = settingsArr.find(s => s.key === 'r2_retention_days')?.value || '30';
    retEl.textContent = `Auto-Purge (${retentionDays} Days)`;

    if (files.length === 0) {
      countEl.textContent = '0';
      sizeEl.textContent  = '0';
      unitEl.textContent  = 'B';
      return;
    }

    const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
    const formatted = formatSize(totalBytes);
    const parts = formatted.split(' ');
    sizeEl.textContent = parts[0];
    unitEl.textContent = parts[1];
    countEl.textContent = files.length;
  }

  function formatSize(bytes) {
    if (bytes >= 1073741824) return round(bytes / 1073741824, 2) + ' GB';
    if (bytes >= 1048576) return round(bytes / 1048576, 1) + ' MB';
    if (bytes >= 1024) return round(bytes / 1024, 1) + ' KB';
    return bytes + ' B';
  }

  function round(num, dec) { return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec); }

  function downloadFile(key) {
    window.location.href = `${window.APP_PATH}/api/settings?action=download_r2_backup&key=${encodeURIComponent(key)}&csrf_token=${Api.getCsrf()}`;
    Toast.info('Downloading artifact...');
  }

  async function deleteFile(key) {
    const res = await Swal.fire({ title: 'Purge Cloud Asset?', text: `Permanently delete "${key}"?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#0f172a' });
    if (!res.isConfirmed) return;
    Swal.fire({ title: 'Purging...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const apiRes = await Api.post('settings?action=delete_r2_backup', { key });
    if (apiRes?.success) { Toast.success('Asset purged.'); loadFiles(); loadChart(); Swal.close(); }
    else Swal.fire('Error', apiRes?.message || 'Purge failed.', 'error');
  }

  return { render, loadFiles, deleteFile, search, downloadFile };
})();

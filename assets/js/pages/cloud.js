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
      <div class="fade-in-up max-w-7xl mx-auto pb-32">
        <!-- Header & Quick Actions -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div class="space-y-1">
            <div class="flex items-center gap-3 mb-1">
              <div class="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <i data-lucide="cloud" class="w-5 h-5 text-white"></i>
              </div>
              <h1 class="text-3xl font-black text-slate-900 tracking-tight">Cloud Explorer</h1>
            </div>
            <p class="text-slate-500 font-medium ml-1">Manage secure database snapshots and retention policies.</p>
          </div>
          <div class="flex items-center gap-3">
             <button class="btn bg-white border-slate-200 text-slate-600 hover:bg-slate-50 px-6 py-3 rounded-2xl transition-all flex items-center gap-3 font-bold text-sm shadow-sm border" onclick="PageCloud.loadFiles()">
              <i data-lucide="refresh-cw" class="w-4 h-4"></i> Sync Storage
            </button>
          </div>
        </div>

        <!-- Premium Stats Row -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <!-- Stat 1 -->
          <div class="stat-premium overflow-hidden group">
            <div class="p-6 relative z-10">
              <div class="flex justify-between items-start mb-4">
                <div class="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <i data-lucide="database" class="w-6 h-6"></i>
                </div>
                <div class="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-wider">Live</div>
              </div>
              <div>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Snapshots</p>
                <div class="flex items-baseline gap-2">
                  <h2 class="text-4xl font-black text-slate-900 tracking-tight" id="stat-count">0</h2>
                  <span class="text-xs font-bold text-slate-400 uppercase">Backups</span>
                </div>
              </div>
            </div>
            <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-50/50 rounded-full blur-3xl group-hover:bg-indigo-100 transition-colors"></div>
          </div>

          <!-- Stat 2 -->
          <div class="stat-premium overflow-hidden group">
            <div class="p-6 relative z-10">
              <div class="flex justify-between items-start mb-4">
                <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <i data-lucide="hard-drive" class="w-6 h-6"></i>
                </div>
                <div class="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider">Capacity</div>
              </div>
              <div>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Bucket Usage</p>
                <div class="flex items-baseline gap-1">
                  <h2 class="text-4xl font-black text-slate-900 tracking-tight" id="stat-size">0</h2>
                  <span class="text-sm font-black text-slate-900" id="stat-size-unit">B</span>
                </div>
              </div>
            </div>
            <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-50/50 rounded-full blur-3xl group-hover:bg-emerald-100 transition-colors"></div>
          </div>

          <!-- Stat 3 -->
          <div class="stat-premium overflow-hidden group">
            <div class="p-6 relative z-10">
              <div class="flex justify-between items-start mb-4">
                <div class="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <i data-lucide="shield-clock" class="w-6 h-6"></i>
                </div>
                <div class="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-wider">Policy</div>
              </div>
              <div>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Retention Active</p>
                <div class="flex items-baseline gap-2">
                  <h2 class="text-xl font-black text-slate-900 tracking-tight leading-none" id="stat-retention">Auto-Purge (30 Days)</h2>
                </div>
              </div>
            </div>
            <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-orange-50/50 rounded-full blur-3xl group-hover:bg-orange-100 transition-colors"></div>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          <!-- Storage Analytics Chart -->
          <div class="lg:col-span-12 card-premium p-8">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h3 class="text-xl font-black text-slate-900 tracking-tight">Storage Utilization Trend</h3>
                <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Daily analysis of backup footprint</p>
              </div>
              <div class="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                <div class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                <span class="text-[10px] font-black text-slate-600 uppercase tracking-widest">Real-time Telemetry</span>
              </div>
            </div>
            <div class="h-[320px] w-full">
              <canvas id="storageChart"></canvas>
            </div>
          </div>
        </div>

        <!-- Asset Explorer Toolbar -->
        <div class="flex flex-col md:flex-row justify-between items-end gap-4 mb-6">
          <div class="w-full md:w-96">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Filter Assets</label>
            <div class="relative group">
              <i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors"></i>
              <input type="text" 
                class="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm" 
                placeholder="Search snapshots by filename..." 
                oninput="PageCloud.search(this.value)">
            </div>
          </div>
          <div class="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">
            <i data-lucide="info" class="w-4 h-4"></i>
            <span>Showing encrypted artifacts</span>
          </div>
        </div>

        <!-- Asset Explorer Table -->
        <div class="card-premium overflow-hidden border-none shadow-xl shadow-slate-200/50">
          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead>
                <tr class="bg-slate-50/80 backdrop-blur-md">
                  <th class="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Asset Identity</th>
                  <th class="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Size</th>
                  <th class="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Creation Date</th>
                  <th class="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Actions</th>
                </tr>
              </thead>
              <tbody id="cloud-files-body" class="divide-y divide-slate-50">
                <tr>
                  <td colspan="4" class="px-8 py-32 text-center">
                    <div class="flex flex-col items-center gap-4">
                      <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center animate-bounce">
                        <i data-lucide="refresh-cw" class="w-8 h-8 text-slate-300"></i>
                      </div>
                      <p class="text-slate-400 font-bold text-sm tracking-wide">Synchronizing with Cloudflare R2...</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>
        .card-premium {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 32px;
          box-shadow: 0 4px 20px -5px rgba(0,0,0,0.03);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .stat-premium {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 32px;
          position: relative;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 20px -5px rgba(0,0,0,0.03);
        }
        .stat-premium:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px -10px rgba(79, 70, 229, 0.1);
          border-color: #e0e7ff;
        }
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

      // Create Gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, 320);
      gradient.addColorStop(0, 'rgba(79, 70, 229, 0.2)');
      gradient.addColorStop(1, 'rgba(79, 70, 229, 0.0)');

      storageChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Usage (MB)',
            data: values,
            borderColor: '#4f46e5',
            backgroundColor: gradient,
            borderWidth: 4,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: '#4f46e5',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 3,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { intersect: false, mode: 'index' },
          plugins: { 
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1e293b',
              titleFont: { size: 12, weight: 'bold' },
              bodyFont: { size: 12 },
              padding: 12,
              cornerRadius: 12,
              displayColors: false
            }
          },
          scales: {
            y: { 
              beginAtZero: true, 
              grid: { color: 'rgba(241, 245, 249, 0.5)', drawBorder: false }, 
              ticks: { font: { size: 10, weight: '600' }, color: '#94a3b8', callback: v => v + ' MB' }
            },
            x: { 
              grid: { display: false }, 
              ticks: { font: { size: 10, weight: '600' }, color: '#94a3b8' }
            }
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
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="px-8 py-32 text-center">
            <div class="flex flex-col items-center gap-3">
              <div class="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200">
                <i data-lucide="search-x" class="w-8 h-8"></i>
              </div>
              <p class="text-slate-400 font-bold text-sm">No backup assets match your search.</p>
            </div>
          </td>
        </tr>`;
      lucide.createIcons();
      return;
    }

    tbody.innerHTML = filtered.map(file => `
      <tr class="group hover:bg-slate-50/50 transition-all duration-300">
        <td class="px-8 py-6">
          <div class="flex items-center gap-5">
            <div class="w-12 h-12 bg-slate-100 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm group-hover:shadow-indigo-200 group-hover:shadow-lg group-hover:-rotate-6">
              <i data-lucide="package" class="w-6 h-6"></i>
            </div>
            <div>
              <p class="text-sm font-black text-slate-800 mb-0.5 group-hover:text-indigo-600 transition-colors">${file.key}</p>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase tracking-widest group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">SQL Dump</span>
                <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Encrypted</span>
              </div>
            </div>
          </div>
        </td>
        <td class="px-8 py-6">
          <div class="flex flex-col">
            <span class="text-sm font-black text-slate-700">${file.size_fmt}</span>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Binary Stream</span>
          </div>
        </td>
        <td class="px-8 py-6">
          <div class="flex flex-col">
            <span class="text-xs font-bold text-slate-600">${new Date(file.last_modified).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tight">${new Date(file.last_modified).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </td>
        <td class="px-8 py-6 text-right">
          <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all duration-300">
             <button class="w-10 h-10 bg-white border border-slate-200 text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 rounded-xl flex items-center justify-center shadow-sm transition-all" 
               title="Download Asset"
               onclick="PageCloud.downloadFile('${file.key}')">
               <i data-lucide="download" class="w-4 h-4"></i>
             </button>
             <button class="w-10 h-10 bg-white border border-slate-200 text-slate-600 hover:bg-red-600 hover:text-white hover:border-red-600 rounded-xl flex items-center justify-center shadow-sm transition-all" 
               title="Delete Asset"
               onclick="PageCloud.deleteFile('${file.key}')">
               <i data-lucide="trash-2" class="w-4 h-4"></i>
             </button>
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

import { Api, Toast } from "../api.js";

export const PageRedis = (() => {
  let statsChart = null;
  let activeTab = 'overview';

  async function render(params) {
    const view = document.getElementById('page-view');
    view.innerHTML = `
      <div class="redis-dashboard-container">
        <!-- Dashboard Header / Quick Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" id="redis-quick-stats">
          <div class="stat-card">
            <div class="stat-label">Redis Version</div>
            <div class="stat-value" id="stat-version">--</div>
            <div class="stat-icon text-orange-500"><i data-lucide="info"></i></div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Memory Usage</div>
            <div class="stat-value" id="stat-memory">--</div>
            <div class="stat-icon text-blue-500"><i data-lucide="activity"></i></div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Connected Clients</div>
            <div class="stat-value" id="stat-clients">--</div>
            <div class="stat-icon text-green-500"><i data-lucide="users"></i></div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Keys</div>
            <div class="stat-value" id="stat-keys">--</div>
            <div class="stat-icon text-indigo-500"><i data-lucide="key"></i></div>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex border-b border-gray-200 mb-6 bg-white rounded-t-lg overflow-hidden">
          <button class="px-6 py-3 text-sm font-medium border-b-2 transition-all tab-btn active" data-tab="overview">
            <i data-lucide="layout-dashboard" class="inline-block w-4 h-4 mr-2"></i>Overview
          </button>
          <button class="px-6 py-3 text-sm font-medium border-b-2 transition-all tab-btn" data-tab="browser">
            <i data-lucide="search" class="inline-block w-4 h-4 mr-2"></i>Key Browser
          </button>
          <button class="px-6 py-3 text-sm font-medium border-b-2 transition-all tab-btn" data-tab="terminal">
            <i data-lucide="terminal" class="inline-block w-4 h-4 mr-2"></i>Terminal
          </button>
        </div>

        <!-- Tab Content -->
        <div id="tab-content" class="bg-white rounded-b-lg border border-gray-200 border-t-0 p-6 min-h-[500px]">
          <!-- Content injected here -->
        </div>
      </div>
    `;

    // Add custom styles for the dashboard
    injectStyles();

    // Initial load
    initTabs();
    await loadStats();
    if (window.lucide) lucide.createIcons();
  }

  function initTabs() {
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active', 'border-orange-500', 'text-orange-500'));
        btn.classList.add('active', 'border-orange-500', 'text-orange-500');
        activeTab = btn.dataset.tab;
        switchTab(activeTab);
      });
    });
    // Set default active
    buttons[0].click();
  }

  function switchTab(tab) {
    const container = document.getElementById('tab-content');
    container.innerHTML = '<div class="flex items-center justify-center p-20"><div class="spinner"></div></div>';

    switch (tab) {
      case 'overview': renderOverview(); break;
      case 'browser': renderBrowser(); break;
      case 'terminal': renderTerminal(); break;
    }
  }

  async function loadStats() {
    const res = await Api.get('redis?action=stats');
    if (res?.success) {
      document.getElementById('stat-version').textContent = res.data.version;
      document.getElementById('stat-memory').textContent = res.data.memory_used;
      document.getElementById('stat-clients').textContent = res.data.clients;
      document.getElementById('stat-keys').textContent = res.data.keys;
    }
  }

  // --- TAB: OVERVIEW ---
  function renderOverview() {
    const container = document.getElementById('tab-content');
    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card">
          <h3 class="card-title"><i data-lucide="bar-chart-2" class="w-4 h-4"></i> Memory Usage History</h3>
          <div class="h-[300px]">
            <canvas id="memory-chart"></canvas>
          </div>
        </div>
        <div class="card">
          <h3 class="card-title"><i data-lucide="activity" class="w-4 h-4"></i> Performance Metrics</h3>
          <div class="space-y-4" id="detailed-stats">
             <!-- Detailed info will be loaded here -->
             <div class="flex justify-center p-10"><div class="spinner"></div></div>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    initOverviewCharts();
  }

  async function initOverviewCharts() {
    const ctx = document.getElementById('memory-chart').getContext('2d');
    
    // Mock data for initial animation, real dashboard would poll
    const labels = Array.from({length: 20}, (_, i) => '');
    const data = Array.from({length: 20}, () => Math.floor(Math.random() * 50) + 100);

    statsChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Memory (MB)',
          data: data,
          borderColor: '#f6821f',
          backgroundColor: 'rgba(246, 130, 31, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { display: false },
          y: { 
            beginAtZero: false,
            grid: { color: '#f3f4f6' }
          }
        }
      }
    });

    // Load detailed stats
    const res = await Api.get('redis?action=stats');
    if (res?.success) {
      const stats = res.data;
      const details = document.getElementById('detailed-stats');
      details.innerHTML = `
        <div class="p-4 rounded-lg bg-gray-50 border border-gray-100">
          <div class="flex justify-between items-center mb-2">
            <span class="text-xs text-gray-500 uppercase font-bold">Uptime</span>
            <span class="text-sm font-mono">${formatSeconds(stats.uptime)}</span>
          </div>
          <div class="flex justify-between items-center mb-2">
            <span class="text-xs text-gray-500 uppercase font-bold">Ops Per Sec</span>
            <span class="text-sm font-mono">${stats.ops_per_sec} ops/s</span>
          </div>
          <div class="flex justify-between items-center mb-2">
            <span class="text-xs text-gray-500 uppercase font-bold">Peak Memory</span>
            <span class="text-sm font-mono">${stats.memory_peak}</span>
          </div>
        </div>
        <div class="mt-6">
           <button class="btn btn-ghost btn-sm w-full" id="btn-flush-db">
             <i data-lucide="trash-2" class="w-4 h-4"></i> Flush Current Database
           </button>
        </div>
      `;
      if (window.lucide) lucide.createIcons();

      document.getElementById('btn-flush-db').addEventListener('click', async () => {
        const result = await Swal.fire({
          title: 'Flush Database?',
          text: 'Semua kunci dalam database ini akan dihapus permanen!',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Ya, Kosongkan!',
          cancelButtonText: 'Batal'
        });
        if (result.isConfirmed) {
          const fres = await Api.post('redis?action=flush', {});
          if (fres?.success) {
            Toast.success(fres.message);
            loadStats();
          } else {
            Toast.error(fres?.message || 'Gagal flush database');
          }
        }
      });
    }
  }

  // --- TAB: BROWSER ---
  async function renderBrowser() {
    const container = document.getElementById('tab-content');
    container.innerHTML = `
      <div class="flex flex-col h-full">
        <div class="flex gap-2 mb-4">
          <div class="relative flex-1">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <i data-lucide="search" class="w-4 h-4"></i>
            </span>
            <input type="text" id="redis-key-search" class="form-input pl-10" placeholder="Filter keys (e.g. user:*)">
          </div>
          <button class="btn btn-primary" id="btn-refresh-keys"><i data-lucide="refresh-cw" class="w-4 h-4"></i></button>
        </div>

        <div class="flex-1 overflow-hidden flex flex-col lg:flex-row gap-4">
          <!-- Key List -->
          <div class="lg:w-1/3 border border-gray-200 rounded-lg overflow-hidden flex flex-col bg-gray-50">
            <div class="p-2 border-b border-gray-200 bg-white text-xs font-bold text-gray-500 flex justify-between">
              <span>KEYS</span>
              <span id="key-count">0 keys</span>
            </div>
            <div class="flex-1 overflow-y-auto" id="key-list-items">
               <!-- Keys will be listed here -->
            </div>
          </div>

          <!-- Key Value Viewer -->
          <div class="lg:w-2/3 border border-gray-200 rounded-lg flex flex-col bg-white overflow-hidden" id="key-viewer">
             <div class="flex items-center justify-center h-full text-gray-400 flex-col gap-2">
                <i data-lucide="mouse-pointer-2" class="w-8 h-8 opacity-20"></i>
                <p>Pilih kunci untuk melihat detail</p>
             </div>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();

    document.getElementById('btn-refresh-keys').addEventListener('click', () => loadKeys());
    document.getElementById('redis-key-search').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') loadKeys();
    });

    loadKeys();
  }

  async function loadKeys() {
    const q = document.getElementById('redis-key-search').value.trim();
    const list = document.getElementById('key-list-items');
    list.innerHTML = '<div class="flex justify-center p-10"><div class="spinner"></div></div>';

    const res = await Api.get(`redis?action=keys&q=${encodeURIComponent(q || '*')}`);
    if (res?.success) {
      document.getElementById('key-count').textContent = `${res.data.total} keys`;
      list.innerHTML = '';
      if (res.data.keys.length === 0) {
        list.innerHTML = '<div class="p-4 text-center text-xs text-gray-400">Tidak ada kunci ditemukan</div>';
        return;
      }

      res.data.keys.forEach(k => {
        const item = document.createElement('div');
        item.className = 'px-3 py-2 border-b border-gray-200 cursor-pointer hover:bg-orange-50 transition-colors text-xs flex items-center justify-between group';
        item.innerHTML = `
          <div class="flex items-center gap-2 truncate">
            <span class="text-[10px] px-1 rounded bg-gray-200 text-gray-600 font-bold uppercase">${k.type}</span>
            <span class="truncate font-medium text-gray-700">${k.key}</span>
          </div>
          <i data-lucide="chevron-right" class="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100"></i>
        `;
        item.addEventListener('click', () => viewKey(k.key));
        list.appendChild(item);
      });
      if (window.lucide) lucide.createIcons();
    }
  }

  async function viewKey(key) {
    const viewer = document.getElementById('key-viewer');
    viewer.innerHTML = '<div class="flex items-center justify-center h-full"><div class="spinner"></div></div>';

    const res = await Api.get(`redis?action=view&key=${encodeURIComponent(key)}`);
    if (res?.success) {
      const data = res.data;
      viewer.innerHTML = `
        <div class="flex flex-col h-full">
          <div class="p-4 border-b border-gray-200 flex justify-between items-center">
            <div class="flex flex-col">
               <span class="text-[10px] text-gray-500 font-bold uppercase">${data.type}</span>
               <h4 class="font-bold text-gray-800 break-all">${data.key}</h4>
            </div>
            <div class="flex gap-2">
               <button class="btn btn-ghost btn-sm text-red-500 hover:bg-red-50" id="btn-del-key">
                 <i data-lucide="trash-2" class="w-4 h-4"></i>
               </button>
            </div>
          </div>
          <div class="p-4 bg-gray-50 border-b border-gray-200 flex gap-4 text-xs">
            <div><span class="text-gray-400">TTL:</span> <span class="font-mono">${data.ttl === -1 ? 'None' : data.ttl + 's'}</span></div>
          </div>
          <div class="flex-1 p-4 overflow-auto font-mono text-sm">
             <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto">${JSON.stringify(data.value, null, 2)}</pre>
          </div>
        </div>
      `;
      if (window.lucide) lucide.createIcons();

      document.getElementById('btn-del-key').addEventListener('click', async () => {
        const result = await Swal.fire({
          title: 'Hapus Kunci?',
          text: `Apakah Anda yakin ingin menghapus kunci "${key}"?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Hapus',
          cancelButtonText: 'Batal'
        });
        if (result.isConfirmed) {
          const dres = await Api.post('redis?action=delete', { key });
          if (dres?.success) {
            Toast.success(dres.message);
            loadKeys();
            viewer.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400 flex-col gap-2"><i data-lucide="mouse-pointer-2" class="w-8 h-8 opacity-20"></i><p>Pilih kunci untuk melihat detail</p></div>';
            if (window.lucide) lucide.createIcons();
          }
        }
      });
    }
  }

  // --- TAB: TERMINAL ---
  function renderTerminal() {
    const container = document.getElementById('tab-content');
    container.innerHTML = `
      <div class="flex flex-col h-full gap-4">
        <div class="flex-1 terminal h-[400px]" id="redis-terminal-output">
# Redis Dashboard Terminal
# Ketik perintah Redis dan tekan Enter
# Contoh: PING, SET test value, GET test, INFO
        </div>
        <div class="flex gap-2">
          <div class="flex-1 relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-orange-500 font-bold">
              >
            </span>
            <input type="text" id="redis-terminal-input" class="form-input pl-8 bg-gray-900 text-white border-gray-700 font-mono" placeholder="Enter Redis command...">
          </div>
          <button class="btn btn-primary" id="btn-terminal-send"><i data-lucide="send" class="w-4 h-4"></i></button>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();

    const input = document.getElementById('redis-terminal-input');
    const output = document.getElementById('redis-terminal-output');

    const sendCommand = async () => {
      const cmd = input.value.trim();
      if (!cmd) return;
      
      output.innerHTML += `\n<span class="text-orange-400">> ${cmd}</span>`;
      input.value = '';
      output.scrollTop = output.scrollHeight;

      const res = await Api.post('redis?action=execute', { command: cmd });
      if (res?.success) {
        const result = typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2);
        output.innerHTML += `\n<span class="text-green-300">${result}</span>`;
      } else {
        output.innerHTML += `\n<span class="text-red-400">Error: ${res?.message || 'Unknown error'}</span>`;
      }
      output.scrollTop = output.scrollHeight;
    };

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendCommand();
    });
    document.getElementById('btn-terminal-send').addEventListener('click', sendCommand);
    input.focus();
  }

  function formatSeconds(seconds) {
    const days = Math.floor(seconds / (3600 * 24));
    seconds -= days * 3600 * 24;
    const hrs = Math.floor(seconds / 3600);
    seconds -= hrs * 3600;
    const mnts = Math.floor(seconds / 60);
    seconds -= mnts * 60;
    return `${days}d ${hrs}h ${mnts}m ${seconds}s`;
  }

  function injectStyles() {
    if (document.getElementById('redis-dashboard-styles')) return;
    const style = document.createElement('style');
    style.id = 'redis-dashboard-styles';
    style.textContent = `
      .tab-btn { color: #6b7280; border-bottom-color: transparent; }
      .tab-btn:hover { color: #374151; background: #f9fafb; }
      .tab-btn.active { color: #f6821f; border-bottom-color: #f6821f; background: #fff; }
      
      .stat-card {
        padding: 1.25rem;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        position: relative;
        overflow: hidden;
        transition: transform 0.2s;
      }
      .stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
      .stat-label { font-size: 0.75rem; color: #6b7280; font-weight: 600; text-transform: uppercase; margin-bottom: 0.25rem; }
      .stat-value { font-size: 1.5rem; font-weight: 800; color: #111827; }
      .stat-icon { position: absolute; top: 1rem; right: 1rem; opacity: 0.2; }
      
      .terminal {
        background: #0f172a;
        color: #e2e8f0;
        font-family: 'JetBrains Mono', monospace;
        padding: 1rem;
        border-radius: 0.5rem;
        white-space: pre-wrap;
        overflow-y: auto;
      }
      
      .spinner {
        width: 24px;
        height: 24px;
        border: 2px solid #f3f4f6;
        border-top-color: #f6821f;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
  }

  return { render };
})();

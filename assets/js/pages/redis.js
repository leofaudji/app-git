import { Api, Toast } from "../api.js";

export const PageRedis = (() => {
  let statsChart = null;
  let activeTab = 'overview';
  let chartData = { labels: [], memory: [] };

  async function render(params) {
    const view = document.getElementById('page-view');
    view.innerHTML = `
      <div class="redis-prism-container">
        <!-- Dashboard Header -->
        <header class="prism-header">
          <div class="header-left">
            <div class="prism-logo">
              <i data-lucide="zap"></i>
            </div>
            <div>
              <h1 class="prism-title">Redis Insight Pro</h1>
              <p class="prism-subtitle">High Performance Cache Management</p>
            </div>
          </div>
          <div class="header-right">
             <div class="server-badge">
                <span class="status-pulse"></span>
                <span id="stat-host">localhost</span>
             </div>
             <button class="prism-btn-primary" id="btn-refresh-global">
                <i data-lucide="refresh-cw"></i>
                <span>Refresh</span>
             </button>
          </div>
        </header>

        <div class="prism-content-layout">
          <!-- Side Navigation -->
          <aside class="prism-sidebar">
            <nav class="prism-nav">
              <button class="prism-nav-btn active" data-tab="overview">
                <i data-lucide="pie-chart"></i>
                <span>Overview</span>
              </button>
              <button class="prism-nav-btn" data-tab="browser">
                <i data-lucide="layers"></i>
                <span>Browser</span>
              </button>
              <button class="prism-nav-btn" data-tab="terminal">
                <i data-lucide="terminal"></i>
                <span>Console</span>
              </button>
              <div class="nav-spacer"></div>
              <button class="prism-nav-btn text-danger" id="btn-flush-prism">
                <i data-lucide="trash-2"></i>
                <span>Flush DB</span>
              </button>
            </nav>

            <div class="prism-info-card">
               <div class="info-row">
                  <span class="label">Redis v</span>
                  <span class="value" id="stat-version">--</span>
               </div>
               <div class="info-row">
                  <span class="label">Uptime</span>
                  <span class="value" id="stat-uptime">--</span>
               </div>
            </div>
          </aside>

          <!-- Main Viewport -->
          <main class="prism-viewport" id="prism-tab-content">
            <!-- Content will be injected here -->
          </main>
        </div>
      </div>
    `;

    injectStyles();
    initNavigation();
    document.getElementById('btn-refresh-global').onclick = loadStatsLoop;
    await loadStatsLoop();
    if (window.lucide) lucide.createIcons();
  }

  function initNavigation() {
    const navs = document.querySelectorAll('.prism-nav-btn');
    navs.forEach(btn => {
      if (btn.id === 'btn-flush-prism') return;
      btn.onclick = () => {
        navs.forEach(n => n.classList.remove('active'));
        btn.classList.add('active');
        activeTab = btn.dataset.tab;
        switchTab(activeTab);
      };
    });
    document.getElementById('btn-flush-prism').onclick = handleFlush;
    switchTab('overview');
  }

  function switchTab(tab) {
    const container = document.getElementById('prism-tab-content');
    container.innerHTML = '<div class="prism-loader-wrap"><div class="prism-spinner"></div></div>';
    switch (tab) {
      case 'overview': renderOverview(); break;
      case 'browser': renderBrowser(); break;
      case 'terminal': renderTerminal(); break;
    }
  }

  async function loadStatsLoop() {
    const res = await Api.get('redis?action=stats');
    if (res?.success) {
      const s = res.data;
      document.getElementById('stat-version').textContent = s.version;
      document.getElementById('stat-uptime').textContent = formatSeconds(s.uptime);
      document.getElementById('stat-host').textContent = s.debug.host;
      
      // Update UI elements if they exist
      const memVal = document.getElementById('hero-mem-val');
      if (memVal) memVal.textContent = s.memory_used;
      const keyVal = document.getElementById('hero-key-val');
      if (keyVal) keyVal.textContent = s.keys;
      const clientVal = document.getElementById('hero-client-val');
      if (clientVal) clientVal.textContent = s.clients;
      const opsVal = document.getElementById('hero-ops-val');
      if (opsVal) opsVal.textContent = s.ops_per_sec;

      if (activeTab === 'overview' && statsChart) {
        updateChart(parseFloat(s.memory_used));
      }
    }
    if (window.location.hash === '#redis') {
      setTimeout(loadStatsLoop, 5000);
    }
  }

  // --- TAB: OVERVIEW ---
  function renderOverview() {
    const container = document.getElementById('prism-tab-content');
    container.innerHTML = `
      <div class="fade-in">
        <!-- Hero Stats -->
        <div class="prism-hero-grid">
           <div class="hero-card gradient-1">
              <div class="hero-info">
                 <span class="hero-label">Memory Usage</span>
                 <h2 class="hero-value" id="hero-mem-val">--</h2>
              </div>
              <i data-lucide="activity" class="hero-icon"></i>
           </div>
           <div class="hero-card gradient-2">
              <div class="hero-info">
                 <span class="hero-label">Total Keys</span>
                 <h2 class="hero-value" id="hero-key-val">--</h2>
              </div>
              <i data-lucide="key" class="hero-icon"></i>
           </div>
           <div class="hero-card gradient-3">
              <div class="hero-info">
                 <span class="hero-label">Active Clients</span>
                 <h2 class="hero-value" id="hero-client-val">--</h2>
              </div>
              <i data-lucide="users" class="hero-icon"></i>
           </div>
        </div>

        <div class="prism-main-grid mt-8">
           <div class="prism-card main-chart-card">
              <div class="card-header">
                 <h3 class="card-title">Memory Pulse</h3>
                 <span class="card-tag">Realtime</span>
              </div>
              <div class="chart-container h-[320px] mt-4">
                 <canvas id="prism-memory-chart"></canvas>
              </div>
           </div>
           <div class="prism-card">
              <div class="card-header">
                 <h3 class="card-title">Server Throughput</h3>
              </div>
              <div class="throughput-wrap mt-6">
                 <div class="ops-gauge">
                    <span class="ops-value" id="hero-ops-val">--</span>
                    <span class="ops-label">ops / sec</span>
                 </div>
                 <div class="mt-8 space-y-4">
                    <div class="progress-item">
                       <div class="flex justify-between text-[11px] font-bold mb-1">
                          <span class="text-slate-500">READ CAPACITY</span>
                          <span class="text-indigo-600">85%</span>
                       </div>
                       <div class="progress-bg"><div class="progress-fill bg-indigo-500" style="width: 85%"></div></div>
                    </div>
                    <div class="progress-item">
                       <div class="flex justify-between text-[11px] font-bold mb-1">
                          <span class="text-slate-500">WRITE CAPACITY</span>
                          <span class="text-emerald-500">42%</span>
                       </div>
                       <div class="progress-bg"><div class="progress-fill bg-emerald-500" style="width: 42%"></div></div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    `;
    initChart();
    if (window.lucide) lucide.createIcons();
  }

  function initChart() {
    const ctx = document.getElementById('prism-memory-chart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.2)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');

    statsChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [{
          data: chartData.memory,
          borderColor: '#6366f1',
          backgroundColor: gradient,
          borderWidth: 4,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: '#6366f1'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { display: false },
          y: { 
            grid: { color: '#f1f5f9', borderDash: [5, 5] },
            ticks: { color: '#94a3b8', font: { size: 10, weight: 'bold' } }
          }
        }
      }
    });
  }

  function updateChart(val) {
    const now = new Date().toLocaleTimeString();
    chartData.labels.push(now);
    chartData.memory.push(val);
    if (chartData.labels.length > 40) {
      chartData.labels.shift();
      chartData.memory.shift();
    }
    statsChart.update('none');
  }

  // --- TAB: BROWSER ---
  function renderBrowser() {
    const container = document.getElementById('prism-tab-content');
    container.innerHTML = `
      <div class="flex flex-col h-full fade-in">
        <div class="prism-search-bar mb-6">
           <i data-lucide="search"></i>
           <input type="text" id="prism-search-inp" placeholder="Search for keys (e.g. users:*)">
           <button class="prism-btn-search" id="btn-prism-search">Search</button>
        </div>

        <div class="prism-browser-layout">
           <div class="key-sidebar prism-card">
              <div class="sidebar-header">
                 <span>KEYS REGISTRY</span>
                 <span class="count-badge" id="prism-key-count">0</span>
              </div>
              <div class="key-list pro-scrollbar" id="prism-key-list"></div>
           </div>
           <div class="key-viewer prism-card" id="prism-key-viewer">
              <div class="empty-state">
                 <div class="empty-icon"><i data-lucide="mouse-pointer-2"></i></div>
                 <p>Select a key from the sidebar to inspect its value</p>
              </div>
           </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    document.getElementById('btn-prism-search').onclick = loadKeysPrism;
    document.getElementById('prism-search-inp').onkeypress = e => e.key === 'Enter' && loadKeysPrism();
    loadKeysPrism();
  }

  async function loadKeysPrism() {
    const q = document.getElementById('prism-search-inp').value.trim();
    const list = document.getElementById('prism-key-list');
    list.innerHTML = '<div class="p-12 flex justify-center"><div class="prism-spinner"></div></div>';

    const res = await Api.get(`redis?action=keys&q=${encodeURIComponent(q || '*')}`);
    if (res?.success) {
      document.getElementById('prism-key-count').textContent = res.data.total;
      list.innerHTML = '';
      res.data.keys.forEach(k => {
        const item = document.createElement('div');
        item.className = 'key-item group';
        item.innerHTML = `
          <div class="key-info">
             <span class="key-type type-${k.type}">${k.type[0]}</span>
             <span class="key-name truncate">${k.key}</span>
          </div>
          <i data-lucide="chevron-right" class="chevron"></i>
        `;
        item.onclick = () => viewKeyPrism(k.key);
        list.appendChild(item);
      });
      if (window.lucide) lucide.createIcons();
    }
  }

  async function viewKeyPrism(key) {
    const viewer = document.getElementById('prism-key-viewer');
    viewer.innerHTML = '<div class="p-24 flex justify-center"><div class="prism-spinner"></div></div>';

    const res = await Api.get(`redis?action=view&key=${encodeURIComponent(key)}`);
    if (res?.success) {
      const d = res.data;
      viewer.innerHTML = `
        <div class="view-container fade-in">
           <div class="view-header">
              <div class="view-title-area">
                 <div class="flex items-center gap-2 mb-2">
                    <span class="key-type-full type-${d.type}">${d.type}</span>
                    <span class="ttl-badge">${d.ttl === -1 ? 'Persistent' : 'TTL: ' + d.ttl + 's'}</span>
                 </div>
                 <h2 class="view-key-name">${d.key}</h2>
              </div>
              <button class="prism-btn-danger" id="btn-prism-del"><i data-lucide="trash-2"></i></button>
           </div>
           <div class="view-body">
              <div class="code-wrap">
                 <pre class="prism-code">${JSON.stringify(d.value, null, 2)}</pre>
              </div>
           </div>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      document.getElementById('btn-prism-del').onclick = () => handleKeyDelete(key);
    }
  }

  // --- TAB: TERMINAL ---
  function renderTerminal() {
    const container = document.getElementById('prism-tab-content');
    container.innerHTML = `
      <div class="flex flex-col h-full fade-in gap-4">
        <div class="prism-terminal-header">
           <div class="flex gap-2">
              <span class="dot bg-rose-400"></span>
              <span class="dot bg-amber-400"></span>
              <span class="dot bg-emerald-400"></span>
           </div>
           <span class="terminal-title">Redis Console Session</span>
        </div>
        <div class="prism-terminal-body pro-scrollbar" id="prism-cli-out">
<span class="text-slate-400"># Redis Prism Console v1.0</span>
<span class="text-slate-400"># Type commands and press Enter. Examples: PING, SET, GET, INFO</span>
        </div>
        <div class="prism-terminal-input-area">
           <span class="prompt">❯</span>
           <input type="text" id="prism-cli-inp" placeholder="Enter Redis command...">
        </div>
      </div>
    `;
    const input = document.getElementById('prism-cli-inp');
    const out = document.getElementById('prism-cli-out');
    
    input.onkeypress = async e => {
      if (e.key === 'Enter') {
        const cmd = input.value.trim();
        if (!cmd) return;
        out.innerHTML += `\n<div class="cli-row-in">❯ ${cmd}</div>`;
        input.value = '';
        out.scrollTop = out.scrollHeight;

        const res = await Api.post('redis?action=execute', { command: cmd });
        const result = typeof res.data === 'object' ? JSON.stringify(res.data, null, 2) : res.data;
        out.innerHTML += `\n<div class="cli-row-out ${res.success ? 'text-indigo-500' : 'text-rose-500'}">${result}</div>`;
        out.scrollTop = out.scrollHeight;
      }
    };
    input.focus();
  }

  // --- HELPERS ---
  async function handleFlush() {
    const res = await Swal.fire({
      title: 'Flush All Data?',
      text: 'Semua data dalam database Redis Anda akan dihapus secara permanen!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f6821f',
      background: '#fff',
      customClass: { popup: 'prism-swal' }
    });
    if (res.isConfirmed) {
      const r = await Api.post('redis?action=flush', {});
      if (r?.success) Toast.success(r.message);
    }
  }

  async function handleKeyDelete(key) {
    const r = await Api.post('redis?action=delete', { key });
    if (r?.success) {
      Toast.success(r.message);
      loadKeysPrism();
      document.getElementById('prism-key-viewer').innerHTML = `
        <div class="empty-state">
           <div class="empty-icon"><i data-lucide="mouse-pointer-2"></i></div>
           <p>Select a key from the sidebar to inspect its value</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    }
  }

  function formatSeconds(s) {
    if (s < 60) return s + 's';
    if (s < 3600) return Math.floor(s/60) + 'm ' + (s%60) + 's';
    return Math.floor(s/3600) + 'h ' + Math.floor((s%3600)/60) + 'm';
  }

  function injectStyles() {
    if (document.getElementById('redis-prism-styles')) return;
    const s = document.createElement('style');
    s.id = 'redis-prism-styles';
    s.textContent = `
      .redis-prism-container {
        font-family: 'Outfit', 'Inter', sans-serif;
        background: #fdfdfd;
        color: #1e293b;
        padding: 2.5rem;
        border-radius: 2rem;
        box-shadow: 0 20px 40px rgba(0,0,0,0.02);
        min-height: 850px;
        border: 1px solid #f1f5f9;
      }

      .prism-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
      .header-left { display: flex; align-items: center; gap: 1.25rem; }
      .prism-logo {
        width: 56px; height: 56px; background: linear-gradient(135deg, #6366f1, #a855f7);
        border-radius: 16px; display: flex; align-items: center; justify-content: center;
        color: white; box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
      }
      .prism-title { font-size: 1.5rem; font-weight: 900; letter-spacing: -0.02em; margin: 0; }
      .prism-subtitle { font-size: 0.8rem; color: #94a3b8; font-weight: 600; margin: 0; }

      .header-right { display: flex; align-items: center; gap: 1rem; }
      .server-badge {
        padding: 0.5rem 1rem; background: white; border: 1px solid #e2e8f0;
        border-radius: 12px; font-size: 12px; font-weight: 800; display: flex; align-items: center; gap: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.02);
      }
      .status-pulse { width: 8px; height: 8px; background: #10b981; border-radius: 50%; animation: pulse 2s infinite; }
      @keyframes pulse { 0% { box-shadow: 0 0 0 0px rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0px rgba(16, 185, 129, 0); } }

      .prism-content-layout { display: grid; grid-template-columns: 240px 1fr; gap: 2.5rem; height: 700px; }

      .prism-sidebar { display: flex; flex-direction: column; gap: 2rem; }
      .prism-nav { display: flex; flex-direction: column; gap: 0.5rem; }
      .prism-nav-btn {
        padding: 12px 18px; border-radius: 14px; border: none; background: transparent;
        display: flex; align-items: center; gap: 12px; color: #64748b; font-weight: 700;
        cursor: pointer; transition: all 0.2s; font-size: 0.9rem;
      }
      .prism-nav-btn:hover { background: #f1f5f9; color: #1e293b; }
      .prism-nav-btn.active { background: white; color: #6366f1; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
      .prism-nav-btn.text-danger { color: #f43f5e; margin-top: auto; }
      .nav-spacer { flex: 1; }

      .prism-info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 1.25rem; }
      .info-row { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
      .info-row:last-child { margin-bottom: 0; }
      .info-row .label { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; }
      .info-row .value { font-size: 11px; font-weight: 700; color: #475569; font-family: 'JetBrains Mono', monospace; }

      .prism-viewport { background: #fff; border: 1px solid #e2e8f0; border-radius: 28px; padding: 2rem; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.01); }

      .prism-hero-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
      .hero-card {
        padding: 1.5rem; border-radius: 24px; color: white; display: flex; justify-content: space-between;
        align-items: center; transition: transform 0.2s;
      }
      .hero-card:hover { transform: translateY(-5px); }
      .gradient-1 { background: linear-gradient(135deg, #6366f1, #818cf8); }
      .gradient-2 { background: linear-gradient(135deg, #a855f7, #c084fc); }
      .gradient-3 { background: linear-gradient(135deg, #10b981, #34d399); }
      .hero-label { font-size: 10px; font-weight: 800; text-transform: uppercase; opacity: 0.8; letter-spacing: 0.05em; }
      .hero-value { font-size: 1.75rem; font-weight: 900; margin: 0.25rem 0 0 0; }
      .hero-icon { font-size: 2rem; opacity: 0.3; }

      .prism-main-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; }
      .prism-card { background: #fdfdfd; border: 1px solid #f1f5f9; border-radius: 24px; padding: 1.5rem; }
      .card-header { display: flex; justify-content: space-between; align-items: center; }
      .card-title { font-size: 0.85rem; font-weight: 900; color: #64748b; text-transform: uppercase; margin: 0; }
      .card-tag { font-size: 9px; font-weight: 900; background: #e0f2fe; color: #0ea5e9; padding: 3px 8px; border-radius: 10px; }

      .ops-gauge { display: flex; flex-direction: column; align-items: center; padding: 1.5rem; background: #f8fafc; border-radius: 20px; }
      .ops-value { font-size: 2.5rem; font-weight: 900; color: #1e293b; }
      .ops-label { font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-top: -5px; }

      .progress-bg { height: 6px; background: #f1f5f9; border-radius: 10px; overflow: hidden; }
      .progress-fill { height: 100%; border-radius: 10px; transition: width 1s; }

      .prism-search-bar { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 0.5rem 0.5rem 0.5rem 1.25rem; display: flex; align-items: center; gap: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
      .prism-search-bar input { flex: 1; border: none; outline: none; font-size: 14px; font-weight: 600; color: #1e293b; }
      .prism-btn-search { background: #1e293b; color: white; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 800; cursor: pointer; }

      .prism-browser-layout { display: grid; grid-template-columns: 1fr 2fr; gap: 1.5rem; height: 500px; }
      .key-sidebar { display: flex; flex-direction: column; padding: 0; overflow: hidden; }
      .sidebar-header { padding: 1.25rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; font-size: 10px; font-weight: 900; color: #94a3b8; }
      .count-badge { background: #f1f5f9; color: #64748b; padding: 2px 8px; border-radius: 10px; }
      .key-list { flex: 1; overflow-y: auto; padding: 0.75rem; }
      .key-item {
        padding: 12px 14px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center;
        cursor: pointer; transition: all 0.2s; margin-bottom: 4px;
      }
      .key-item:hover { background: #f8fafc; }
      .key-info { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
      .key-type { font-size: 9px; font-weight: 900; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; border-radius: 6px; text-transform: uppercase; color: white; }
      .type-string { background: #6366f1; }
      .type-hash { background: #a855f7; }
      .type-list { background: #10b981; }
      .type-set { background: #f59e0b; }
      .key-name { font-size: 13px; font-weight: 700; color: #475569; }
      .chevron { width: 14px; color: #cbd5e1; opacity: 0; transition: all 0.2s; }
      .key-item:hover .chevron { opacity: 1; transform: translateX(3px); }

      .key-viewer { padding: 0; overflow: hidden; }
      .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #cbd5e1; text-align: center; padding: 2rem; }
      .empty-icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.2; }
      .empty-state p { font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }

      .view-header { padding: 1.5rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: start; }
      .view-key-name { font-size: 1.25rem; font-weight: 900; color: #1e293b; margin: 0; word-break: break-all; }
      .ttl-badge { font-size: 10px; font-weight: 800; background: #f1f5f9; color: #64748b; padding: 3px 10px; border-radius: 20px; }
      .key-type-full { font-size: 10px; font-weight: 900; padding: 3px 10px; border-radius: 6px; text-transform: uppercase; color: white; }
      .view-body { padding: 1.5rem; background: #fafafa; height: 100%; overflow-y: auto; }
      .prism-code { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #334155; line-height: 1.6; }

      .prism-terminal-header { background: #1e293b; padding: 12px 18px; border-radius: 16px 16px 0 0; display: flex; justify-content: space-between; align-items: center; }
      .dot { width: 10px; height: 10px; border-radius: 50%; }
      .terminal-title { font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; }
      .prism-terminal-body { background: #0f172a; height: 400px; padding: 1.5rem; font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #94a3b8; overflow-y: auto; border-bottom: 1px solid #1e293b; }
      .cli-row-in { color: #f6821f; font-weight: 700; margin-top: 8px; }
      .cli-row-out { padding-left: 1rem; margin-bottom: 8px; white-space: pre-wrap; font-weight: 500; }
      .prism-terminal-input-area { background: #0f172a; padding: 12px 18px; border-radius: 0 0 16px 16px; display: flex; align-items: center; gap: 12px; }
      .prompt { color: #f6821f; font-weight: 900; }
      .prism-terminal-input-area input { flex: 1; background: transparent; border: none; outline: none; color: white; font-family: 'JetBrains Mono', monospace; font-size: 13px; }

      .prism-loader-wrap { height: 100%; display: flex; align-items: center; justify-content: center; }
      .prism-spinner { width: 40px; height: 40px; border: 4px solid #f1f5f9; border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }

      .prism-btn-primary { background: white; border: 1px solid #e2e8f0; color: #1e293b; padding: 10px 18px; border-radius: 14px; font-weight: 800; font-size: 12px; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s; }
      .prism-btn-primary:hover { border-color: #6366f1; color: #6366f1; transform: translateY(-2px); }
      .prism-btn-danger { background: #fff1f2; border: 1px solid #fecdd3; color: #e11d48; padding: 10px; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
      .prism-btn-danger:hover { background: #e11d48; color: white; }

      .pro-scrollbar::-webkit-scrollbar { width: 5px; }
      .pro-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      .fade-in { animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(s);
  }

  return { render };
})();

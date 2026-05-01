import { Api, Toast } from "../api.js";

export const PageRedis = (() => {
  let statsChart = null;
  let activeTab = 'overview';
  let chartData = { labels: [], memory: [] };

  async function render(params) {
    const view = document.getElementById('page-view');
    view.innerHTML = `
      <div class="redis-pro-container">
        <!-- Header Section -->
        <div class="redis-header mb-6">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-4">
              <div class="redis-logo-ring">
                <i data-lucide="database"></i>
              </div>
              <div>
                <h2 class="text-xl font-extrabold text-slate-800 tracking-tight">Redis Pro Insight</h2>
                <div class="flex items-center gap-2 mt-1">
                  <span class="pulse-dot"></span>
                  <span class="text-[10px] text-slate-400 font-black uppercase tracking-wider">Live Server Status</span>
                </div>
              </div>
            </div>
            <div class="flex gap-3">
               <div class="top-badge bg-slate-100 border border-slate-200">
                  <span class="text-slate-400 mr-2 uppercase">Version</span>
                  <span class="text-orange-600 font-mono" id="stat-version">--</span>
               </div>
               <div class="top-badge bg-slate-100 border border-slate-200">
                  <span class="text-slate-400 mr-2 uppercase">Uptime</span>
                  <span class="text-emerald-600 font-mono" id="stat-uptime">--</span>
               </div>
            </div>
          </div>
        </div>

        <div class="redis-layout">
          <!-- Internal Sidebar Navigation -->
          <aside class="redis-sidebar">
            <nav class="redis-nav">
              <button class="nav-btn active" data-tab="overview">
                <i data-lucide="layout-dashboard"></i>
                <span>Dashboard</span>
              </button>
              <button class="nav-btn" data-tab="browser">
                <i data-lucide="search"></i>
                <span>Key Browser</span>
              </button>
              <button class="nav-btn" data-tab="terminal">
                <i data-lucide="terminal"></i>
                <span>CLI Terminal</span>
              </button>
              <div class="nav-divider"></div>
              <button class="nav-btn" id="btn-flush-db-pro">
                <i data-lucide="trash-2" class="text-rose-500"></i>
                <span class="text-rose-500">Flush DB</span>
              </button>
            </nav>

            <div class="redis-mini-stats">
               <div class="mini-stat-item">
                  <span class="label">Memory</span>
                  <span class="value" id="stat-memory">--</span>
               </div>
               <div class="mini-stat-item">
                  <span class="label">Clients</span>
                  <span class="value" id="stat-clients">--</span>
               </div>
            </div>
          </aside>

          <!-- Main Content Area -->
          <main class="redis-main-content" id="redis-tab-content">
            <!-- Content injected here -->
          </main>
        </div>
      </div>
    `;

    injectStyles();
    initNavigation();
    await loadStatsLoop();
    if (window.lucide) lucide.createIcons();
  }

  function initNavigation() {
    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(btn => {
      if (btn.id === 'btn-flush-db-pro') return;
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTab = btn.dataset.tab;
        switchTab(activeTab);
      });
    });

    document.getElementById('btn-flush-db-pro').addEventListener('click', handleFlush);
    switchTab('overview');
  }

  function switchTab(tab) {
    const container = document.getElementById('redis-tab-content');
    container.innerHTML = '<div class="flex items-center justify-center h-full"><div class="pro-spinner"></div></div>';

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
      document.getElementById('stat-memory').textContent = s.memory_used;
      document.getElementById('stat-clients').textContent = s.clients;
      
      // Update chart if on overview
      if (activeTab === 'overview' && statsChart) {
        updateChart(parseFloat(s.memory_used));
      }
    }
    // Poll every 5 seconds if still on redis page
    if (window.location.hash === '#redis') {
      setTimeout(loadStatsLoop, 5000);
    }
  }

  // --- TAB: OVERVIEW ---
  function renderOverview() {
    const container = document.getElementById('redis-tab-content');
    container.innerHTML = `
      <div class="fade-in space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 glass-card p-6 shadow-sm bg-white">
            <h3 class="glass-card-title">Memory Allocation</h3>
            <div class="h-[300px] mt-4">
              <canvas id="memory-pro-chart"></canvas>
            </div>
          </div>
          <div class="space-y-6">
            <div class="glass-card p-6 border-l-4 border-l-orange-500 shadow-sm bg-white">
               <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Instantaneous Ops</span>
               <div class="text-4xl font-black text-slate-800 mt-2" id="stat-ops">--</div>
               <div class="text-[10px] text-slate-400 mt-1 uppercase font-bold">Operations per second</div>
            </div>
            <div class="glass-card p-6 shadow-sm bg-white">
               <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">Key Distribution</h4>
               <div class="flex items-end justify-between gap-2 h-20 px-4">
                  <div class="bg-blue-400/20 w-full rounded-t-md" style="height: 40%"></div>
                  <div class="bg-purple-400/40 w-full rounded-t-md" style="height: 70%"></div>
                  <div class="bg-emerald-500/60 w-full rounded-t-md" style="height: 90%"></div>
                  <div class="bg-orange-400/30 w-full rounded-t-md" style="height: 50%"></div>
               </div>
               <div class="flex justify-between text-[8px] text-slate-400 mt-3 font-black uppercase px-2">
                  <span>STR</span><span>HASH</span><span>LIST</span><span>SET</span>
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
    const ctx = document.getElementById('memory-pro-chart').getContext('2d');
    statsChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [{
          label: 'Used Memory',
          data: chartData.memory,
          borderColor: '#f6821f',
          backgroundColor: 'rgba(246, 130, 31, 0.05)',
          borderWidth: 3,
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
            grid: { color: '#f1f5f9' },
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
    if (chartData.labels.length > 30) {
      chartData.labels.shift();
      chartData.memory.shift();
    }
    statsChart.update('none');
  }

  // --- TAB: BROWSER ---
  function renderBrowser() {
    const container = document.getElementById('redis-tab-content');
    container.innerHTML = `
      <div class="flex flex-col h-full fade-in">
        <div class="flex gap-3 mb-6">
          <div class="relative flex-1">
             <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
             <input type="text" id="redis-search-input" class="pro-input pl-10" placeholder="Search keys (e.g. cache:*)">
          </div>
          <button class="pro-btn-icon" id="btn-refresh-pro"><i data-lucide="refresh-cw"></i></button>
        </div>

        <div class="flex flex-1 overflow-hidden gap-6">
          <div class="w-1/3 flex flex-col bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
             <div class="p-4 border-b border-slate-200 flex justify-between items-center bg-white/50 rounded-t-2xl">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Key Registry</span>
                <span class="badge-pro" id="pro-key-count">0</span>
             </div>
             <div class="flex-1 overflow-y-auto pro-scrollbar p-2" id="pro-key-list"></div>
          </div>
          <div class="flex-1 glass-card overflow-hidden flex flex-col shadow-sm bg-white" id="pro-viewer">
             <div class="flex flex-col items-center justify-center h-full opacity-30">
                <i data-lucide="mouse-pointer-2" class="w-12 h-12 mb-4 text-slate-300"></i>
                <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest">Select a key to inspect</p>
             </div>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    document.getElementById('btn-refresh-pro').addEventListener('click', loadKeysPro);
    document.getElementById('redis-search-input').addEventListener('keypress', e => e.key === 'Enter' && loadKeysPro());
    loadKeysPro();
  }

  async function loadKeysPro() {
    const q = document.getElementById('redis-search-input').value.trim();
    const list = document.getElementById('pro-key-list');
    list.innerHTML = '<div class="p-10 flex justify-center"><div class="pro-spinner"></div></div>';

    const res = await Api.get(`redis?action=keys&q=${encodeURIComponent(q || '*')}`);
    if (res?.success) {
      document.getElementById('pro-key-count').textContent = res.data.total;
      list.innerHTML = '';
      res.data.keys.forEach(k => {
        const div = document.createElement('div');
        div.className = 'pro-key-item group';
        div.innerHTML = `
          <div class="flex items-center gap-3 truncate">
            <span class="type-tag tag-${k.type}">${k.type[0]}</span>
            <span class="truncate text-slate-600 text-[13px] font-semibold group-hover:text-orange-600">${k.key}</span>
          </div>
          <i data-lucide="chevron-right" class="w-3 h-3 text-slate-300 group-hover:text-orange-500"></i>
        `;
        div.onclick = () => viewKeyPro(k.key);
        list.appendChild(div);
      });
      if (window.lucide) lucide.createIcons();
    }
  }

  async function viewKeyPro(key) {
    const viewer = document.getElementById('pro-viewer');
    viewer.innerHTML = '<div class="p-20 flex justify-center"><div class="pro-spinner"></div></div>';

    const res = await Api.get(`redis?action=view&key=${encodeURIComponent(key)}`);
    if (res?.success) {
      const d = res.data;
      viewer.innerHTML = `
        <div class="flex flex-col h-full fade-in">
          <div class="p-6 border-b border-slate-100 flex justify-between items-start">
             <div>
                <div class="flex items-center gap-3 mb-2">
                   <span class="type-tag tag-${d.type}">${d.type}</span>
                   <span class="text-[10px] text-slate-400 font-black uppercase tracking-wider">TTL: ${d.ttl === -1 ? 'Persistent' : d.ttl + 's'}</span>
                </div>
                <h3 class="text-xl font-extrabold text-slate-800 break-all tracking-tight">${d.key}</h3>
             </div>
             <button class="pro-btn-danger" id="btn-del-pro"><i data-lucide="trash-2"></i></button>
          </div>
          <div class="flex-1 p-6 overflow-auto bg-slate-50/50">
             <pre class="pro-code-block">${JSON.stringify(d.value, null, 2)}</pre>
          </div>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      document.getElementById('btn-del-pro').onclick = () => handleKeyDelete(key);
    }
  }

  // --- TAB: TERMINAL ---
  function renderTerminal() {
    const container = document.getElementById('redis-tab-content');
    container.innerHTML = `
      <div class="flex flex-col h-full fade-in gap-4">
        <div class="flex-1 pro-terminal" id="pro-cli-output">
<span class="text-slate-500"># Redis Pro CLI [Ready]</span>
<span class="text-slate-500"># Type commands and press Enter. Try: PING, INFO, KEYS *</span>
        </div>
        <div class="relative">
           <span class="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 font-black">❯</span>
           <input type="text" id="pro-cli-input" class="pro-input pl-10 font-mono text-[13px]" placeholder="Type your command here...">
        </div>
      </div>
    `;
    const input = document.getElementById('pro-cli-input');
    const out = document.getElementById('pro-cli-output');
    
    input.addEventListener('keypress', async e => {
      if (e.key === 'Enter') {
        const cmd = input.value.trim();
        if (!cmd) return;
        out.innerHTML += `\n<span class="text-slate-800 font-bold tracking-tight">❯ ${cmd}</span>`;
        input.value = '';
        out.scrollTop = out.scrollHeight;

        const res = await Api.post('redis?action=execute', { command: cmd });
        const result = typeof res.data === 'object' ? JSON.stringify(res.data, null, 2) : res.data;
        out.innerHTML += `\n<div class="pl-4 py-1 ${res.success ? 'text-indigo-600' : 'text-rose-500'} font-medium whitespace-pre-wrap">${result}</div>`;
        out.scrollTop = out.scrollHeight;
      }
    });
    input.focus();
  }

  // --- HELPERS ---
  async function handleFlush() {
    const res = await Swal.fire({
      title: 'Flush All Data?',
      text: 'Semua data Redis akan dihapus permanen!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f6821f',
      background: '#fff',
      color: '#1e293b'
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
      loadKeysPro();
      document.getElementById('pro-viewer').innerHTML = '<div class="flex flex-col items-center justify-center h-full opacity-30"><i data-lucide="mouse-pointer-2" class="w-12 h-12 mb-4 text-slate-300"></i><p class="text-[11px] font-black text-slate-400 uppercase tracking-widest">Select a key to inspect</p></div>';
      if (window.lucide) lucide.createIcons();
    }
  }

  function formatSeconds(s) {
    if (s < 60) return s + 's';
    if (s < 3600) return Math.floor(s/60) + 'm ' + (s%60) + 's';
    return Math.floor(s/3600) + 'h ' + Math.floor((s%3600)/60) + 'm';
  }

  function injectStyles() {
    if (document.getElementById('redis-pro-styles')) return;
    const s = document.createElement('style');
    s.id = 'redis-pro-styles';
    s.textContent = `
      :root {
        --redis-bg: #f8fafc;
        --redis-sidebar: #ffffff;
        --redis-glass: rgba(255, 255, 255, 0.8);
        --redis-border: #e2e8f0;
        --redis-accent: #f6821f;
        --redis-text: #1e293b;
      }

      .redis-pro-container {
        color: var(--redis-text);
        font-family: 'Inter', system-ui, sans-serif;
        background: var(--redis-bg);
        border-radius: 2rem;
        padding: 2.5rem;
        min-height: 800px;
        border: 1px solid var(--redis-border);
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
      }

      .redis-logo-ring {
        width: 52px; height: 52px;
        background: linear-gradient(135deg, var(--redis-accent), #fbbf24);
        border-radius: 14px;
        display: flex; align-items: center; justify-content: center;
        color: white; box-shadow: 0 10px 20px rgba(246, 130, 31, 0.2);
      }

      .pulse-dot {
        width: 8px; height: 8px; background: #10b981; border-radius: 50%;
        box-shadow: 0 0 0 rgba(16, 185, 129, 0.4); animation: pulse 2s infinite;
      }
      @keyframes pulse { 0% { box-shadow: 0 0 0 0px rgba(16, 185, 129, 0.7); } 70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0px rgba(16, 185, 129, 0); } }

      .top-badge { padding: 8px 16px; border-radius: 12px; font-size: 11px; font-weight: 800; }

      .redis-layout { display: grid; grid-template-columns: 220px 1fr; gap: 2.5rem; margin-top: 1.5rem; height: 680px; }

      .redis-sidebar { display: flex; flex-direction: column; gap: 2rem; }
      .nav-btn {
        width: 100%; display: flex; align-items: center; gap: 14px;
        padding: 14px; border-radius: 12px; border: none; background: transparent;
        color: #64748b; font-size: 14px; font-weight: 700; cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .nav-btn:hover { background: #f1f5f9; color: #1e293b; transform: translateX(5px); }
      .nav-btn.active { background: white; color: var(--redis-accent); box-shadow: 0 4px 15px rgba(0,0,0,0.06); }
      .nav-btn i { width: 20px; height: 20px; }
      .nav-divider { height: 1px; background: var(--redis-border); margin: 0.5rem 0; opacity: 0.5; }

      .redis-main-content { background: var(--redis-glass); border: 1px solid var(--redis-border); border-radius: 24px; backdrop-filter: blur(15px); padding: 2rem; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }

      .glass-card { background: white; border: 1px solid var(--redis-border); border-radius: 20px; }
      .glass-card-title { font-size: 11px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; }

      .pro-spinner {
        width: 36px; height: 36px; border: 4px solid #f1f5f9;
        border-top-color: var(--redis-accent); border-radius: 50%; animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }

      .pro-input {
        width: 100%; background: #ffffff; border: 1px solid var(--redis-border);
        border-radius: 12px; padding: 12px 18px; color: #1e293b; outline: none; font-weight: 500;
        transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.02);
      }
      .pro-input:focus { border-color: var(--redis-accent); box-shadow: 0 0 0 4px rgba(246, 130, 31, 0.1); }

      .pro-key-item {
        padding: 12px 16px; border-radius: 12px; margin-bottom: 4px;
        cursor: pointer; display: flex; align-items: center; justify-content: space-between;
        transition: all 0.2s;
      }
      .pro-key-item:hover { background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.04); transform: scale(1.02); }

      .type-tag { font-size: 9px; font-weight: 900; padding: 3px 7px; border-radius: 6px; text-transform: uppercase; }
      .tag-string { background: #e0f2fe; color: #0369a1; }
      .tag-hash   { background: #f3e8ff; color: #7e22ce; }
      .tag-list   { background: #dcfce7; color: #15803d; }
      .tag-set    { background: #fef3c7; color: #b45309; }
      .tag-zset   { background: #fce7f3; color: #be185d; }

      .pro-code-block { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #334155; line-height: 1.7; font-weight: 500; }
      .pro-terminal { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 2rem; font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #475569; overflow-y: auto; box-shadow: inset 0 2px 4px rgba(0,0,0,0.03); }

      .pro-scrollbar::-webkit-scrollbar { width: 5px; }
      .pro-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

      .fade-in { animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

      .pro-btn-icon { background: white; border: 1px solid var(--redis-border); color: #64748b; padding: 12px; border-radius: 12px; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
      .pro-btn-icon:hover { color: var(--redis-accent); border-color: var(--redis-accent); }
      .pro-btn-danger { background: #fff1f2; border: 1px solid #fecdd3; color: #e11d48; padding: 10px; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
      .pro-btn-danger:hover { background: #e11d48; color: white; border-color: #e11d48; }
      .badge-pro { background: #f1f5f9; color: #475569; font-size: 10px; font-weight: 900; padding: 3px 10px; border-radius: 20px; }
      
      .redis-mini-stats { margin-top: auto; background: #f1f5f9; padding: 1.25rem; border-radius: 16px; display: flex; flex-direction: column; gap: 10px; }
      .mini-stat-item { display: flex; justify-content: space-between; align-items: center; }
      .mini-stat-item .label { font-size: 10px; font-weight: 800; color: #94a3b8; uppercase; }
      .mini-stat-item .value { font-size: 12px; font-weight: 700; color: #475569; font-family: 'JetBrains Mono', monospace; }
    `;
    document.head.appendChild(s);
  }

  return { render };
})();

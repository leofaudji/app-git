import { Api } from "../api.js";

export const PageDashboard = {
  async render(params) {
    const view = document.getElementById('page-view');
    view.innerHTML = `
      <div class="fade-in-up">
        <!-- ─── Header Section ─── -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h2 class="text-3xl font-extrabold tracking-tight text-gray-900">Infrastructure Dashboard</h2>
            <p class="text-gray-500 mt-1">Real-time system performance and deployment insights.</p>
          </div>
          <div class="flex items-center gap-3">
             <div id="system-health-badge" class="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                SYSTEM HEALTHY
             </div>
             <div id="last-update" class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
               Syncing...
             </div>
          </div>
        </div>
        
        <!-- ─── Row 1: Top KPIs (Visual & Vibrant) ─── -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="stat-card-premium bg-gradient-to-br from-indigo-600 to-violet-700 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden group">
            <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div class="relative z-10">
              <div class="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-4">Total Projects</div>
              <div class="flex items-end justify-between">
                <div class="text-5xl font-black tracking-tighter" id="stat-projects">0</div>
                <div class="flex flex-col items-end">
                  <span class="text-xs font-bold bg-white/20 px-2 py-0.5 rounded" id="stat-active-projs">0 Active</span>
                  <span class="text-indigo-200 text-[10px] mt-1">Workspace managed</span>
                </div>
              </div>
            </div>
          </div>

          <div class="stat-card-premium bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden group">
             <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
             <div class="relative z-10">
               <div class="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-4">Deployment Success</div>
               <div class="flex items-end justify-between">
                 <div class="text-5xl font-black tracking-tighter" id="stat-rate">0%</div>
                 <div class="flex flex-col items-end">
                   <div class="w-16 h-1 w-full bg-white/20 rounded-full mt-2 overflow-hidden">
                      <div id="rate-bar" class="bg-white h-full transition-all duration-1000" style="width: 0%"></div>
                   </div>
                   <span class="text-emerald-100 text-[10px] mt-1 font-bold">Reliability Index</span>
                 </div>
               </div>
             </div>
          </div>

          <div class="stat-card-premium bg-gradient-to-br from-orange-500 to-rose-600 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden group">
             <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
             <div class="relative z-10">
               <div class="text-orange-100 text-xs font-bold uppercase tracking-widest mb-4">Total Deliveries</div>
               <div class="flex items-end justify-between">
                 <div class="text-5xl font-black tracking-tighter" id="stat-total">0</div>
                 <div class="flex flex-col items-end text-right">
                   <span class="text-xs font-bold italic" id="stat-24h">+0 today</span>
                   <span class="text-orange-100 text-[10px] mt-1 uppercase">Cloud-native pulls</span>
                 </div>
               </div>
             </div>
          </div>
        </div>

        <!-- ─── Row 2: System Core Health (Infrastructure focus) ─── -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          <!-- CPU Monitor -->
          <div class="card p-0 overflow-hidden border-0 shadow-lg bg-white group">
             <div class="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <div class="flex items-center gap-2">
                   <span class="p-1.5 rounded-lg bg-indigo-100 text-indigo-600">⚡</span>
                   <h3 class="text-sm font-bold text-gray-700 uppercase tracking-wide">CPU Core Load</h3>
                </div>
                <div id="cpu-value" class="text-lg font-black text-indigo-600">0%</div>
             </div>
             <div class="h-[180px] relative">
               <canvas id="cpu-chart"></canvas>
             </div>
          </div>

          <!-- RAM Monitor -->
          <div class="card p-0 overflow-hidden border-0 shadow-lg bg-white">
             <div class="p-5 border-b border-gray-0 flex items-center justify-between bg-gray-50/50">
                <div class="flex items-center gap-2">
                   <span class="p-1.5 rounded-lg bg-pink-100 text-pink-600">🧠</span>
                   <h3 class="text-sm font-bold text-gray-700 uppercase tracking-wide">Memory Usage</h3>
                </div>
                <div id="ram-percent" class="text-lg font-black text-pink-600">0%</div>
             </div>
             <div class="h-[140px] relative">
               <canvas id="ram-chart"></canvas>
             </div>
             <div class="p-4 pt-1">
                <div class="flex justify-between text-[10px] font-bold text-gray-400 mb-1 px-1">
                   <span>ALOCATED: <span id="ram-used" class="text-gray-600">0 GB</span></span>
                   <span>TOTAL: <span id="ram-total" class="text-gray-600">0 GB</span></span>
                </div>
                <div class="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                   <div id="ram-bar" class="bg-pink-500 h-full transition-all duration-500" style="width: 0%"></div>
                </div>
             </div>
          </div>

          <!-- Disk & Stability -->
          <div class="flex flex-col gap-6">
            <!-- Disk Usage Card -->
            <div class="card p-5 border-0 shadow-lg bg-gradient-to-br from-slate-800 to-slate-900 text-white flex-1 relative overflow-hidden">
               <div class="absolute right-[-20px] bottom-[-20px] text-8xl opacity-10 rotate-12">💾</div>
               <div class="relative z-10 h-full flex flex-col justify-between">
                  <div class="flex items-center justify-between mb-4">
                     <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Storage Capacity</h3>
                     <span id="disk-percent" class="text-xs font-bold bg-white/10 px-2 py-0.5 rounded">0%</span>
                  </div>
                  <div class="flex items-center gap-6 mb-4">
                     <div class="text-4xl font-black text-white" id="disk-used">0 GB</div>
                     <div class="text-slate-400 text-xs">Used of <span id="disk-total">0 GB</span></div>
                  </div>
                  <div class="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div id="disk-bar" class="bg-sky-400 h-full shadow-[0_0_10px_#38bdf8]" style="width: 0%"></div>
                  </div>
               </div>
            </div>

            <!-- Health Status mini-card -->
             <div class="card p-5 border-0 shadow-lg bg-white flex items-center justify-between">
               <div class="flex items-center gap-3">
                 <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg shadow-sm">🛡️</div>
                 <div>
                    <h4 class="text-xs font-bold text-gray-400 uppercase tracking-tighter">Security Perimeter</h4>
                    <p class="text-sm font-bold text-gray-800">All Agents Active</p>
                 </div>
               </div>
               <span class="badge badge-success">Verified</span>
             </div>
          </div>
        </div>

        <!-- ─── Row 3: Active Workspaces & Activity Stream ─── -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          <!-- Column: Projects (3/4) -->
          <div class="lg:col-span-3">
            <div class="flex items-center justify-between mb-6">
               <div class="flex items-center gap-3">
                  <div class="w-1 h-6 bg-orange-500 rounded-full"></div>
                  <h3 class="text-xl font-extrabold text-gray-800">Operational Workspaces</h3>
               </div>
               <a href="#projects" class="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group">
                 View Workspace Map <span class="group-hover:translate-x-1 transition-transform">→</span>
               </a>
            </div>
            
            <div id="projects-grid" class="grid grid-cols-1 md:grid-cols-2 gap-6">
               <!-- Project Cards -->
            </div>
          </div>

          <!-- Column: Activity Stream (1/4) -->
          <div class="lg:col-span-1">
             <div class="flex items-center gap-3 mb-6">
                <div class="w-1 h-6 bg-indigo-500 rounded-full"></div>
                <h3 class="text-xl font-extrabold text-gray-800">Activity Stream</h3>
             </div>
             <div class="card p-0 border-0 shadow-xl bg-white overflow-hidden min-h-[500px]">
                <div class="bg-gray-50/80 p-4 border-b border-gray-100 flex items-center justify-between">
                   <span class="text-[10px] font-black uppercase text-gray-400 tracking-widest">Real-time Logs</span>
                   <span class="relative flex h-2 w-2">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                   </span>
                </div>
                <div id="activity-timeline" class="p-6 timeline-modern">
                   <!-- Recent Activity -->
                </div>
                <div class="p-4 mt-auto">
                   <a href="#logs" class="block w-full text-center py-2.5 bg-gray-50 hover:bg-gray-100 text-xs font-bold text-indigo-600 rounded-xl border border-gray-100 transition-colors">Complete Audit Trail</a>
                </div>
             </div>
          </div>

        </div>
      </div>
    `;

    this.init();
  },

  async init() {
    const [dashRes, analyticsRes] = await Promise.all([
      Api.get('dashboard'),
      Api.get('analytics')
    ]);

    if (!dashRes?.success) {
      document.getElementById('page-view').innerHTML = `<div class="alert alert-error">Gagal memuat dashboard: ${dashRes?.message}</div>`;
      return;
    }

    const { stats, recent, projects } = dashRes.data;

    // 1. Update Core Stats
    this.setElText('stat-projects', projects.length);
    this.setElText('stat-active-projs', projects.filter(p => p.is_active).length + ' Active');
    this.setElText('stat-rate', stats.success_rate + '%');
    this.setElStyle('rate-bar', 'width', stats.success_rate + '%');
    this.setElText('stat-total', stats.total);
    this.setElText('stat-24h', `+${stats.logs_24h} today`);

    this.setElText('last-update', 'Synced: ' + new Date().toLocaleTimeString());

    // 2. Monitoring Setup
    this.initMonitorCharts();
    this.startPolling();

    // 3. Project Cards Redesign
    const projGrid = document.getElementById('projects-grid');
    if (projGrid) {
      if (projects.length === 0) {
        projGrid.innerHTML = `<div class="col-span-full py-20 text-center"><p class="text-gray-400">No projects indexed yet.</p></div>`;
      } else {
        projGrid.innerHTML = projects.slice(0, 6).map(p => `
          <div class="group relative bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-indigo-100 transition-all duration-300 overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
            
            <div class="relative z-10">
              <div class="flex justify-between items-start mb-6">
                <div class="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-xl shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  ${p.name.charAt(0).toUpperCase()}
                </div>
                <div class="flex flex-col items-end gap-1">
                   ${this.getStatusBadge(p.last_status)}
                   <span class="text-[9px] font-black text-gray-400 uppercase tracking-tighter">${p.branch || 'main'}</span>
                </div>
              </div>

              <h3 class="font-bold text-gray-800 text-lg mb-1 truncate">${p.name}</h3>
              <p class="text-gray-400 text-xs mb-5 truncate font-medium">Last deployment: <span class="text-gray-600">${this.formatTime(p.last_deploy)}</span></p>
              
              <div class="flex gap-2">
                <a href="#git?project_id=${p.id}" class="flex-1 text-center py-2 rounded-lg bg-gray-50 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors">GIT OPS</a>
                <a href="#logs?project_id=${p.id}" class="flex-1 text-center py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-colors">DEPLOYS</a>
              </div>
            </div>
          </div>
        `).join('');
      }
    }

    // 4. Timeline Modernized
    const timeline = document.getElementById('activity-timeline');
    if (timeline) {
      if (recent.length === 0) {
        timeline.innerHTML = `<p class="text-center text-gray-400 text-xs py-10">Waiting for activity...</p>`;
      } else {
        timeline.innerHTML = recent.map(log => `
          <div class="flex gap-4 mb-6 last:mb-0 group/tl">
             <div class="flex flex-col items-center">
                <div class="w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-xs z-10 ${this.getLogColor(log.status)}">
                  ${this.getLogIcon(log.triggered_by)}
                </div>
                <div class="w-0.5 flex-1 bg-gray-100 -mt-1 group-last/tl:hidden"></div>
             </div>
             <div class="pt-0.5 flex-1 pb-4">
                <div class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center justify-between">
                   ${this.formatTime(log.created_at)}
                   ${log.status === 'success' ? '✅' : '❌'}
                </div>
                <p class="text-xs text-gray-700 font-bold leading-tight mb-1">
                   ${log.project_name || 'System'} <span class="text-gray-400 font-medium">updated via</span> ${log.triggered_by}
                </p>
                <code class="text-[10px] text-indigo-500 font-mono">#${(log.commit_hash || '------').substring(0,7)}</code>
             </div>
          </div>
        `).join('');
      }
    }
  },

  getLogIcon(triggered) {
    if (triggered === 'webhook') return '📡';
    if (triggered === 'manual') return '👤';
    return '🚀';
  },

  getLogColor(status) {
    if (status === 'success') return 'bg-emerald-500 text-white';
    if (status === 'failed') return 'bg-rose-500 text-white';
    return 'bg-amber-500 text-white';
  },

  initMonitorCharts() {
    const sharedOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: {
        y: { beginAtZero: true, max: 100, display: false },
        x: { display: false }
      },
      animation: { duration: 0 }
    };

    // CPU Chart - Indigo Area
    const elCpu = document.getElementById('cpu-chart');
    if (!elCpu) return;
    const cpuCtx = elCpu.getContext('2d');
    const cpuGradiant = cpuCtx.createLinearGradient(0, 0, 0, 180);
    cpuGradiant.addColorStop(0, 'rgba(79, 70, 229, 0.2)');
    cpuGradiant.addColorStop(1, 'rgba(79, 70, 229, 0)');

    this.cpuChart = new Chart(cpuCtx, {
      type: 'line',
      data: {
        labels: Array(30).fill(''),
        datasets: [{
          data: Array(30).fill(0),
          borderColor: '#4f46e5',
          borderWidth: 3,
          backgroundColor: cpuGradiant,
          fill: true,
          pointRadius: 0,
          tension: 0.4
        }]
      },
      options: sharedOptions
    });

    // RAM Chart - Pink Area
    const elRam = document.getElementById('ram-chart');
    if (!elRam) return;
    const ramCtx = elRam.getContext('2d');
    const ramGradiant = ramCtx.createLinearGradient(0, 0, 0, 140);
    ramGradiant.addColorStop(0, 'rgba(236, 72, 153, 0.15)');
    ramGradiant.addColorStop(1, 'rgba(236, 72, 153, 0)');

    this.ramChart = new Chart(ramCtx, {
      type: 'line',
      data: {
        labels: Array(30).fill(''),
        datasets: [{
          data: Array(30).fill(0),
          borderColor: '#ec4899',
          borderWidth: 2,
          backgroundColor: ramGradiant,
          fill: true,
          pointRadius: 0,
          tension: 0.4
        }]
      },
      options: sharedOptions
    });
  },

  async startPolling() {
    if (window.monitorInterval) clearInterval(window.monitorInterval);

    const poll = async () => {
      if (!document.getElementById('cpu-chart')) {
        clearInterval(window.monitorInterval);
        return;
      }
      const res = await Api.get('monitoring');
      if (res?.success) this.updateMonitorCharts(res.data);
    };

    poll();
    window.monitorInterval = setInterval(poll, 3000);
  },

  updateMonitorCharts(data) {
    if (!this.cpuChart || !this.ramChart) return;

    // CPU
    const cpuData = this.cpuChart.data.datasets[0].data;
    cpuData.shift();
    cpuData.push(data.cpu);
    this.cpuChart.update();
    this.setElText('cpu-value', data.cpu + '%');

    // System Health Status (Dynamic)
    const healthBadge = document.getElementById('system-health-badge');
    if (healthBadge) {
       if (data.cpu > 90 || data.ram.percent > 90) {
          healthBadge.className = 'px-3 py-1.5 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold flex items-center gap-2';
          healthBadge.innerHTML = '<span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> HIGH LOAD';
       } else {
          healthBadge.className = 'px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold flex items-center gap-2';
          healthBadge.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> SYSTEM HEALTHY';
       }
    }

    // RAM
    const ramData = this.ramChart.data.datasets[0].data;
    ramData.shift();
    ramData.push(data.ram.percent);
    this.ramChart.update();
    this.setElText('ram-percent', data.ram.percent + '%');
    this.setElText('ram-used', data.ram.used + ' GB');
    this.setElText('ram-total', data.ram.total + ' GB');
    this.setElStyle('ram-bar', 'width', data.ram.percent + '%');

    // Disk
    if (data.disk) {
      this.setElText('disk-percent', data.disk.percent + '%');
      this.setElText('disk-used', data.disk.used + ' GB');
      this.setElText('disk-total', data.disk.total + ' GB');
      this.setElStyle('disk-bar', 'width', data.disk.percent + '%');
    }
  },

  setElText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  },

  setElStyle(id, prop, val) {
    const el = document.getElementById(id);
    if (el) el.style[prop] = val;
  },

  getStatusBadge(status) {
    if (status === 'success') return '<span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 text-[9px] font-black uppercase">Success</span>';
    if (status === 'failed')  return '<span class="px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 text-[9px] font-black uppercase">Failed</span>';
    if (status === 'running') return '<span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 text-[9px] font-black uppercase animate-pulse">Running</span>';
    return '<span class="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[9px] font-black uppercase">Inactive</span>';
  },

  formatTime(dateStr) {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    
    return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
  }
};

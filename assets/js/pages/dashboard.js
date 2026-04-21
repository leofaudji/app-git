import { Api } from "../api.js";

export const PageDashboard = {
  async render(params) {
    const view = document.getElementById('page-view');
    view.className = 'bg-cloudflare min-h-screen p-6';

    view.innerHTML = `
      <div class="fade-in-up max-w-[1440px] mx-auto">
        <!-- ─── Breadcrumbs & Header ─── -->
        <div class="flex items-center gap-2 text-xs text-slate-500 mb-4">
           <span>Account</span> <span class="text-slate-300">/</span> 
           <span class="font-bold text-slate-700">Dashboard</span>
        </div>
        
        <div class="flex items-center justify-between mb-8 pb-6 border-b border-slate-200">
          <div>
            <h2 class="text-2xl font-bold text-slate-900 tracking-tight">Analytics Overview</h2>
            <p class="text-sm text-slate-500 mt-1">Real-time performance and deployment statistics for your account.</p>
          </div>
          <div class="flex items-center gap-4">
             <div class="text-right">
                <div class="cf-label text-[10px]">Last Sync</div>
                <div class="text-xs font-bold text-slate-700" id="last-update">Syncing...</div>
             </div>
             <button onclick="location.reload()" class="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-50">Refresh</button>
          </div>
        </div>

        <!-- ─── 1. Contribution Graph (Heatmap) - TOP ─── -->
        <div class="cf-card mb-8">
           <div class="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                 <i data-lucide="sparkles" class="w-4 h-4 text-emerald-500"></i>
                 Contribution Activity (Last 12 Months)
              </h3>
              <div class="text-[10px] font-bold text-slate-400 uppercase pr-2" id="total-contributions">0 deployments</div>
           </div>
           <div class="p-6 pb-4">
              <div class="flex flex-col lg:flex-row gap-6">
                 <div id="contribution-heatmap-container" class="flex-1 overflow-x-auto">
                    <div class="flex items-center justify-center py-8" id="heatmap-loader">
                       <div class="spinner w-6 h-6 border-2"></div>
                    </div>
                 </div>
                 <div id="contribution-year-selector" class="flex flex-col gap-1 w-24">
                    <!-- Year buttons will be injected here -->
                 </div>
              </div>
              <div class="flex items-center justify-end gap-2 mt-4 text-[10px] font-bold text-slate-400">
                 <span>Less</span>
                 <div class="flex gap-1">
                    <div class="w-2.5 h-2.5 rounded-sm bg-slate-100"></div>
                    <div class="w-2.5 h-2.5 rounded-sm bg-emerald-100"></div>
                    <div class="w-2.5 h-2.5 rounded-sm bg-emerald-300"></div>
                    <div class="w-2.5 h-2.5 rounded-sm bg-emerald-500"></div>
                    <div class="w-2.5 h-2.5 rounded-sm bg-emerald-700"></div>
                 </div>
                 <span>More</span>
              </div>
           </div>
        </div>

        <!-- ─── 2. Top Stats row ─── -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <div class="cf-card p-6 flex flex-col">
              <div class="cf-label mb-2">Total Deployed Projects</div>
              <div class="text-3xl font-bold text-slate-900" id="stat-projects">0</div>
              <div class="mt-4 text-[10px] text-slate-400 font-bold flex items-center gap-1">
                 <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ACTIVE INFRASTRUCTURE
              </div>
           </div>
           <div class="cf-card p-6 flex flex-col">
              <div class="cf-label mb-2">Success Rate (Last 24h)</div>
              <div class="flex items-end justify-between">
                 <div class="text-3xl font-bold cf-blue" id="stat-rate">0%</div>
                 <div class="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                    <div id="rate-bar" class="h-full cf-bg-blue transition-all duration-1000" style="width: 0%"></div>
                 </div>
              </div>
              <div class="mt-auto text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Reliability Index</div>
           </div>
           <div class="cf-card p-6 flex flex-col">
              <div class="cf-label mb-2">Total Deployments</div>
              <div class="text-3xl font-bold text-slate-900" id="stat-total">0</div>
              <div class="mt-4 flex items-center justify-between">
                 <span class="text-[10px] text-indigo-600 font-bold" id="stat-24h">+0 today</span>
                 <span class="text-[9px] text-slate-400 uppercase">System wide</span>
              </div>
           </div>
        </div>

        <!-- ─── 3. Main Monitoring Center (Super Tidy Redesign) ─── -->
        <div class="cf-card mb-8 overflow-hidden bg-white border-slate-200">
            <div class="p-6 border-b border-slate-100 flex items-center justify-between">
               <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-100/50">
                     <i data-lucide="activity" class="w-5 h-5"></i>
                  </div>
                  <div>
                     <h3 class="text-base font-bold text-slate-800 tracking-tight leading-none">Infrastructure Real-time Analytics</h3>
                     <p class="text-[11px] text-slate-400 mt-1.5 font-medium flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Service connectivity is optimal • <span id="last-update">Syncing...</span>
                     </p>
                  </div>
               </div>
               <div id="health-score-badge" class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all duration-500">
                  <span id="health-dot" class="w-2 h-2 rounded-full animate-pulse"></span>
                  <span class="opacity-70">Health Score:</span>
                  <span id="health-percent" class="font-black">100%</span>
               </div>
            </div>

            <!-- Enhanced Metric Blocks -->
            <div class="grid grid-cols-1 md:grid-cols-3 divide-x divide-slate-100 bg-slate-50/20 border-b border-slate-100">
               <!-- CPU -->
               <div class="p-6">
                  <div class="flex items-center justify-between mb-3">
                     <div class="flex items-center gap-2">
                        <i data-lucide="cpu" class="w-3.5 h-3.5 text-slate-400"></i>
                        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">CPU LOAD</span>
                     </div>
                     <div class="text-2xl font-black text-slate-800 tracking-tighter" id="cpu-usage">0%</div>
                  </div>
                  <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div id="cpu-bar" class="h-full cf-bg-blue transition-all duration-500" style="width: 0%"></div>
                  </div>
               </div>
               <!-- RAM -->
               <div class="p-6">
                  <div class="flex items-center justify-between mb-3">
                     <div class="flex items-center gap-2">
                        <i data-lucide="database" class="w-3.5 h-3.5 text-slate-400"></i>
                        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">RAM USAGE</span>
                     </div>
                     <div class="text-2xl font-black text-slate-800 tracking-tighter" id="ram-usage">0 GB</div>
                  </div>
                  <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div id="ram-bar" class="h-full bg-pink-500 transition-all duration-500" style="width: 0%"></div>
                  </div>
               </div>
               <!-- Disk -->
               <div class="p-6">
                  <div class="flex items-center justify-between mb-3">
                     <div class="flex items-center gap-2">
                        <i data-lucide="hard-drive" class="w-3.5 h-3.5 text-slate-400"></i>
                        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">STORAGE</span>
                     </div>
                     <div class="text-2xl font-black text-slate-800 tracking-tighter" id="disk-percent">0%</div>
                  </div>
                  <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div id="disk-bar" class="h-full bg-slate-400 transition-all duration-500" style="width: 0%"></div>
                  </div>
               </div>
            </div>
                             <div class="grid grid-cols-1 lg:grid-cols-4 border-t border-slate-100">
               <!-- Main Visualization -->
               <div class="lg:col-span-3 p-8">
                  <div class="flex items-center justify-between mb-8">
                     <div class="flex items-center gap-8">
                        <div class="flex items-center gap-2.5">
                           <span class="w-2.5 h-2.5 rounded-full cf-bg-blue shadow-sm shadow-blue-200"></span>
                           <span class="text-xs font-bold text-slate-600 uppercase tracking-tight">CPU Usage %</span>
                        </div>
                        <div class="flex items-center gap-2.5">
                           <span class="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-sm shadow-pink-200"></span>
                           <span class="text-xs font-bold text-slate-600 uppercase tracking-tight">RAM Usage %</span>
                        </div>
                     </div>
                     <div class="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded border border-slate-100">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Feed</span>
                     </div>
                  </div>
                  <div class="cf-chart-container h-[360px] relative">
                     <canvas id="infra-chart"></canvas>
                  </div>
               </div>

               <!-- Right Details Panel -->
               <div class="p-8 bg-slate-50/50 border-l border-slate-100 flex flex-col gap-8">
                  <!-- Section: System -->
                  <div>
                    <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">System Identity</h4>
                    <div class="space-y-4">
                       <div class="flex items-start gap-3">
                          <div class="mt-1"><i data-lucide="monitor" class="w-3.5 h-3.5 text-slate-400"></i></div>
                          <div>
                             <p class="text-xs font-bold text-slate-700 leading-tight" id="sys-os">-</p>
                             <p class="text-[10px] text-slate-400 font-medium mt-0.5">OS Platform</p>
                          </div>
                       </div>
                       <div class="flex items-start gap-3">
                          <div class="mt-1"><i data-lucide="shield" class="w-3.5 h-3.5 text-slate-400"></i></div>
                          <div class="overflow-hidden">
                             <p class="text-xs font-bold text-slate-700 leading-tight truncate w-32" id="sys-cpu" title="CPU">-</p>
                             <p class="text-[10px] text-slate-400 font-medium mt-0.5">Architecture</p>
                          </div>
                       </div>
                    </div>
                  </div>

                  <!-- Section: Runtime -->
                  <div class="pt-6 border-t border-slate-200/50">
                    <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Runtime Engine</h4>
                    <div class="grid grid-cols-2 gap-4 mb-5">
                       <div>
                          <p class="text-xs font-bold text-slate-700" id="sys-php">-</p>
                          <p class="text-[10px] text-slate-400 font-medium mt-0.5">PHP Ver.</p>
                       </div>
                       <div>
                          <p class="text-xs font-bold text-slate-700 truncate" id="sys-mysql">-</p>
                          <p class="text-[10px] text-slate-400 font-medium mt-0.5">MySQL</p>
                       </div>
                    </div>
                    <div class="p-3 bg-white rounded-lg border border-slate-200/60 shadow-sm">
                       <div class="flex items-center justify-between mb-1.5">
                          <span class="text-[10px] font-bold text-slate-500">Memory Peak</span>
                          <span class="text-[10px] font-black text-indigo-600" id="php-peak">-</span>
                       </div>
                       <div class="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                          <div class="bg-indigo-500 h-full" style="width: 40%"></div>
                       </div>
                       <p class="text-[9px] text-slate-400 mt-1.5 font-medium">Limit: <span id="php-limit">-</span></p>
                    </div>
                  </div>

                  <!-- Section: Lifecycle -->
                  <div class="pt-6 border-t border-slate-200/50">
                    <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Life Cycle</h4>
                    <div class="space-y-3.5">
                       <div class="flex items-center justify-between">
                          <span class="text-[11px] font-medium text-slate-500">Host Uptime</span>
                          <span class="text-[11px] font-bold text-slate-700" id="sys-uptime">0s</span>
                       </div>
                       <div class="flex items-center justify-between">
                          <span class="text-[11px] font-medium text-slate-500">DB Uptime</span>
                          <span class="text-[11px] font-bold text-slate-700" id="db-uptime">0s</span>
                       </div>
                       <div class="flex items-center justify-between">
                          <span class="text-[11px] font-medium text-slate-500">Connections</span>
                          <span class="text-[11px] font-bold text-slate-800" id="db-conns">0</span>
                       </div>
                    </div>
                  </div>

                  <div class="mt-auto pt-6 border-t border-slate-200/50">
                     <button id="refresh-diagnostics" class="w-full py-2 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-500 border border-slate-200 rounded transition-colors uppercase tracking-wider active:scale-[0.98]">
                        Refresh Diagnostics
                     </button>
                  </div>
               </div>
            </div>
        </div>

        <!-- ─── 4. Details Grid ─── -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <!-- Active Workspaces -->
           <div class="lg:col-span-2 flex flex-col gap-4">
              <div class="flex items-center justify-between">
                 <h3 class="text-sm font-bold text-slate-800 uppercase tracking-tight">Active Workspaces</h3>
                 <a href="#projects" class="cf-blue text-xs font-bold hover:underline">Manage All Projects ›</a>
              </div>
              <div id="projects-list" class="flex flex-col gap-0.5 border border-slate-100 rounded overflow-hidden">
                 <!-- List Injection -->
              </div>
           </div>

           <!-- Recent Activity -->
           <div class="flex flex-col gap-4">
              <div class="flex items-center justify-between">
                 <h3 class="text-sm font-bold text-slate-800 uppercase tracking-tight">Recent Activity Log</h3>
                 <a href="#logs" class="cf-blue text-xs font-bold hover:underline">Full Log ›</a>
              </div>
              <div class="cf-card p-0 overflow-hidden">
                 <div id="activity-list" class="flex flex-col divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
                    <!-- Activity Injection -->
                 </div>
              </div>
           </div>
        </div>
      </div>
    `;

    this.init();
    
    // Add Refresh Diagnostics Handler
    const refreshBtn = document.getElementById('refresh-diagnostics');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        const icon = refreshBtn.querySelector('i');
        refreshBtn.classList.add('opacity-50');
        const res = await Api.get('monitoring');
        if (res?.success) this.updateMonitorCharts(res.data);
        setTimeout(() => refreshBtn.classList.remove('opacity-50'), 500);
      });
    }
  },

  async init() {
    const [dashRes, analyticsRes, contribRes] = await Promise.all([
      Api.get('dashboard'),
      Api.get('analytics'),
      Api.get(`analytics?action=contributions&year=${this.currentYear || 'last_year'}`)
    ]);

    if (!dashRes?.success) return;

    const { stats, recent, projects } = dashRes.data;

    // 1. Stats
    this.setElText('stat-projects', projects.length);
    this.setElText('stat-rate', stats.success_rate + '%');
    this.setElStyle('rate-bar', 'width', stats.success_rate + '%');
    this.setElText('stat-total', stats.total);
    this.setElText('stat-24h', `+${stats.logs_24h} today`);
    this.setLastUpdate();

    // 1c. System Info
    if (dashRes.data.system) {
      const sys = dashRes.data.system;
      this.setElText('sys-os', sys.os);
      this.setElText('sys-cpu', sys.cpu);
      const cpuEl = document.getElementById('sys-cpu');
      if (cpuEl) cpuEl.title = sys.cpu;
      this.setElText('sys-php', sys.php);
      this.setElText('sys-mysql', sys.mysql);
    }

    // 1b. Heatmap
    if (contribRes?.success) {
      this.renderContributionGraph(contribRes.data);
      this.renderYearSelector(contribRes.data);
    }

    // 2. Monitoring
    this.initInfraChart();
    this.startPolling();

    // 3. Render Projects List
    const projList = document.getElementById('projects-list');
    if (projList) {
      projList.innerHTML = projects.slice(0, 8).map(p => `
          <div class="flex items-center justify-between p-4 bg-white border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group">
             <div class="flex items-center gap-4">
                <div class="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                  ${p.name.charAt(0)}
                </div>
                <div>
                   <div class="text-xs font-bold text-slate-800 group-hover:cf-blue transition-colors cursor-pointer" onclick="location.hash='#git?project_id=${p.id}'">${p.name}</div>
                   <div class="text-[10px] text-slate-400 font-mono mt-0.5">${p.branch || 'main'}</div>
                </div>
             </div>
             <div class="flex items-center gap-10">
                <div class="text-right">
                   <div class="text-[9px] font-bold text-slate-300 uppercase">Status</div>
                   ${this.getStatusBadge(p.last_status)}
                </div>
                <div class="text-right w-32">
                   <div class="text-[9px] font-bold text-slate-300 uppercase">Updated</div>
                   <div class="text-[10px] font-bold text-slate-600">${this.formatTime(p.last_deploy)}</div>
                </div>
                 <div class="flex gap-2 group-hover:opacity-100 opacity-0 transition-opacity">
                    <button onclick="event.stopPropagation(); PageDashboard.quickBackup(${p.id}, '${p.name}')" class="text-xs font-bold text-emerald-500 p-1 hover:bg-emerald-50 rounded" title="Quick Backup DB">🗄️</button>
                    <a href="#git?project_id=${p.id}" class="text-xs font-bold cf-blue p-1 hover:bg-blue-50 rounded" title="Settings">⚙️</a>
                 </div>
             </div>
          </div>
       `).join('');
    }

    // 4. Render Activity List
    const activityList = document.getElementById('activity-list');
    if (activityList) {
      activityList.innerHTML = recent.map(log => `
          <div class="p-3.5 hover:bg-slate-50 transition-colors">
             <div class="flex justify-between items-start mb-1">
                <span class="text-[10px] font-bold text-slate-800 truncate pr-4">${log.project_name || 'System'}</span>
                <span class="text-[9px] text-slate-400 font-bold whitespace-nowrap">${this.formatTime(log.created_at)}</span>
             </div>
             <div class="flex items-center justify-between">
                <span class="text-[9px] font-medium text-slate-500 uppercase tracking-widest">${log.triggered_by} update</span>
                <span class="text-[9px] font-black ${log.status === 'success' ? 'text-emerald-500' : 'text-rose-500'} uppercase">
                  ${log.status}
                </span>
             </div>
          </div>
       `).join('');
    }
    // 6. Refresh Icons
    if (window.lucide) lucide.createIcons();
  },

  initInfraChart() {
    const canvas = document.getElementById('infra-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    this.infraChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Array(30).fill(''),
        datasets: [
          {
            label: 'CPU',
            data: Array(30).fill(0),
            borderColor: '#0051c3',
            borderWidth: 2,
            backgroundColor: 'transparent',
            pointRadius: 0,
            tension: 0.1
          },
          {
            label: 'RAM',
            data: Array(30).fill(0),
            borderColor: '#ec4899',
            borderWidth: 1.5,
            borderDash: [4, 4],
            backgroundColor: 'transparent',
            pointRadius: 0,
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          y: { beginAtZero: true, max: 100, grid: { color: '#f1f5f9' }, ticks: { font: { size: 9 }, color: '#94a3b8' } },
          x: { display: false }
        },
        animation: { duration: 0 }
      }
    });
  },

  async startPolling() {
    if (window.monitorInterval) clearInterval(window.monitorInterval);
    const poll = async () => {
      if (!document.getElementById('infra-chart')) {
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
    if (!this.infraChart) return;

    const cpuArr = this.infraChart.data.datasets[0].data;
    cpuArr.shift(); cpuArr.push(data.cpu);

    const ramArr = this.infraChart.data.datasets[1].data;
    ramArr.shift(); ramArr.push(data.ram.percent);

    this.infraChart.update();

    this.setElText('cpu-usage', data.cpu + '%');
    this.setElStyle('cpu-bar', 'width', data.cpu + '%');

    this.setElText('ram-usage', `${data.ram.used} GB`);
    this.setElStyle('ram-bar', 'width', data.ram.percent + '%');

    if (data.disk) {
      this.setElText('disk-percent', data.disk.percent + '%');
      this.setElStyle('disk-bar', 'width', data.disk.percent + '%');
    }

    if (data.uptime !== undefined) {
      this.setElText('sys-uptime', this.formatUptime(data.uptime));
    }

    if (data.db_connections !== undefined) {
      this.setElText('db-conns', data.db_connections);
    }

    if (data.db_uptime !== undefined) {
      this.setElText('db-uptime', this.formatUptime(data.db_uptime));
    }

    if (data.php) {
       this.setElText('php-limit', data.php.memory_limit);
       this.setElText('php-peak', data.php.memory_peak + ' MB');
    }

    this.updateHealthScore(data);
    this.setLastUpdate();
  },

  setLastUpdate() {
    const now = new Date();
    const options = { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    };
    this.setElText('last-update', now.toLocaleString('id-ID', options) + ' WIB');
  },

  formatUptime(seconds) {
    if (seconds === 0) return 'Just started';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    let parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 && d === 0) parts.push(`${s}s`);
    
    return parts.join(' ') || '0s';
  },

  updateHealthScore(data) {
    const cpu = data.cpu || 0;
    const ram = data.ram?.percent || 0;
    const disk = data.disk?.percent || 0;

    // Weighted Health Formula
    let score = 100 - (cpu * 0.4 + ram * 0.4 + disk * 0.2);
    score = Math.max(0, Math.min(100, Math.round(score)));

    const badge = document.getElementById('health-score-badge');
    const text = document.getElementById('health-percent');
    const dot = document.getElementById('health-dot');

    if (!badge || !text || !dot) return;

    text.textContent = score + '%';

    // Color Logic
    const baseClass = 'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all duration-500';
    
    if (score > 85) {
      badge.className = `${baseClass} bg-emerald-50 text-emerald-600 border border-emerald-100`;
      dot.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse';
    } else if (score > 60) {
      badge.className = `${baseClass} bg-amber-50 text-amber-600 border border-amber-100`;
      dot.className = 'w-2 h-2 rounded-full bg-amber-500 animate-pulse';
    } else {
      badge.className = `${baseClass} bg-rose-50 text-rose-600 border border-rose-100`;
      dot.className = 'w-2 h-2 rounded-full bg-rose-500 animate-pulse';
    }
  },

  getStatusBadge(status) {
    if (status === 'success') return '<span class="text-[9px] font-bold text-emerald-600 uppercase">Healthy</span>';
    if (status === 'failed') return '<span class="text-[9px] font-bold text-rose-600 uppercase">Failed</span>';
    if (status === 'running') return '<span class="text-[9px] font-bold text-amber-600 uppercase animate-pulse">Updating</span>';
    return '<span class="text-[9px] font-bold text-slate-300 uppercase">Inactive</span>';
  },

  setElText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; },
  setElStyle(id, prop, val) { const el = document.getElementById(id); if (el) el.style[prop] = val; },

  renderContributionGraph(data) {
    const container = document.getElementById('contribution-heatmap-container');
    if (!container) return;

    this.setElText('total-contributions', `${data.daily_total} deployments`);

    const heatmap = data.contributions;
    const now     = new Date();
    const days    = [];
    
    // Determine start and end dates based on filter
    let startDate, endDate;
    
    if (data.year === 'last_year') {
      startDate = new Date();
      startDate.setFullYear(now.getFullYear() - 1);
      startDate.setDate(startDate.getDate() - startDate.getDay()); 
      endDate = now;
    } else {
      const yearInt = parseInt(data.year);
      startDate = new Date(yearInt, 0, 1);
      startDate.setDate(startDate.getDate() - startDate.getDay()); // Standardize to Sun start
      endDate = new Date(yearInt, 11, 31);
    }

    // Fill days list
    let current = new Date(startDate);
    while (current <= endDate || days.length % 7 !== 0) {
      const dateStr = current.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        count: heatmap[dateStr] || 0,
        dayOfWeek: current.getDay(),
        month: current.getMonth(),
        label: current.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      });
      current.setDate(current.getDate() + 1);
      if (days.length > 500) break; // safety
    }

    // Generate weeks
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    const getLevel = (count) => {
      if (count === 0) return 'level-0';
      if (count < 3) return 'level-1';
      if (count < 6) return 'level-2';
      if (count < 10) return 'level-3';
      return 'level-4';
    };

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Header with months
    let headerHtml = '<div class="contribution-months">';
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      const firstDay = week[0];
      const date = new Date(firstDay.date);
      const month = date.getMonth();
      if (month !== lastMonth) {
        headerHtml += `<span style="grid-column: ${i + 1}">${monthNames[month]}</span>`;
        lastMonth = month;
      }
    });
    headerHtml += '</div>';

    let html = `<div class="contribution-heatmap">
      <div class="contribution-column-header">
        ${headerHtml}
        <div class="contribution-body">
          <div class="contribution-days-labels">
            <span>Mon</span><span>Wed</span><span>Fri</span>
          </div>
          <div class="contribution-grid">`;
    
    weeks.forEach(week => {
      html += `<div class="contribution-week">`;
      week.forEach(day => {
        html += `<div class="contribution-day ${getLevel(day.count)}" 
                      title="${day.count} deployments on ${day.label}"></div>`;
      });
      html += `</div>`;
    });
    
    html += `</div></div></div></div>`;
    container.innerHTML = html;

    // Trigger Lucide refreshes if icons are used (none here but good practice)
    if (window.lucide) lucide.createIcons();
  },

  renderYearSelector(data) {
    const list = document.getElementById('contribution-year-selector');
    if (!list) return;

    const currentYear = data.year;
    const years = ['last_year', ...data.available_years];
    
    list.innerHTML = years.map(y => `
      <button class="contribution-year-btn ${y == currentYear ? 'active' : ''}" 
              data-year="${y}">
        ${y === 'last_year' ? 'Last Year' : y}
      </button>
    `).join('');

    list.querySelectorAll('.contribution-year-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const year = btn.dataset.year;
        if (year === this.currentYear) return;
        
        this.currentYear = year;
        // Show loader
        document.getElementById('contribution-heatmap-container').innerHTML = `
          <div class="flex items-center justify-center py-8">
            <div class="spinner w-6 h-6 border-2"></div>
          </div>`;
        
        const res = await Api.get(`analytics?action=contributions&year=${year}`);
        if (res?.success) {
          this.renderContributionGraph(res.data);
          this.renderYearSelector(res.data);
        }
      });
    });
  },

  formatTime(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const diff = Math.floor((new Date() - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
  },

  async quickBackup(id, name) {
    if (this.isBackingUp) return;
    this.isBackingUp = true;
    
    // Toast is usually global in this app or available via Swal
    if (window.Toast) window.Toast.info(`Memulai backup database ${name}...`);
    else if (window.Swal) Swal.fire({ title: 'Backup', text: `Memulai backup database ${name}...`, icon: 'info', timer: 2000, showConfirmButton: false });

    try {
      const res = await Api.post('backup', { action: 'project_save', id });
      if (res?.success) {
        if (window.Swal) {
          Swal.fire({
            title: 'Berhasil',
            text: `Backup ${name} selesai.`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        }
      } else {
        if (window.Swal) Swal.fire('Gagal', res?.message || 'Gagal melakukan backup', 'error');
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.isBackingUp = false;
    }
  }
};

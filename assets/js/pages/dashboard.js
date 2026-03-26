import { Api } from "../api.js";

export const PageDashboard = {
  async render(params) {
    const view = document.getElementById('page-view');
    view.innerHTML = `
      <div class="fade-in-up">
        <div class="flex items-center justify-between mb-10">
          <div>
            <h2 class="text-2xl font-bold tracking-tight text-primary">Dashboard Overview</h2>
            <p class="text-muted text-sm">Monitor seluruh aktivitas deployment dan kesehatan sistem Anda.</p>
          </div>
          <div class="flex gap-2">
            <div id="last-update" class="text-xs text-muted font-bold bg-white px-4 py-2 rounded-full border shadow-sm">
              Memuat data...
            </div>
          </div>
        </div>
        
        <!-- ─── Premium Stats Grid (Vibrant Mesh) ─── -->
        <div class="grid-4 mb-10">
          <div class="stat-card-premium h-full flex flex-col justify-between bg-mesh-green shine hover-glow-green border-0 shadow-md">
            <div class="stat-label uppercase tracking-widest text-[10px] font-bold text-success mb-1">App Availability</div>
            <div class="flex items-end gap-2">
              <div class="text-3xl font-bold text-success" id="stat-health-up">0</div>
              <div class="text-sm text-muted mb-1">Online</div>
              <div class="text-3xl font-bold text-danger ml-2" id="stat-health-down">0</div>
              <div class="text-sm text-muted mb-1">Offline</div>
            </div>
            <p class="text-[10px] text-muted mt-2 uppercase tracking-tighter">Real-time applications status</p>
          </div>

          <div class="stat-card-premium h-full flex flex-col justify-between bg-mesh-blue shine hover-glow-blue border-0 shadow-md">
            <div class="icon-bg text-blue-500">📊</div>
            <div class="stat-label uppercase tracking-widest text-[10px] font-bold text-blue-600 mb-1">Success Rate</div>
            <div class="flex items-center gap-4">
              <div class="text-3xl font-bold text-blue-700" id="stat-rate">0%</div>
              <div class="donut-container">
                <svg viewBox="0 0 36 36" class="w-10 h-10">
                  <path class="text-blue-100" stroke-width="3" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path id="donut-segment" class="text-blue-500" stroke-width="3" stroke-dasharray="0, 100" stroke-linecap="round" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
              </div>
            </div>
          </div>

          <div class="stat-card-premium h-full flex flex-col justify-between bg-mesh-orange shine hover-glow-orange border-0 shadow-md">
            <div class="icon-bg text-orange-500">🚀</div>
            <div class="stat-label uppercase tracking-widest text-[10px] font-bold text-orange-600 mb-1">Total Deploys</div>
            <div class="text-3xl font-bold text-orange-700" id="stat-total">0</div>
            <p class="text-xs text-muted mt-2"><span class="text-orange-600 font-bold" id="stat-24h">0</span> in last 24h</p>
          </div>

          <div class="stat-card-premium h-full flex flex-col justify-between bg-mesh-indigo shine hover-glow-indigo border-0 shadow-md">
            <div class="icon-bg text-indigo-500">⚓</div>
            <div class="stat-label uppercase tracking-widest text-[10px] font-bold text-indigo-600 mb-1">Incoming Traffic</div>
            <div class="text-3xl font-bold text-indigo-700" id="stat-webhook">0</div>
            <div class="flex items-center gap-1 mt-2">
              <div class="w-full bg-indigo-50 h-1.5 rounded-full overflow-hidden">
                <div id="bar-webhook" class="bg-indigo-500 h-full" style="width: 0%"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- ─── Row 1: System Health & Diagnostics (Symmetrical Grid-3) ─── -->
        <div class="mb-10">
          <div class="flex items-center gap-2 mb-5">
            <span class="w-2 h-6 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]"></span>
            <h3 class="text-base font-bold text-primary tracking-tight">System Infrastructure Health</h3>
          </div>
          <div class="grid-3 gap-6 items-stretch">
            <div class="card p-6 h-full flex flex-col card-accent-blue hover-glow-blue border-0 shadow-md transition-all">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-[10px] font-bold uppercase tracking-widest text-muted">CPU Real-time</h3>
                <div id="cpu-value" class="text-sm font-bold text-indigo-600">0%</div>
              </div>
              <div class="flex-1 min-h-140 relative">
                <canvas id="cpu-chart"></canvas>
              </div>
            </div>

            <div class="card p-6 h-full flex flex-col card-accent-blue hover-glow-blue border-0 shadow-md transition-all">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-[10px] font-bold uppercase tracking-widest text-muted">RAM Performance</h3>
                <div id="ram-value" class="text-[10px] text-muted font-medium">0/0 GB</div>
              </div>
              <div class="flex-1 min-h-140 relative">
                <canvas id="ram-chart"></canvas>
              </div>
            </div>

            <div class="card p-6 h-full flex flex-col card-accent-green hover-glow-green border-0 shadow-md transition-all">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-[10px] font-bold uppercase tracking-widest text-muted">App Stability Index</h3>
                <div class="flex items-center gap-2 text-[9px] font-bold">
                  <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-success"></span> Success</span>
                  <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-danger"></span> Failed</span>
                </div>
              </div>
              <div class="flex-1 min-h-140 relative">
                <canvas id="stability-chart"></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- ─── Row 2: Workspace & Operations (Integrated 2/3 + 1/3) ─── -->
        <div>
          <div class="grid-3 gap-6 items-stretch">
            
            <!-- Column: Workspace (2/3) -->
            <div class="col-span-2 flex flex-col gap-10">
              <section>
                <div class="flex items-center justify-between mb-5">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-6 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(246,130,31,0.5)]"></span>
                    <h3 class="text-base font-bold text-primary tracking-tight">Active Workspaces</h3>
                  </div>
                  <a href="#projects" class="text-xs text-primary font-bold hover:underline transition-all ring-1 ring-orange-100 px-3 py-1 rounded-full bg-orange-50">Manage All ›</a>
                </div>
                
                <div id="projects-grid" class="grid-2 gap-6">
                  <!-- Project Cards Injected via JS -->
                </div>
              </section>

              <section>
                <div class="flex items-center gap-2 mb-4">
                  <span class="w-1.5 h-4 bg-gray-300 rounded-full"></span>
                  <h3 class="text-[10px] font-bold uppercase tracking-widest text-muted">Deployment Velocity (Weekly)</h3>
                </div>
                <div class="card p-6 card-accent-indigo border-0 shadow-md">
                  <div class="h-[140px] relative">
                    <canvas id="frequency-chart"></canvas>
                  </div>
                </div>
              </section>
            </div>

            <!-- Column: Activity Timeline (1/3) -->
            <div class="col-span-1">
              <div class="flex items-center gap-2 mb-5">
                <span class="w-2 h-6 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]"></span>
                <h3 class="text-base font-bold text-primary tracking-tight">Live Activity Stream</h3>
              </div>
              <div class="card p-6 pt-7 h-full min-h-[500px] flex flex-col card-accent-indigo border-0 shadow-md">
                <div id="activity-timeline" class="timeline flex-1">
                  <!-- Recent Activity Injected via JS -->
                </div>
                <div class="mt-8 pt-4 border-t text-center">
                  <a href="#logs" class="text-xs text-primary font-bold hover:underline py-2 block bg-indigo-50 rounded-lg border border-indigo-100">See Full Audit History ›</a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    `;

    this.init();
  },

  async init() {
    // Parallel fetch for better performance
    const [dashRes, analyticsRes] = await Promise.all([
      Api.get('dashboard'),
      Api.get('analytics')
    ]);

    if (!dashRes?.success) {
      document.getElementById('page-view').innerHTML = `<div class="alert alert-error">Gagal memuat dashboard: ${dashRes?.message}</div>`;
      return;
    }

    const { stats, recent, projects } = dashRes.data;

    // 1. Update Stats - Safely
    this.setElText('stat-total', stats.total);
    this.setElText('stat-rate', stats.success_rate + '%');
    this.setElText('stat-24h', stats.logs_24h);
    this.setElText('stat-webhook', stats.sources.webhook);
    this.setElText('stat-health-up', stats.health.up);
    this.setElText('stat-health-down', stats.health.down);

    // Donut visualization
    const donutSegment = document.getElementById('donut-segment');
    if (donutSegment) {
      donutSegment.setAttribute('stroke-dasharray', `${stats.success_rate}, 100`);
    }

    // Progress bar
    const totalSource = (stats.sources.webhook + stats.sources.manual) || 1;
    this.setElStyle('bar-webhook', 'width', (stats.sources.webhook / totalSource * 100) + '%');

    this.setElText('last-update', 'Last update: ' + new Date().toLocaleTimeString());

    // 2. Render Charts if analytics data available
    if (analyticsRes?.success) {
      this.renderCharts(analyticsRes.data);
    }

    // 3. Start Server Monitoring (Real-time)
    this.initMonitorCharts();
    this.startPolling();

    // 3. Render Projects Grid
    const projGrid = document.getElementById('projects-grid');
    if (projGrid) {
      if (projects.length === 0) {
        projGrid.innerHTML = `<div class="col-span-full py-10 text-center text-muted">No projects found. Add your first project to monitor it here.</div>`;
      } else {
        projGrid.innerHTML = projects.map(p => `
        <div class="card p-6 h-full flex flex-col card-accent-orange hover-glow-orange border-0 shadow-md transition-all">
          <div class="flex justify-between items-start mb-4">
            <div>
              <div class="font-bold text-sm truncate max-w-[140px] flex items-center gap-1">
                ${p.name}
                ${p.app_url ? `<span class="opacity-50 text-[10px]">🔗</span>` : ''}
              </div>
              <div class="text-[10px] font-mono text-muted uppercase mt-0.5">${p.branch || 'main'}</div>
            </div>
            <div class="flex gap-1.5 items-center">
              ${p.app_url ? this.getHealthDot(p.health_status) : ''}
              ${this.getStatusBadge(p.last_status)}
            </div>
          </div>
          
          <div class="bg-orange-50 rounded-md p-3 mb-4 flex-1 flex flex-col justify-center border border-orange-100/50">
            <div class="text-[9px] text-orange-600 uppercase font-bold tracking-tighter mb-1">Last Deployment</div>
            <div class="flex justify-between items-end">
              <div class="text-xs font-medium truncate text-orange-900">${p.last_deploy || 'Never'}</div>
              ${p.health_time ? `<div class="text-[10px] text-orange-400 font-mono">${(p.health_time * 1000).toFixed(0)}ms</div>` : ''}
            </div>
          </div>

          <div class="flex gap-2">
            <a href="#git?project_id=${p.id}" class="btn btn-ghost btn-xs flex-1 justify-center py-1">Git</a>
            <a href="#logs?project_id=${p.id}" class="btn btn-primary btn-xs flex-1 justify-center py-1">Logs</a>
          </div>
        </div>
      `).join('');
      }
    }

    // 3. Render Timeline
    const timeline = document.getElementById('activity-timeline');
    if (timeline) {
      if (recent.length === 0) {
        timeline.innerHTML = `<div class="text-center text-muted text-sm py-4">No recent activity.</div>`;
      } else {
        timeline.innerHTML = recent.map(log => `
        <div class="timeline-item">
          <div class="timeline-dot ${log.status === 'success' ? 'success' : log.status === 'failed' ? 'failed' : 'running'}"></div>
          <div class="timeline-content">
            <span class="timeline-time">${this.formatTime(log.created_at)}</span>
            <div class="text-xs">
              <span class="font-bold">${log.project_name || 'N/A'}</span> 
              <span class="text-muted">deployed via</span>
              <span class="font-medium text-primary">${log.triggered_by}</span>
            </div>
            ${log.commit_hash ? `<div class="text-[10px] font-mono text-muted mt-1 truncate">#${log.commit_hash.substring(0,7)}</div>` : ''}
          </div>
        </div>
      `).join('');
      }
    }
  },

  renderCharts(data) {
    // 1. Stability Index Chart (Vibrant Stacked Bar)
    const elStab = document.getElementById('stability-chart');
    if (!elStab) return;
    const ctxStab = elStab.getContext('2d');
    new Chart(ctxStab, {
      type: 'bar',
      data: {
        labels: data.stability.map(s => {
          const d = new Date(s.date);
          return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }),
        datasets: [
          {
            label: 'Success',
            data: data.stability.map(s => s.success),
            backgroundColor: '#10b981',
            borderRadius: 6,
            barThickness: 12
          },
          {
            label: 'Failed',
            data: data.stability.map(s => s.failed),
            backgroundColor: '#ef4444',
            borderRadius: 6,
            barThickness: 12
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { stacked: true, display: false },
          x: { stacked: true, display: false }
        }
      }
    });

    // 2. Deployment Velocity Chart (Vibrant Line with Gradient)
    const elFreq = document.getElementById('frequency-chart');
    if (!elFreq) return;
    const ctxFreq = elFreq.getContext('2d');
    const freqGradient = ctxFreq.createLinearGradient(0, 0, 0, 140);
    freqGradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
    freqGradient.addColorStop(1, 'rgba(99, 102, 241, 0.05)');

    new Chart(ctxFreq, {
      type: 'line',
      data: {
        labels: data.frequency.map(f => f.project_name),
        datasets: [{
          label: 'Deploys',
          data: data.frequency.map(f => f.deploy_count),
          borderColor: '#6366f1',
          borderWidth: 3,
          backgroundColor: freqGradient,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#6366f1',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 10 } } },
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.03)' }, ticks: { color: '#9ca3af', font: { size: 10 } } }
        }
      }
    });
  },

  initMonitorCharts() {
    const sharedOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 100, display: false },
        x: { display: false }
      },
      animation: { duration: 0 }
    };

    // CPU Chart - Vibrant Indigo with Shadow Gradient
    const elCpu = document.getElementById('cpu-chart');
    if (!elCpu) return;
    const cpuCtx = elCpu.getContext('2d');
    const cpuGradiant = cpuCtx.createLinearGradient(0, 0, 0, 140);
    cpuGradiant.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
    cpuGradiant.addColorStop(1, 'rgba(99, 102, 241, 0)');

    this.cpuChart = new Chart(cpuCtx, {
      type: 'line',
      data: {
        labels: Array(20).fill(''),
        datasets: [{
          data: Array(20).fill(0),
          borderColor: '#6366f1',
          borderWidth: 2.5,
          backgroundColor: cpuGradiant,
          fill: true,
          pointRadius: 0,
          tension: 0.4
        }]
      },
      options: sharedOptions
    });

    // RAM Chart - Vibrant Pink with Shadow Gradient
    const elRam = document.getElementById('ram-chart');
    if (!elRam) return;
    const ramCtx = elRam.getContext('2d');
    const ramGradiant = ramCtx.createLinearGradient(0, 0, 0, 140);
    ramGradiant.addColorStop(0, 'rgba(236, 72, 153, 0.3)');
    ramGradiant.addColorStop(1, 'rgba(236, 72, 153, 0)');

    this.ramChart = new Chart(ramCtx, {
      type: 'line',
      data: {
        labels: Array(20).fill(''),
        datasets: [{
          data: Array(20).fill(0),
          borderColor: '#ec4899',
          borderWidth: 2.5,
          backgroundColor: ramGradiant,
          fill: true,
          pointRadius: 0,
          tension: 0.4
        }]
      },
      options: { ...sharedOptions, scales: { ...sharedOptions.scales, y: { ...sharedOptions.scales.y, max: undefined } } }
    });
  },

  async startPolling() {
    // Clear existing interval if any
    if (window.monitorInterval) clearInterval(window.monitorInterval);

    const poll = async () => {
      // Direct health check of DOM to stop polling if navigating away
      if (!document.getElementById('cpu-chart')) {
        clearInterval(window.monitorInterval);
        return;
      }

      const res = await Api.get('monitoring');
      if (res?.success) {
        this.updateMonitorCharts(res.data);
      }
    };

    poll(); // Initial call
    window.monitorInterval = setInterval(poll, 5000);
  },

  updateMonitorCharts(data) {
    if (!this.cpuChart || !this.ramChart) return;

    // Update CPU
    const cpuData = this.cpuChart.data.datasets[0].data;
    cpuData.shift();
    cpuData.push(data.cpu);
    this.cpuChart.update();
    this.setElText('cpu-value', data.cpu + '%');

    // Update RAM
    const ramData = this.ramChart.data.datasets[0].data;
    ramData.shift();
    ramData.push(data.ram.percent);
    this.ramChart.update();
    this.setElText('ram-value', `${data.ram.used} / ${data.ram.total} GB (${data.ram.percent}%)`);
  },

  // Helper for safe UI updates
  setElText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  },

  setElStyle(id, prop, val) {
    const el = document.getElementById(id);
    if (el) el.style[prop] = val;
  },

  getStatusBadge(status) {
    if (status === 'success') return '<span class="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(22,163,74,0.4)]"></span>';
    if (status === 'failed')  return '<span class="w-2 h-2 rounded-full bg-danger shadow-[0_0_8px_rgba(220,38,38,0.4)]"></span>';
    if (status === 'running') return '<span class="w-2 h-2 rounded-full bg-info animate-pulse"></span>';
    return '<span class="w-2 h-2 rounded-full bg-gray-300"></span>';
  },

  getHealthDot(status) {
    if (status === 'up') return '<span class="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(22,163,74,0.4)]" title="Online"></span>';
    if (status === 'down') return '<span class="w-2 h-2 rounded-full bg-danger shadow-[0_0_8px_rgba(220,38,38,0.4)]" title="Offline"></span>';
    return '<span class="w-2 h-2 rounded-full bg-gray-300" title="No data"></span>';
  },

  formatTime(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

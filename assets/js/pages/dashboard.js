import { Api } from "../api.js";

export const PageDashboard = {
  async render(params) {
    const view = document.getElementById('page-view');
    view.innerHTML = `
      <div class="fade-in-up">
        <!-- ─── Header Section ─── -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
            <p class="text-muted text-sm">Monitor seluruh aktivitas deployment dan kesehatan sistem Anda.</p>
          </div>
          <div class="flex gap-2">
            <div id="last-update" class="text-xs text-muted font-medium bg-white px-3 py-1.5 rounded-full border">
              Memuat data...
            </div>
          </div>
        </div>

        <!-- ─── Premium Stats Grid ─── -->
        <div class="grid-4 mb-8">
          <div class="stat-card-premium">
            <div class="icon-bg">🚀</div>
            <div class="stat-label uppercase tracking-widest text-[10px] font-bold text-muted mb-1">Total Deploys</div>
            <div class="text-3xl font-bold" id="stat-total">0</div>
            <p class="text-xs text-muted mt-2"><span class="text-success font-bold" id="stat-24h">0</span> dalam 24 jam terakhir</p>
          </div>

          <div class="stat-card-premium">
            <div class="icon-bg">📊</div>
            <div class="stat-label uppercase tracking-widest text-[10px] font-bold text-muted mb-1">Success Rate</div>
            <div class="flex items-center gap-4">
              <div class="text-3xl font-bold" id="stat-rate">0%</div>
              <div class="donut-container">
                <svg viewBox="0 0 36 36" class="w-12 h-12">
                  <path class="text-gray-100" stroke-width="3" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path id="donut-segment" class="text-success" stroke-width="3" stroke-dasharray="0, 100" stroke-linecap="round" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
              </div>
            </div>
          </div>

          <div class="stat-card-premium">
            <div class="icon-bg">⚓</div>
            <div class="stat-label uppercase tracking-widest text-[10px] font-bold text-muted mb-1">Webhook Deploys</div>
            <div class="text-3xl font-bold" id="stat-webhook">0</div>
            <div class="flex items-center gap-1 mt-2">
              <div class="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div id="bar-webhook" class="bg-indigo-500 h-full" style="width: 0%"></div>
              </div>
            </div>
          </div>

          <div class="stat-card-premium">
            <div class="icon-bg">⌨</div>
            <div class="stat-label uppercase tracking-widest text-[10px] font-bold text-muted mb-1">Manual Deploys</div>
            <div class="text-3xl font-bold" id="stat-manual">0</div>
            <div class="flex items-center gap-1 mt-2">
              <div class="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div id="bar-manual" class="bg-orange-500 h-full" style="width: 0%"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid-3 gap-8 items-start">
          <!-- ─── Projects Monitoring (Left & Center) ─── -->
          <div class="col-span-2">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-bold flex items-center gap-2">
                <span class="w-2 h-6 bg-orange-500 rounded-full"></span>
                Active Projects
              </h3>
              <a href="#projects" class="text-xs text-primary font-bold hover:underline">Manage All ›</a>
            </div>
            
            <div id="projects-grid" class="grid-2 gap-4">
              <!-- JS Injected -->
            </div>
          </div>

          <!-- ─── Recent Activity Timeline (Right) ─── -->
          <div class="col-span-1">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-bold flex items-center gap-2">
                <span class="w-2 h-6 bg-indigo-500 rounded-full"></span>
                Recent Activity
              </h3>
            </div>
            
            <div class="card p-5">
              <div id="activity-timeline" class="timeline">
                <!-- JS Injected -->
              </div>
              <div class="mt-6 pt-4 border-t text-center">
                <a href="#logs" class="btn btn-ghost btn-xs w-full justify-center">View Full Audit Log</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.init();
  },

  async init() {
    const res = await Api.get('dashboard');
    if (!res?.success) {
      document.getElementById('page-view').innerHTML = `<div class="alert alert-error">Gagal memuat dashboard: ${res?.message}</div>`;
      return;
    }

    const { stats, recent, projects } = res.data;

    // 1. Update Stats
    document.getElementById('stat-total').textContent   = stats.total;
    document.getElementById('stat-rate').textContent    = stats.success_rate + '%';
    document.getElementById('stat-24h').textContent     = stats.logs_24h;
    document.getElementById('stat-webhook').textContent = stats.sources.webhook;
    document.getElementById('stat-manual').textContent  = stats.sources.manual;

    // Donut visualization
    const donutSegment = document.getElementById('donut-segment');
    donutSegment.setAttribute('stroke-dasharray', `${stats.success_rate}, 100`);

    // Progress bars
    const totalSource = (stats.sources.webhook + stats.sources.manual) || 1;
    document.getElementById('bar-webhook').style.width = (stats.sources.webhook / totalSource * 100) + '%';
    document.getElementById('bar-manual').style.width = (stats.sources.manual / totalSource * 100) + '%';

    document.getElementById('last-update').textContent = 'Last update: ' + new Date().toLocaleTimeString();

    // 2. Render Projects Grid
    const projGrid = document.getElementById('projects-grid');
    if (projects.length === 0) {
      projGrid.innerHTML = `<div class="col-span-full py-10 text-center text-muted">No projects found. Add your first project to monitor it here.</div>`;
    } else {
      projGrid.innerHTML = projects.map(p => `
        <div class="card p-4 hover:border-gray-300 transition-all">
          <div class="flex justify-between items-start mb-3">
            <div>
              <div class="font-bold text-sm truncate max-w-[140px]">${p.name}</div>
              <div class="text-[10px] font-mono text-muted uppercase mt-0.5">${p.branch || 'main'}</div>
            </div>
            ${this.getStatusBadge(p.last_status)}
          </div>
          
          <div class="bg-gray-50 rounded-md p-2 mb-3">
            <div class="text-[9px] text-muted uppercase font-bold tracking-tighter">Last Deployment</div>
            <div class="text-xs font-medium truncate">${p.last_deploy || 'Never'}</div>
          </div>

          <div class="flex gap-2">
            <a href="#git?project_id=${p.id}" class="btn btn-ghost btn-xs flex-1 justify-center py-1">Git</a>
            <a href="#logs?project_id=${p.id}" class="btn btn-primary btn-xs flex-1 justify-center py-1">Logs</a>
          </div>
        </div>
      `).join('');
    }

    // 3. Render Timeline
    const timeline = document.getElementById('activity-timeline');
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
  },

  getStatusBadge(status) {
    if (status === 'success') return '<span class="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(22,163,74,0.4)]"></span>';
    if (status === 'failed')  return '<span class="w-2 h-2 rounded-full bg-danger shadow-[0_0_8px_rgba(220,38,38,0.4)]"></span>';
    if (status === 'running') return '<span class="w-2 h-2 rounded-full bg-info animate-pulse"></span>';
    return '<span class="w-2 h-2 rounded-full bg-gray-300"></span>';
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

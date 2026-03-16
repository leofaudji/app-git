const PageDashboard = {
  async render(params) {
    const view = document.getElementById('page-view');
    view.innerHTML = `
      <!-- Stats Overview -->
      <div class="grid-3 mb-6">
        <div class="card p-4 flex items-center gap-4">
          <div class="stat-icon bg-indigo-100 text-indigo-600">📊</div>
          <div>
            <div class="text-xs text-muted font-medium mb-1 uppercase tracking-wider">Total Deploys</div>
            <div class="text-2xl font-bold" id="stat-total">-</div>
          </div>
        </div>
        <div class="card p-4 flex items-center gap-4">
          <div class="stat-icon bg-green-100 text-green-600">✓</div>
          <div>
            <div class="text-xs text-muted font-medium mb-1 uppercase tracking-wider">Berhasil</div>
            <div class="text-2xl font-bold" id="stat-success">-</div>
          </div>
        </div>
        <div class="card p-4 flex items-center gap-4">
          <div class="stat-icon bg-red-100 text-red-600">⚠</div>
          <div>
            <div class="text-xs text-muted font-medium mb-1 uppercase tracking-wider">Gagal</div>
            <div class="text-2xl font-bold" id="stat-failed">-</div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold">Project Monitoring</h3>
        <a href="#projects" class="text-sm text-primary font-medium hover:underline">Kelola Project ›</a>
      </div>

      <!-- Projects Grid -->
      <div id="projects-grid" class="grid-2 gap-4 mb-6">
        <div class="col-span-full py-12 text-center text-muted">
          <span class="spinner"></span> Memuat daftar project...
        </div>
      </div>

      <div class="grid-1 gap-6">
        <!-- Recent Activity -->
        <div class="card">
          <div class="p-4 border-b">
            <h3 class="text-lg font-bold">Aktivitas Terakhir</h3>
          </div>
          <div class="table-wrap">
            <table id="recent-logs-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Trigger</th>
                  <th>Status</th>
                  <th>Waktu</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody id="recent-logs-tbody">
                <tr><td colspan="5" class="text-center py-4 text-muted">Memuat data...</td></tr>
              </tbody>
            </table>
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

    // Stats
    document.getElementById('stat-total').textContent   = stats.total;
    document.getElementById('stat-success').textContent = stats.success;
    document.getElementById('stat-failed').textContent  = stats.failed;

    // Projects Grid
    const projGrid = document.getElementById('projects-grid');
    if (projects.length === 0) {
      projGrid.innerHTML = `
        <div class="col-span-full card p-10 text-center">
          <div class="text-4xl mb-4">📂</div>
          <h4 class="text-lg font-bold mb-2">Belum ada project</h4>
          <p class="text-muted mb-4">Tambahkan project Anda untuk mulai memonitoring.</p>
          <a href="#projects" class="btn btn-primary inline-flex">Tambah Project</a>
        </div>
      `;
    } else {
      projGrid.innerHTML = projects.map(p => `
        <div class="card p-5 hover-shadow transition-all border-l-4 ${p.last_status === 'success' ? 'border-green-500' : p.last_status === 'failed' ? 'border-red-500' : 'border-gray-200'}">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h4 class="font-bold text-lg">${p.name}</h4>
              <code class="text-xs text-muted">${p.branch || 'main'}</code>
            </div>
            ${p.last_status === 'success' ? '<span class="badge badge-success">Success</span>' : 
              p.last_status === 'failed' ? '<span class="badge badge-danger">Failed</span>' :
              p.last_status === 'running' ? '<span class="badge badge-info">Running</span>' :
              '<span class="badge badge-warning">Pending</span>'}
          </div>
          
          <div class="flex items-center gap-4 mb-4 text-sm">
            <div class="flex-1">
              <div class="text-xs text-muted mb-1 uppercase tracking-tight">Terakhir Deploy</div>
              <div class="font-medium">${p.last_deploy || 'Belum pernah'}</div>
            </div>
          </div>

          <div class="flex border-t pt-4 gap-2">
            <a href="#git?project_id=${p.id}" class="btn btn-ghost btn-xs flex-1 text-center justify-center">Git Status</a>
            <a href="#logs?project_id=${p.id}" class="btn btn-primary btn-xs flex-1 text-center justify-center">Lihat Log</a>
          </div>
        </div>
      `).join('');
    }

    // Recent Activity
    const recentTbody = document.getElementById('recent-logs-tbody');
    if (recent.length === 0) {
      recentTbody.innerHTML = `<tr><td colspan="5" class="empty-state">Belum ada aktivitas.</td></tr>`;
    } else {
      recentTbody.innerHTML = recent.map(log => `
        <tr>
          <td><span class="font-medium">${log.project_name || 'N/A'}</span></td>
          <td><span class="badge ${log.triggered_by === 'webhook' ? 'badge-indigo' : 'badge-orange'}">${log.triggered_by}</span></td>
          <td>
            ${log.status === 'success' ? `<span class="badge badge-success">✓ Berhasil</span>` : 
              log.status === 'failed' ? `<span class="badge badge-danger">⚠ Gagal</span>` : 
              `<span class="badge badge-info">Running</span>`}
          </td>
          <td class="text-xs text-muted">${log.created_at}</td>
          <td>
            <a href="#logs?action=detail&id=${log.id}" class="text-primary text-sm font-medium hover:underline">Detail ›</a>
          </td>
        </tr>
      `).join('');
    }
  }
};

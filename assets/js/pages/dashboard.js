// ============================================================
// pages/dashboard.js - Dashboard Page
// ============================================================
const PageDashboard = (() => {

  function statusBadge(status) {
    const map = {
      'success': 'badge-success',
      'failed':  'badge-danger',
      'running': 'badge-warning',
    };
    return `<span class="badge ${map[status] || 'badge-info'}">${status}</span>`;
  }

  async function render() {
    const view = document.getElementById('page-view');

    const res = await Api.get('dashboard');
    if (!res || !res.success) {
      view.innerHTML = `<div class="alert alert-error">${res?.message || 'Gagal memuat dashboard'}</div>`;
      return;
    }

    const d = res.data;
    const s = d.stats;

    const recentRows = (d.recent_logs || []).map(log => `
      <tr>
        <td><span class="badge badge-indigo">${log.triggered_by}</span></td>
        <td><code class="font-mono">${log.branch || '-'}</code></td>
        <td>${statusBadge(log.status)}</td>
        <td class="text-muted text-sm">${log.full_name || 'Webhook'}</td>
        <td class="text-muted text-sm">${log.created_at}</td>
      </tr>`).join('') || `<tr><td colspan="5"><div class="empty-state" style="padding:30px"><div class="empty-icon">📋</div><p>Belum ada deployment</p></div></td></tr>`;

    view.innerHTML = `
      <!-- Stats -->
      <div class="grid-4 mb-4">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(99,102,241,0.15)">🚀</div>
          <div class="stat-value">${s.total_deploys}</div>
          <div class="stat-label">Total Deploy</div>
          <div class="stat-glow" style="background:#6366f1"></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(34,197,94,0.15)">✓</div>
          <div class="stat-value" style="color:var(--success)">${s.success_deploys}</div>
          <div class="stat-label">Berhasil</div>
          <div class="stat-glow" style="background:#22c55e"></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(239,68,68,0.15)">✕</div>
          <div class="stat-value" style="color:var(--danger)">${s.failed_deploys}</div>
          <div class="stat-label">Gagal</div>
          <div class="stat-glow" style="background:#ef4444"></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(59,130,246,0.15)">⎇</div>
          <div class="stat-value" style="font-size:18px;color:var(--info)">${s.current_branch || 'N/A'}</div>
          <div class="stat-label">Branch Aktif</div>
          <div class="stat-glow" style="background:#3b82f6"></div>
        </div>
      </div>

      <div class="grid-2">
        <!-- Last Commit -->
        <div class="card">
          <div class="card-title">⎇ Commit Terakhir</div>
          ${s.last_commit && s.last_commit !== 'N/A' ? `
            <p class="text-sm text-muted font-mono" style="line-height:1.7;word-break:break-all">${s.last_commit}</p>` : `
            <div class="empty-state" style="padding:20px"><div class="empty-icon">⎇</div><p>Tidak ada informasi commit</p></div>`}
        </div>

        <!-- Recent Activity -->
        <div class="card">
          <div class="card-title">📋 Aktivitas Terbaru</div>
          <div class="table-wrap">
            <table>
              <thead><tr>
                <th>Trigger</th><th>Branch</th><th>Status</th><th>User</th><th>Waktu</th>
              </tr></thead>
              <tbody>${recentRows}</tbody>
            </table>
          </div>
          <div style="margin-top:14px">
            <a href="#logs" onclick="Router.navigate('logs')" class="btn btn-ghost btn-sm">Lihat semua log →</a>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card" style="margin-top:20px">
        <div class="card-title">⚡ Aksi Cepat</div>
        <div class="flex gap-3 flex-wrap">
          <button class="btn btn-primary" onclick="Router.navigate('git-pull')">🔄 Git Pull</button>
          <button class="btn btn-ghost" onclick="Router.navigate('git-status')">🌿 Info Branch</button>
          <button class="btn btn-ghost" onclick="Router.navigate('logs')">📋 Lihat Logs</button>
          ${window.CurrentUser?.permissions?.settings ? '<button class="btn btn-ghost" onclick="Router.navigate(\'settings\')">⚙ Settings</button>' : ''}
        </div>
      </div>`;
  }

  return { render };
})();

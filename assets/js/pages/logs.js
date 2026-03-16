// ============================================================
// pages/logs.js - Deployment Logs Page
// ============================================================
const PageLogs = (() => {
  let currentPage = 1;
  let currentFilter = { status: '', trigger: '' };

  function statusBadge(s) {
    const map = { success:'badge-success', failed:'badge-danger', running:'badge-warning' };
    return `<span class="badge ${map[s]||'badge-info'}">${s}</span>`;
  }

  async function fetchAndRender() {
    const params = { page: currentPage, limit: 15, ...currentFilter };
    const res = await Api.get('logs', params);
    if (!res || !res.success) return;

    const tbody = document.getElementById('logs-tbody');
    const pag   = document.getElementById('logs-pagination');
    const count = document.getElementById('logs-count');

    count.textContent = `${res.data.total} log`;

    if (!res.data.logs.length) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state" style="padding:30px"><div class="empty-icon">📋</div><p>Tidak ada log</p></div></td></tr>`;
    } else {
      tbody.innerHTML = res.data.logs.map(l => `
        <tr>
          <td>#${l.id}</td>
          <td><span class="badge badge-indigo">${l.triggered_by}</span></td>
          <td><code class="font-mono">${l.branch || '-'}</code></td>
          <td><code class="font-mono text-sm">${l.commit_hash || '-'}</code></td>
          <td>${statusBadge(l.status)}</td>
          <td class="text-sm text-muted">${l.user_name || 'Webhook'}</td>
          <td class="text-sm text-muted">${l.created_at}</td>
          <td>
            <button class="btn-icon" onclick="PageLogs.showDetail(${l.id})" title="Detail">🔍</button>
            ${window.CurrentUser?.permissions?.logs?.includes('delete')
              ? `<button class="btn-icon" onclick="PageLogs.deleteLog(${l.id})" title="Hapus" style="margin-left:4px">🗑</button>`
              : ''}
          </td>
        </tr>`).join('');
    }

    // Pagination
    const pages = res.data.pages;
    const pg = currentPage;
    pag.innerHTML = '';
    if (pages > 1) {
      const btn = (n, label) => {
        const b = document.createElement('button');
        b.className = `page-btn${n === pg ? ' active' : ''}`;
        b.textContent = label || n;
        b.onclick = () => { currentPage = n; fetchAndRender(); };
        pag.appendChild(b);
      };
      if (pg > 1) btn(pg-1, '‹');
      for (let i = Math.max(1, pg-2); i <= Math.min(pages, pg+2); i++) btn(i);
      if (pg < pages) btn(pg+1, '›');
    }
  }

  async function render() {
    currentPage = 1;
    currentFilter = { status: '', trigger: '' };
    const view = document.getElementById('page-view');
    const canDelete = window.CurrentUser?.permissions?.logs?.includes('delete');

    view.innerHTML = `
      <div class="card mb-4">
        <div class="flex items-center justify-between mb-4">
          <div class="flex gap-3 items-center flex-wrap">
            <select id="filter-status" class="form-select" style="width:auto;padding:7px 12px"
              onchange="PageLogs.applyFilter()">
              <option value="">Semua Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="running">Running</option>
            </select>
            <select id="filter-trigger" class="form-select" style="width:auto;padding:7px 12px"
              onchange="PageLogs.applyFilter()">
              <option value="">Semua Trigger</option>
              <option value="manual">Manual</option>
              <option value="webhook">Webhook</option>
            </select>
          </div>
          <div class="flex gap-2 items-center">
            <span id="logs-count" class="text-sm text-muted">—</span>
            ${canDelete ? '<button class="btn btn-danger btn-sm" onclick="PageLogs.clearAll()">🗑 Hapus Semua</button>' : ''}
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>#</th><th>Trigger</th><th>Branch</th><th>Commit</th>
              <th>Status</th><th>User</th><th>Waktu</th><th></th>
            </tr></thead>
            <tbody id="logs-tbody"><tr><td colspan="8"><div style="padding:30px;text-align:center"><div class="spinner"></div></div></td></tr></tbody>
          </table>
        </div>
        <div id="logs-pagination" class="pagination mt-4"></div>
      </div>

      <!-- Detail Modal -->
      <div class="modal-overlay" id="log-detail-modal">
        <div class="modal-box">
          <div class="modal-header">
            <span class="modal-title">Detail Log</span>
            <button class="modal-close" onclick="PageLogs.closeModal()">×</button>
          </div>
          <div class="modal-body" id="log-detail-body"></div>
        </div>
      </div>`;

    await fetchAndRender();
  }

  function applyFilter() {
    currentFilter.status  = document.getElementById('filter-status').value;
    currentFilter.trigger = document.getElementById('filter-trigger').value;
    currentPage = 1;
    fetchAndRender();
  }

  async function showDetail(id) {
    const res = await Api.get('logs', { action: 'detail', id });
    if (!res?.success) { Toast.error('Gagal memuat detail'); return; }
    const l = res.data;
    document.getElementById('log-detail-body').innerHTML = `
      <div style="display:flex;flex-direction:column;gap:10px">
        <div><strong>ID:</strong> #${l.id}</div>
        <div><strong>Trigger:</strong> <span class="badge badge-indigo">${l.triggered_by}</span></div>
        <div><strong>Branch:</strong> <code class="font-mono">${l.branch}</code></div>
        <div><strong>Commit:</strong> <code class="font-mono">${l.commit_hash || '-'}</code></div>
        <div><strong>Status:</strong> <span class="badge ${l.status==='success'?'badge-success':l.status==='failed'?'badge-danger':'badge-warning'}">${l.status}</span></div>
        <div><strong>IP:</strong> ${l.ip_address || '-'}</div>
        <div><strong>User:</strong> ${l.user_name || 'Webhook'}</div>
        <div><strong>Waktu:</strong> ${l.created_at}</div>
        <div>
          <strong>Output:</strong>
          <div class="terminal" style="margin-top:6px">${l.output ? l.output.replace(/</g,'&lt;').replace(/>/g,'&gt;') : '(no output)'}</div>
        </div>
      </div>`;
    document.getElementById('log-detail-modal').classList.add('open');
  }

  function closeModal() {
    document.getElementById('log-detail-modal').classList.remove('open');
  }

  async function deleteLog(id) {
    if (!confirm('Hapus log ini?')) return;
    const res = await Api.post('logs', { action: 'delete', id });
    if (res?.success) { Toast.success('Log dihapus'); fetchAndRender(); }
    else Toast.error(res?.message || 'Gagal menghapus');
  }

  async function clearAll() {
    if (!confirm('Hapus SEMUA log? Tindakan ini tidak dapat dibatalkan!')) return;
    const res = await Api.post('logs', { action: 'clear' });
    if (res?.success) { Toast.success('Semua log dihapus'); fetchAndRender(); }
    else Toast.error(res?.message || 'Gagal menghapus');
  }

  return { render, applyFilter, showDetail, closeModal, deleteLog, clearAll };
})();

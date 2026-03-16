// ============================================================
// pages/logs.js - Deployment Logs Page
// ============================================================
const PageLogs = (() => {
  let currentPage = 1;
  let currentFilter = { status: '', trigger: '', project_id: '' };

  function statusBadge(s) {
    const map = { success:'badge-success', failed:'badge-danger', running:'badge-info' };
    return `<span class="badge ${map[s]||'badge-secondary'}">${s}</span>`;
  }

  async function fetchAndRender() {
    const params = { page: currentPage, limit: 15, ...currentFilter };
    const res = await Api.get('logs', params);
    if (!res || !res.success) return;

    const tbody = document.getElementById('logs-tbody');
    const pag   = document.getElementById('logs-pagination');
    const count = document.getElementById('logs-count');

    count.textContent = `${res.data.total} log ditemukan`;

    if (!res.data.logs.length) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state py-10"><p>Tidak ada log untuk kriteria ini.</p></div></td></tr>`;
    } else {
      tbody.innerHTML = res.data.logs.map(l => `
        <tr>
          <td>#${l.id}</td>
          <td>
            <div class="font-bold text-xs">${l.project_name || 'N/A'}</div>
            <span class="badge ${l.triggered_by === 'webhook' ? 'badge-indigo' : 'badge-orange'} scale-75 origin-left">${l.triggered_by}</span>
          </td>
          <td><code class="text-xs">${l.branch || '-'}</code></td>
          <td><code class="text-xs">${l.commit_hash || '-'}</code></td>
          <td>${statusBadge(l.status)}</td>
          <td class="text-xs text-muted">
            <div>${l.user_name || 'System'}</div>
            <div class="scale-75 origin-left">${l.ip_address || '-'}</div>
          </td>
          <td class="text-xs text-muted">${l.created_at}</td>
          <td>
            <div class="flex gap-1">
              <button class="btn-icon" onclick="PageLogs.showDetail(${l.id})" title="Detail">🔍</button>
              ${window.CurrentUser?.permissions?.logs?.includes('delete')
                ? `<button class="btn-icon" onclick="PageLogs.deleteLog(${l.id})" title="Hapus">🗑</button>`
                : ''}
            </div>
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

  async function render(params) {
    currentPage = 1;
    currentFilter = { 
        status: '', 
        trigger: '', 
        project_id: params ? params.get('project_id') || '' : '' 
    };
    
    const view = document.getElementById('page-view');
    const canDelete = window.CurrentUser?.permissions?.logs?.includes('delete');

    // Fetch project list for dropdown
    const projRes = await Api.get('projects', { action: 'list' });
    const projects = projRes?.success ? projRes.data : [];

    view.innerHTML = `
      <div class="card mb-4 overflow-hidden">
        <div class="p-4 border-b flex flex-wrap items-center justify-between gap-4 bg-gray-50">
          <div class="flex gap-2 items-center flex-wrap">
            <select id="filter-project" class="form-select text-sm w-40" onchange="PageLogs.applyFilter()">
              <option value="">Semua Project</option>
              ${projects.map(p => `<option value="${p.id}" ${currentFilter.project_id == p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
            </select>
            <select id="filter-status" class="form-select text-sm w-32" onchange="PageLogs.applyFilter()">
              <option value="">Semua Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="running">Running</option>
            </select>
            <select id="filter-trigger" class="form-select text-sm w-32" onchange="PageLogs.applyFilter()">
              <option value="">Semua Trigger</option>
              <option value="manual">Manual</option>
              <option value="webhook">Webhook</option>
            </select>
          </div>
          <div class="flex gap-4 items-center">
            <span id="logs-count" class="text-xs text-muted uppercase font-bold tracking-wider">—</span>
            ${canDelete ? '<button class="btn btn-danger btn-sm" onclick="PageLogs.clearAll()">🗑 Clear Logs</button>' : ''}
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>#</th><th>Project & Trigger</th><th>Branch</th><th>Commit</th>
              <th>Status</th><th>User & IP</th><th>Waktu</th><th></th>
            </tr></thead>
            <tbody id="logs-tbody"><tr><td colspan="8" class="text-center py-10"><span class="spinner"></span></td></tr></tbody>
          </table>
        </div>
        <div id="logs-pagination" class="pagination p-4 border-t bg-gray-50 flex justify-center"></div>
      </div>

      <!-- Detail Modal -->
      <div class="modal-overlay" id="log-detail-modal">
        <div class="modal-box max-w-2xl">
          <div class="modal-header">
            <h3 class="modal-title font-bold">Deployment Detail</h3>
            <button class="modal-close" onclick="PageLogs.closeModal()">×</button>
          </div>
          <div class="modal-body" id="log-detail-body"></div>
        </div>
      </div>`;

    await fetchAndRender();
  }

  function applyFilter() {
    currentFilter.project_id = document.getElementById('filter-project').value;
    currentFilter.status     = document.getElementById('filter-status').value;
    currentFilter.trigger    = document.getElementById('filter-trigger').value;
    currentPage = 1;
    fetchAndRender();
  }

  async function showDetail(id) {
    const res = await Api.get('logs', { action: 'detail', id });
    if (!res?.success) { Toast.error('Gagal memuat detail'); return; }
    const l = res.data;
    document.getElementById('log-detail-body').innerHTML = `
      <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div><span class="text-muted block">Project</span><strong>${l.project_name || 'N/A'}</strong></div>
        <div><span class="text-muted block">Trigger</span><span class="badge badge-indigo">${l.triggered_by}</span></div>
        <div><span class="text-muted block">Branch</span><code>${l.branch}</code></div>
        <div><span class="text-muted block">Commit</span><code>${l.commit_hash || '-'}</code></div>
        <div><span class="text-muted block">Status</span>${statusBadge(l.status)}</div>
        <div><span class="text-muted block">Waktu</span>${l.created_at}</div>
        <div><span class="text-muted block">User</span>${l.user_name || 'Webhook'}</div>
        <div><span class="text-muted block">IP Address</span>${l.ip_address || '-'}</div>
      </div>
      <div>
        <span class="text-muted text-sm block mb-2 font-bold uppercase tracking-tight">Output Console:</span>
        <div class="terminal bg-black text-gray-200 p-4 rounded-md font-mono text-xs overflow-auto max-h-96 whitespace-pre-wrap">${l.output ? escapeHtml(l.output) : '(no output)'}</div>
      </div>`;
    document.getElementById('log-detail-modal').classList.add('open');
  }

  function closeModal() {
    document.getElementById('log-detail-modal').classList.remove('open');
  }

  async function deleteLog(id) {
    const result = await Swal.fire({
      title: 'Hapus Log?',
      text: 'Log deployment ini akan dihapus permanen!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    const res = await Api.post('logs', { action: 'delete', id });
    if (res?.success) { Toast.success('Log dihapus'); fetchAndRender(); }
    else Toast.error(res?.message || 'Gagal menghapus');
  }

  async function clearAll() {
    const projId = currentFilter.project_id;
    const msg = projId ? 'Hapus semua log untuk PROJECT INI?' : 'Hapus SEMUA log dari semua project?';
    
    const result = await Swal.fire({
      title: 'Hapus Semua Log?',
      text: msg,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Bersihkan!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;
    
    const res = await Api.post('logs', { action: 'clear', project_id: projId });
    if (res?.success) { Toast.success('Log dihapus'); fetchAndRender(); }
    else Toast.error(res?.message || 'Gagal menghapus');
  }

  function escapeHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { render, applyFilter, showDetail, closeModal, deleteLog, clearAll };
})();

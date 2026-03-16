const PageWebhookLogs = {
  async render() {
    const view = document.getElementById('page-view');
    const canDelete = window.CurrentUser?.permissions?.webhook_logs?.includes('delete');

    view.innerHTML = `
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-xl font-bold">Webhook Logs</h2>
          <p class="text-muted text-sm">Monitor semua trafik webhook yang masuk ke aplikasi.</p>
        </div>
        ${canDelete ? `
          <button id="btn-clear-webhook-logs" class="btn btn-danger btn-sm">
            <span class="nav-icon">🗑</span> Bersihkan Semua
          </button>
        ` : ''}
      </div>

      <div class="card overflow-hidden">
        <div class="table-wrap">
          <table id="webhook-logs-table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Project</th>
                <th>Event</th>
                <th>Summary</th>
                <th>Status</th>
                <th>IP Address</th>
                <th class="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody id="webhook-logs-tbody">
              <tr><td colspan="7" class="text-center py-8"><span class="spinner"></span> Memuat log...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Detail Modal -->
      <div id="webhook-detail-modal" class="modal-overlay">
        <div class="modal-box max-w-2xl">
          <div class="modal-header">
            <h3 class="modal-title">Webhook Detail</h3>
            <button class="modal-close">×</button>
          </div>
          <div class="modal-body">
            <div id="webhook-detail-content" class="space-y-4"></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost modal-close-btn">Tutup</button>
          </div>
        </div>
      </div>
    `;

    this.init();
  },

  async init() {
    this.fetchLogs();

    const canDelete = window.CurrentUser?.permissions?.webhook_logs?.includes('delete');
    if (canDelete) {
      document.getElementById('btn-clear-webhook-logs').onclick = () => this.clearAll();
    }

    document.querySelectorAll('.modal-close, .modal-close-btn').forEach(btn => {
      btn.onclick = () => {
        document.getElementById('webhook-detail-modal').classList.remove('open');
      };
    });
  },

  async fetchLogs() {
    const res = await Api.get('webhook_logs', { action: 'list' });
    const tbody = document.getElementById('webhook-logs-tbody');

    if (!res?.success || !res.data?.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Tidak ada log webhook.</td></tr>`;
      return;
    }

    tbody.innerHTML = res.data.map(l => `
      <tr>
        <td class="text-xs">${l.created_at}</td>
        <td>
          <div class="font-bold">${l.project_name || '<span class="text-muted">Unknown</span>'}</div>
        </td>
        <td><code class="text-xs">${l.event_type}</code></td>
        <td class="text-xs truncate max-w-xs" title="${l.payload_summary}">${l.payload_summary}</td>
        <td>
          ${l.status === 'success' ? '<span class="badge badge-success">Success</span>' : '<span class="badge badge-danger">Failed</span>'}
        </td>
        <td class="text-xs text-muted">${l.ip_address}</td>
        <td class="text-right">
          <div class="flex gap-2 justify-end">
            <button class="btn-icon" title="Detail" onclick="PageWebhookLogs.showDetail(${l.id})">👁</button>
            ${window.CurrentUser?.permissions?.webhook_logs?.includes('delete') ? `
              <button class="btn-icon" title="Hapus" onclick="PageWebhookLogs.deleteLog(${l.id})">🗑</button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');

    this.logs = res.data;
  },

  async showDetail(id) {
    const log = this.logs.find(l => l.id == id);
    if (!log) return;

    const content = document.getElementById('webhook-detail-content');
    let headers = {};
    try { headers = JSON.parse(log.headers); } catch(e) {}

    content.innerHTML = `
      <div class="grid-2 gap-4">
        <div>
          <label class="form-label text-xs uppercase font-bold">Status</label>
          <div class="mt-1">${log.status === 'success' ? '<span class="badge badge-success">Success</span>' : '<span class="badge badge-danger">Failed</span>'}</div>
        </div>
        <div>
          <label class="form-label text-xs uppercase font-bold">Event Type</label>
          <div class="mt-1"><code class="text-sm">${log.event_type}</code></div>
        </div>
      </div>

      ${log.error_message ? `
        <div class="p-3 bg-red-50 border border-red-100 rounded text-red-600 text-sm">
          <strong>Error:</strong> ${log.error_message}
        </div>
      ` : ''}

      <div>
        <label class="form-label text-xs uppercase font-bold">Headers</label>
        <pre class="mt-1 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-40 border">${JSON.stringify(headers, null, 2)}</pre>
      </div>

      <div>
        <label class="form-label text-xs uppercase font-bold">Payload Summary</label>
        <div class="mt-1 p-3 bg-gray-50 rounded text-xs border">${log.payload_summary || '-'}</div>
      </div>
    `;

    document.getElementById('webhook-detail-modal').classList.add('open');
  },

  async deleteLog(id) {
    const result = await Swal.fire({
      title: 'Hapus Log?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    const res = await Api.post('webhook_logs', { action: 'delete', id });
    if (res?.success) {
      Toast.success('Log dihapus');
      this.fetchLogs();
    }
  },

  async clearAll() {
    const result = await Swal.fire({
      title: 'Bersihkan Semua Log?',
      text: 'Semua riwayat webhook akan dihapus permanen!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Bersihkan',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    const res = await Api.post('webhook_logs', { action: 'clear' });
    if (res?.success) {
      Toast.success('Semua log dibersihkan');
      this.fetchLogs();
    }
  }
};

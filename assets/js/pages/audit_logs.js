import { Api, Toast } from "../api.js";

export const PageAuditLogs = {
  async render() {
    const view = document.getElementById('page-view');
    view.innerHTML = `
      <div class="fade-in-up">
        <div class="mb-6">
          <h2 class="text-2xl font-bold">Audit Logs</h2>
          <p class="text-muted">Pantau aktivitas pengguna dan perubahan sistem secara real-time.</p>
        </div>

        <div class="card mb-4 overflow-hidden">
          <div class="p-4 border-b flex flex-wrap items-center justify-between gap-4 bg-gray-50">
            <div class="flex gap-2 items-center flex-wrap">
              <select id="filter-module" class="form-select text-sm w-40" onchange="PageAuditLogs.applyFilter()">
                <option value="">Semua Modul</option>
              </select>
            </div>
            <div class="flex gap-4 items-center">
              <span id="audit-count" class="text-xs text-muted uppercase font-bold tracking-wider">—</span>
            </div>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>User</th>
                  <th>Modul</th>
                  <th>Aksi</th>
                  <th>Deskripsi</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody id="audit-tbody">
                <tr><td colspan="6" class="text-center py-10"><span class="spinner"></span></td></tr>
              </tbody>
            </table>
          </div>
          <div id="audit-pagination" class="pagination p-4 border-t bg-gray-50 flex justify-center"></div>
        </div>
      </div>
    `;

    this.init();
  },

  currentPage: 1,
  currentFilter: { module: '' },

  async init() {
    await this.fetchModules();
    await this.fetchAndRender();
  },

  async fetchModules() {
    const res = await Api.get('audit_logs', { action: 'modules' });
    if (res?.success) {
      const select = document.getElementById('filter-module');
      res.data.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.module;
        opt.textContent = m.module.charAt(0).toUpperCase() + m.module.slice(1);
        select.appendChild(opt);
      });
    }
  },

  async fetchAndRender() {
    const params = { page: this.currentPage, limit: 15, ...this.currentFilter };
    const res = await Api.get('audit_logs', params);
    
    if (!res || !res.success) return;

    const tbody = document.getElementById('audit-tbody');
    const pag = document.getElementById('audit-pagination');
    const count = document.getElementById('audit-count');

    count.textContent = `${res.data.total} aktivitas ditemukan`;

    if (!res.data.logs.length) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state py-10"><p>Belum ada aktivitas yang tercatat.</p></div></td></tr>`;
    } else {
      tbody.innerHTML = res.data.logs.map(l => `
        <tr>
          <td class="text-xs text-muted">${l.created_at}</td>
          <td>
            <div class="font-bold text-xs">${l.full_name || 'System'}</div>
            <div class="text-[10px] text-muted">@${l.username || 'system'}</div>
          </td>
          <td><span class="badge badge-indigo scale-90 origin-left">${l.module}</span></td>
          <td><span class="font-medium text-xs text-primary uppercase">${l.action}</span></td>
          <td class="text-xs text-secondary max-w-xs truncate" title="${l.description || ''}">${l.description || '-'}</td>
          <td class="text-[10px] text-muted font-mono">${l.ip_address || '-'}</td>
        </tr>`).join('');
    }

    // Pagination
    const pages = res.data.pages;
    const pg = this.currentPage;
    pag.innerHTML = '';
    if (pages > 1) {
      const btn = (n, label) => {
        const b = document.createElement('button');
        b.className = `page-btn${n === pg ? ' active' : ''}`;
        b.textContent = label || n;
        b.onclick = () => { this.currentPage = n; this.fetchAndRender(); };
        pag.appendChild(b);
      };
      if (pg > 1) btn(pg - 1, '‹');
      for (let i = Math.max(1, pg - 2); i <= Math.min(pages, pg + 2); i++) btn(i);
      if (pg < pages) btn(pg + 1, '›');
    }
  },

  applyFilter() {
    this.currentFilter.module = document.getElementById('filter-module').value;
    this.currentPage = 1;
    this.fetchAndRender();
  }
};

import { Api, Toast } from "../api.js";

export const PageChangelog = {
  async render() {
    const view = document.getElementById('page-view');
    
    view.innerHTML = `
      <div class="mb-6">
        <h2 class="text-2xl font-bold">Changelog</h2>
        <p class="text-muted">Pantau rilis terbaru dan riwayat perubahan aplikasi serta project Anda.</p>
      </div>

      <div class="tabs-wrap mb-6">
        <div class="tabs">
          <button class="tab-btn active" data-tab="projects">Project Updates</button>
          <button class="tab-btn" data-tab="system">System Updates</button>
        </div>
      </div>

      <div id="changelog-content" class="changelog-container">
        <div class="text-center py-12"><span class="spinner"></span> Memuat riwayat...</div>
      </div>
    `;

    this.init();
  },

  init() {
    this.fetchLogs('projects');

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.fetchLogs(btn.dataset.tab);
      };
    });
  },

  async fetchLogs(type) {
    const container = document.getElementById('changelog-content');
    container.innerHTML = '<div class="text-center py-12"><span class="spinner"></span> Memuat riwayat...</div>';

    const action = type === 'system' ? 'system' : 'list';
    const res = await Api.get('changelog', { action });

    if (!res?.success) {
      container.innerHTML = `<div class="alert alert-error">Gagal memuat riwayat: ${res?.message || 'Unknown error'}</div>`;
      return;
    }

    if (type === 'system') {
      this.renderSystemLogs(res.data);
    } else {
      this.renderProjectLogs(res.data);
    }
  },

  renderSystemLogs(logs) {
    const container = document.getElementById('changelog-content');
    if (!logs.length) {
      container.innerHTML = '<div class="empty-state">Belum ada riwayat sistem.</div>';
      return;
    }

    container.innerHTML = `
      <div class="timeline">
        ${logs.map(log => `
          <div class="timeline-item">
            <div class="timeline-marker"></div>
            <div class="timeline-content card">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                  <span class="badge badge-indigo">v${log.version}</span>
                  <h3 class="font-bold text-lg">${log.title}</h3>
                </div>
                <span class="text-sm text-muted font-mono">${log.date}</span>
              </div>
              
              <div class="space-y-4">
                ${log.changes_categorized.map(cat => `
                  <div>
                    <h4 class="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2 ${this.getCategoryColor(cat.category)}">
                       <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                       ${cat.category}
                    </h4>
                    <ul class="space-y-1.5 text-secondary pl-1">
                      ${cat.items.map(item => `
                        <li class="flex gap-2 text-sm">
                          <span class="text-muted opacity-50">•</span>
                          <span>${item}</span>
                        </li>
                      `).join('')}
                    </ul>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  getCategoryColor(cat) {
    cat = cat.toLowerCase();
    if (cat.includes('add')) return 'text-success';
    if (cat.includes('fix')) return 'text-danger';
    if (cat.includes('change')) return 'text-orange-500';
    return 'text-indigo-500';
  },

  renderProjectLogs(logs) {
    const container = document.getElementById('changelog-content');
    if (!logs.length) {
      container.innerHTML = '<div class="empty-state">Belum ada perubahan project yang tercatat.</div>';
      return;
    }

    // Group by Date
    const grouped = {};
    logs.forEach(log => {
      const date = log.created_at.split(' ')[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(log);
    });

    container.innerHTML = `
      <div class="timeline">
        ${Object.keys(grouped).map(date => `
          <div class="timeline-group">
            <div class="timeline-date">${date}</div>
            ${grouped[date].map(log => `
              <div class="timeline-item">
                <div class="timeline-marker"></div>
                <div class="timeline-content card">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="badge badge-success">${log.project_name}</span>
                    <span class="badge badge-indigo">v${log.version}</span>
                    <span class="text-xs text-muted ml-auto">${log.created_at.split(' ')[1]}</span>
                  </div>
                  <div class="text-sm text-secondary whitespace-pre-wrap">${log.changelog}</div>
                  <div class="mt-2 pt-2 border-top text-xs text-muted">
                    Triggered by: <code class="bg-gray-100 px-1 rounded">${log.author || 'System'}</code>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>
    `;
  }
};

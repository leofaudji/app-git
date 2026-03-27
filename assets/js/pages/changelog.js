import { Api, Toast } from "../api.js";

export const PageChangelog = {
  async render() {
    const view = document.getElementById('page-view');
    
    view.innerHTML = `
      <div class="fade-in-up">
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

    container.innerHTML = logs.map((log, index) => `
      <div class="changelog-card card ${index === 0 ? 'open' : ''}" data-version="${log.version}">
        <div class="changelog-header" onclick="this.parentElement.classList.toggle('open')">
          <div class="changelog-title-area">
            <span class="changelog-version-tag">v${log.version}</span>
            <h3 class="font-bold text-base text-primary">${log.title}</h3>
          </div>
          <div class="flex items-center gap-4">
            <span class="changelog-date">${this.formatDate(log.date)}</span>
            <span class="changelog-toggle-icon">▼</span>
          </div>
        </div>
        
        <div class="changelog-body">
          <div class="space-y-6">
            ${log.changes_categorized.map(cat => `
              <div class="changelog-category">
                <h4 class="changelog-category-title ${this.getCategoryClass(cat.category)}">
                  ${this.getCategoryIcon(cat.category)}
                  ${cat.category}
                </h4>
                <ul class="changelog-list">
                  ${cat.items.map(item => `<li>${item}</li>`).join('')}
                </ul>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `).join('');
  },

  getCategoryClass(cat) {
    cat = cat.toLowerCase();
    if (cat.includes('add')) return 'cat-added';
    if (cat.includes('fix')) return 'cat-fixed';
    if (cat.includes('change')) return 'cat-changed';
    if (cat.includes('secur')) return 'cat-security';
    if (cat.includes('remov')) return 'cat-removed';
    return 'text-indigo-500';
  },

  getCategoryIcon(cat) {
    cat = cat.toLowerCase();
    if (cat.includes('add')) return '✨';
    if (cat.includes('fix')) return '🛠';
    if (cat.includes('change')) return '🔄';
    if (cat.includes('secur')) return '🛡';
    if (cat.includes('remov')) return '🗑';
    return '•';
  },

  formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  },

  renderProjectLogs(logs) {
    const container = document.getElementById('changelog-content');
    if (!logs.length) {
      container.innerHTML = '<div class="empty-state">Belum ada perubahan project yang tercatat.</div>';
      return;
    }

    container.innerHTML = logs.map((log, index) => `
      <div class="changelog-card card ${index === 0 ? 'open' : ''}" data-id="${log.id}">
        <div class="changelog-header" onclick="this.parentElement.classList.toggle('open')">
          <div class="changelog-title-area">
            <span class="badge badge-success">${log.project_name}</span>
            <span class="changelog-version-tag">v${log.version}</span>
          </div>
          <div class="flex items-center gap-4">
            <span class="changelog-date">${log.created_at}</span>
            <span class="changelog-toggle-icon">▼</span>
          </div>
        </div>
        
        <div class="changelog-body">
          <div class="p-1">
            <div class="text-sm text-secondary whitespace-pre-wrap mb-4">${log.changelog}</div>
            <div class="pt-3 border-t text-[11px] text-muted flex items-center justify-between">
              <span>Author: <strong class="text-primary">${log.author || 'System'}</strong></span>
              <span>Repo: <code class="bg-gray-100 px-1 rounded">${log.repo_name}</code></span>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }
};

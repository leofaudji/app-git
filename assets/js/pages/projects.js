import { Api, Toast } from "../api.js";

export const PageProjects = {
  async render() {
    const view = document.getElementById('page-view');
    const canManage = window.CurrentUser?.permissions?.projects?.includes('manage');

    view.innerHTML = `
      <div class="fade-in-up">
        <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-xl font-bold">Manage Projects</h2>
          <p class="text-muted text-sm">Kelola repository Git yang dipantau oleh aplikasi ini.</p>
        </div>
        ${canManage ? `
          <div class="flex gap-2">
            <button id="btn-scan" class="btn btn-ghost btn-sm">
              <span class="nav-icon">🔍</span> Scan Global Dir
            </button>
            <button id="btn-add-project" class="btn btn-primary btn-sm">
              <span class="nav-icon">✚</span> Tambah Project
            </button>
          </div>
        ` : ''}
      </div>

      <div class="card mb-4 min-h-[300px]">
        <div class="table-wrap">
          <table id="projects-table">
            <thead>
              <tr>
                <th>Project Info</th>
                <th>Location & Repository</th>
                <th>Deployment</th>
                <th>Health</th>
                ${canManage ? '<th class="text-right">Aksi</th>' : ''}
              </tr>
            </thead>
            <tbody id="projects-tbody">
              <tr><td colspan="${canManage ? '5' : '4'}" class="text-center py-12"><span class="spinner"></span> Memuat projects...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      </div>

      <!-- Add/Edit Modal -->
      <div id="project-modal" class="modal-overlay">
        <div class="modal-box">
          <div class="modal-header">
            <h3 class="modal-title" id="modal-title">Tambah Project</h3>
            <button class="modal-close">×</button>
          </div>
          <form id="project-form">
            <input type="hidden" name="id" id="proj-id">
            <div class="modal-body">
              <div id="project-alert" class="alert alert-error mb-3" style="display:none"></div>
              
              <div class="form-group">
                <label class="form-label">Nama Project</label>
                <input type="text" name="name" id="proj-name" class="form-input" placeholder="Misal: Website Utama" required>
              </div>

              <div class="form-group">
                <label class="form-label">Repository Name (untuk Webhook)</label>
                <input type="text" name="repo_name" id="proj-repo" class="form-input" placeholder="Misal: username/my-repo" required>
                <p class="form-hint">Harus sesuai dengan full name di GitHub/GitLab.</p>
              </div>

              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Folder Name</label>
                  <input type="text" name="folder_name" id="proj-folder" class="form-input" placeholder="Misal: my-app" required>
                  <p class="form-hint">Di dalam folder base dir global.</p>
                </div>
                <div class="form-group">
                  <label class="form-label">Branch</label>
                  <input type="text" name="branch" id="proj-branch" class="form-input" placeholder="main">
                </div>
                <div class="form-group">
                  <label class="form-label">Current Version</label>
                  <input type="text" name="current_version" id="proj-version" class="form-input" placeholder="1.0.0">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Application URL (Live Website)</label>
                <input type="url" name="app_url" id="proj-app-url" class="form-input" placeholder="https://example.com">
                <p class="form-hint">Link cepat untuk membuka hasil deployment.</p>
              </div>

              <div class="form-group">
                <label class="form-label">Webhook Secret (Opsional)</label>
                <input type="password" name="webhook_secret" id="proj-secret" class="form-input" placeholder="Kosongkan jika ingin pakai default">
              </div>

              <div class="form-group">
                <label class="form-label">Deskripsi</label>
                <textarea name="description" id="proj-desc" class="form-textarea"></textarea>
              </div>

              <div class="form-group">
                <div class="toggle-wrap">
                  <label class="toggle">
                    <input type="checkbox" name="is_active" id="proj-active" checked>
                    <span class="toggle-slider"></span>
                  </label>
                  <span class="text-sm">Status Aktif</span>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-ghost modal-close-btn">Batal</button>
              <button type="submit" class="btn btn-primary">Simpan</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Scan Modal -->
      <div id="scan-modal" class="modal-overlay">
        <div class="modal-box">
          <div class="modal-header">
            <h3 class="modal-title">Scan Sub-folder Git</h3>
            <button class="modal-close">×</button>
          </div>
          <div class="modal-body">
            <p class="mb-3 text-sm">Menampilkan folder di dalam base directory yang memiliki folder <code>.git/</code></p>
            <div id="scan-results" class="grid-1 gap-2">
              <p class="text-center py-4"><span class="spinner"></span> Scanning...</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Changelog Modal -->
      <div id="changelog-modal" class="modal-overlay">
        <div class="modal-box modal-lg">
          <div class="modal-header">
            <h3 class="modal-title">Project Changelog: <span id="changelog-project-name"></span></h3>
            <button class="modal-close">×</button>
          </div>
          <div class="modal-body">
            ${canManage ? `
              <form id="changelog-form" class="mb-4 bg-gray-50 p-4 rounded-lg border">
                <h4 class="font-bold mb-2">Tambah Entry Changelog</h4>
                <input type="hidden" name="project_id" id="changelog-proj-id">
                <div class="grid-2 gap-2 mb-2">
                  <div class="form-group mb-0">
                    <input type="text" name="version" id="changelog-version" class="form-input" placeholder="Versi baru" required>
                  </div>
                  <div class="form-group mb-0">
                    <button type="submit" class="btn btn-primary w-full">Simpan & Update Versi</button>
                  </div>
                </div>
                <div class="form-group">
                  <textarea name="changelog" id="changelog-text" class="form-textarea" placeholder="Detail perubahan..." required></textarea>
                </div>
              </form>
            ` : ''}
            <div id="changelog-list" class="space-y-4 max-h-96 overflow-y-auto pr-2">
              <!-- Logs loaded here -->
            </div>
        </div>
      </div>
    `;

    this.init();
  },

  async init() {
    this.fetchProjects();

    // Close modal handlers (Global for all modals)
    document.querySelectorAll('.modal-close, .modal-close-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
      };
    });

    const canManage = window.CurrentUser?.permissions?.projects?.includes('manage');
    if (!canManage) return;
    
    // Global click listener for floating action menu
    document.addEventListener('mousedown', (e) => {
      const menu = document.getElementById('global-action-menu');
      if (menu && !menu.contains(e.target) && !e.target.closest('.dropdown-btn')) {
        this.closeGlobalMenu();
      }
    });

    // Close on scroll too for better UX
    window.addEventListener('scroll', () => this.closeGlobalMenu(), true);

    document.getElementById('btn-add-project').onclick = () => this.showModal();
    document.getElementById('btn-scan').onclick = () => this.showScan();
    
    document.getElementById('project-form').onsubmit = (e) => this.handleSave(e);
    if (document.getElementById('changelog-form')) {
      document.getElementById('changelog-form').onsubmit = (e) => this.handleChangelogSave(e);
    }
  },

  async fetchProjects() {
    const res = await Api.get('projects', { action: 'list' });
    const tbody = document.getElementById('projects-tbody');
    const canManage = window.CurrentUser?.permissions?.projects?.includes('manage');

    if (!res?.success || !res.data?.length) {
      tbody.innerHTML = `<tr><td colspan="${canManage ? '5' : '4'}" class="empty-state">
        <div class="empty-icon">📂</div>
        <h3>Belum ada project</h3>
        <p>Gunakan tombol Tambah Project untuk memulai.</p>
      </td></tr>`;
      return;
    }

    tbody.innerHTML = res.data.map(p => `
      <tr>
        <td class="px-4 py-3">
          <div class="flex flex-col gap-0.5">
            <div class="flex items-center gap-2">
              <span class="font-bold text-gray-800">${p.name}</span>
              ${p.app_url ? `<a href="${p.app_url}" target="_blank" class="text-[10px] opacity-40 hover:opacity-100 hover:text-primary transition-all" title="Buka Aplikasi">🔗</a>` : ''}
            </div>
            <div class="flex items-center gap-1.5 text-[10px]">
              <span class="badge badge-indigo !px-1.5 !py-0 !text-[9px] uppercase">${p.branch || 'main'}</span>
              <span class="text-muted">v${p.current_version || '1.0.0'}</span>
              ${this.getSecurityBadge(p)}
              ${!parseInt(p.is_active) ? `<span class="text-danger font-bold ml-1">● Nonaktif</span>` : ''}
            </div>
          </div>
        </td>
        <td class="px-4 py-3">
          <div class="flex flex-col gap-0.5">
            <div class="flex items-center gap-1 text-xs font-medium text-gray-700">
              <span class="opacity-50 text-[10px]">📁</span> ${p.folder_name}
            </div>
            <div class="flex items-center gap-2">
              <div class="text-[10px] text-muted font-mono truncate max-w-[120px]" title="${p.repo_name}">
                ${p.repo_name}
              </div>
              ${this.getSyncBadge(p)}
              <div id="disk-usage-${p.id}" class="text-[9px] text-muted flex items-center gap-1 ml-1 opacity-70">
                <span class="spinner w-2 h-2"></span>
              </div>
            </div>
          </div>
        </td>
        <td class="px-4 py-3">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-1.5 text-xs">
              ${p.last_status === 'success' ? `<span class="badge badge-success !px-2 !py-0.5 !text-[10px]">Success</span>` : 
                p.last_status === 'failed' ? `<span class="badge badge-danger !px-2 !py-0.5 !text-[10px]">Failed</span>` : 
                p.last_status === 'running' ? `<span class="badge badge-info !px-2 !py-0.5 !text-[10px] animate-pulse">Running</span>` : 
                `<span class="badge badge-warning !px-2 !py-0.5 !text-[10px]">Never</span>`}
              <button class="text-[10px] text-primary hover:underline font-bold" onclick="PageProjects.showChangelog(${p.id}, '${p.name}')">History</button>
            </div>
            <div class="text-[9px] text-muted">
              ${p.last_deploy ? this.formatTimeShort(p.last_deploy) : 'Belum pernah deploy'}
            </div>
          </div>
        </td>
        <td class="px-4 py-3">
          ${p.app_url ? `
            <div class="flex items-center gap-2">
              ${this.getHealthDot(p.health_status)}
              <div class="flex flex-col leading-tight">
                <span class="text-[10px] font-bold ${p.health_status === 'up' ? 'text-success' : p.health_status === 'down' ? 'text-danger' : 'text-muted'}">
                  ${p.health_status ? p.health_status.toUpperCase() : 'NO DATA'}
                </span>
                ${p.health_time ? `<span class="text-[9px] text-muted">${(p.health_time * 1000).toFixed(0)}ms</span>` : ''}
              </div>
            </div>
          ` : '<span class="text-muted text-xs">-</span>'}
        </td>
        ${canManage ? `
          <td class="px-4 py-3 text-right">
            <button class="btn btn-ghost btn-sm dropdown-btn gap-1 px-3" 
                    id="proj-btn-${p.id}"
                    onclick="PageProjects.toggleDropdown(event, ${p.id}, '${p.name}', '${p.app_url || ''}')">
              Aksi <span class="text-[10px] opacity-50">▼</span>
            </button>
          </td>
        ` : ''}
      </tr>
    `).join('');

    // Trigger async disk usage fetch
    res.data.forEach(p => this.fetchDiskUsage(p.id));
  },

  async showModal(id = 0) {
    const modal = document.getElementById('project-modal');
    const form = document.getElementById('project-form');
    const title = document.getElementById('modal-title');
    const alertEl = document.getElementById('project-alert');
    
    form.reset();
    document.getElementById('proj-id').value = id;
    alertEl.style.display = 'none';

    if (id > 0) {
      title.textContent = 'Edit Project';
      try {
        const res = await Api.get('projects', { action: 'detail', id });
        if (res?.success) {
          const p = res.data;
          document.getElementById('proj-name').value = p.name || '';
          document.getElementById('proj-repo').value = p.repo_name || '';
          document.getElementById('proj-folder').value = p.folder_name || '';
          document.getElementById('proj-branch').value = p.branch || 'main';
          document.getElementById('proj-app-url').value = p.app_url || '';
          document.getElementById('proj-version').value = p.current_version || '1.0.0';
          document.getElementById('proj-secret').value = p.webhook_secret || '';
          document.getElementById('proj-desc').value = p.description || '';
          document.getElementById('proj-active').checked = parseInt(p.is_active || 1) === 1;
        } else {
          alertEl.textContent = res?.message || 'Gagal memuat detail project';
          alertEl.style.display = 'block';
        }
      } catch (err) {
        alertEl.textContent = 'Network error saat memuat detail';
        alertEl.style.display = 'block';
      }
    } else {
      title.textContent = 'Tambah Project';
    }

    modal.classList.add('open');
  },

  async handleSave(e) {
    e.preventDefault();
    const alertEl = document.getElementById('project-alert');
    
    // Prepare data as plain object for Api.post
    const data = {
      action:         'save',
      id:             document.getElementById('proj-id').value,
      name:           document.getElementById('proj-name').value.trim(),
      repo_name:      document.getElementById('proj-repo').value.trim(),
      folder_name:    document.getElementById('proj-folder').value.trim(),
      branch:         document.getElementById('proj-branch').value.trim() || 'main',
      app_url:        document.getElementById('proj-app-url').value.trim(),
      current_version: document.getElementById('proj-version').value.trim() || '1.0.0',
      webhook_secret: document.getElementById('proj-secret').value.trim(),
      description:    document.getElementById('proj-desc').value.trim(),
      is_active:      document.getElementById('proj-active').checked ? 1 : 0
    };

    try {
      const res = await Api.post('projects', data);
      if (res?.success) {
        Toast.success(res.message);
        document.getElementById('project-modal').classList.remove('open');
        this.fetchProjects();
      } else {
        alertEl.textContent = res?.message || 'Gagal menyimpan';
        alertEl.style.display = 'block';
      }
    } catch (err) {
      alertEl.textContent = 'Network error: Gagal menghubungi server';
      alertEl.style.display = 'block';
    }
  },

  async deleteProject(id) {
    const result = await Swal.fire({
      title: 'Hapus Project?',
      text: 'Project ini beserta riwayat deploy-nya akan dihapus permanen!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    const res = await Api.post('projects', { action: 'delete', id });
    if (res?.success) {
      Toast.success('Project dihapus');
      this.fetchProjects();
    } else {
      Toast.error(res?.message || 'Gagal menghapus');
    }
  },

  async showScan() {
    const modal = document.getElementById('scan-modal');
    const list = document.getElementById('scan-results');
    modal.classList.add('open');
    list.innerHTML = `<p class="text-center py-4"><span class="spinner"></span> Scanning base directory...</p>`;

    const res = await Api.get('projects', { action: 'scan' });
    if (!res?.success) {
      list.innerHTML = `<div class="alert alert-error">${res?.message || 'Gagal scan'}</div>`;
      return;
    }

    if (res.data.length === 0) {
      list.innerHTML = `<p class="empty-state">Tidak ditemukan folder Git di base directory.</p>`;
      return;
    }

    list.innerHTML = res.data.map(f => `
      <div class="flex items-center justify-between p-3 border rounded-lg bg-gray-50 mb-2">
        <div>
          <div class="font-bold">${f.name}</div>
          ${f.is_managed ? '<span class="text-xs text-info">Sudah ditambahkan</span>' : '<span class="text-xs text-muted">Belum terdaftar</span>'}
        </div>
        ${!f.is_managed ? `<button class="btn btn-primary btn-sm" onclick="PageProjects.quickAdd('${f.name}')">✚ Add</button>` : ''}
      </div>
    `).join('');
  },

  quickAdd(name) {
    document.getElementById('scan-modal').classList.remove('open');
    this.showModal();
    document.getElementById('proj-name').value = name;
    document.getElementById('proj-folder').value = name;
    document.getElementById('proj-repo').value = 'github-user/' + name; // Placeholder
  },

  async showChangelog(id, name) {
    const modal = document.getElementById('changelog-modal');
    document.getElementById('changelog-project-name').textContent = name;
    
    if (document.getElementById('changelog-form')) {
      document.getElementById('changelog-form').reset();
      document.getElementById('changelog-proj-id').value = id;
    }

    modal.classList.add('open');
    this.fetchChangelogs(id);
  },

  async fetchChangelogs(id) {
    const list = document.getElementById('changelog-list');
    list.innerHTML = `<p class="text-center py-4"><span class="spinner"></span> Memuat history...</p>`;

    const res = await Api.get('projects', { action: 'changelog_list', project_id: id });
    if (!res?.success) {
      list.innerHTML = `<div class="alert alert-error">${res?.message || 'Gagal memuat history'}</div>`;
      return;
    }

    if (res.data.length === 0) {
      list.innerHTML = `<p class="empty-state">Belum ada catatan perubahan untuk project ini.</p>`;
      return;
    }

    list.innerHTML = res.data.map(l => `
      <div class="border-l-4 border-primary pl-4 py-1">
        <div class="flex items-center gap-2 mb-1">
          <span class="badge badge-indigo">v${l.version}</span>
          <span class="text-xs text-muted">${l.created_at} oleh ${l.author || 'System'}</span>
        </div>
        <div class="text-sm whitespace-pre-wrap">${l.changelog}</div>
      </div>
    `).join('');
  },

  async handleChangelogSave(e) {
    e.preventDefault();
    const id = document.getElementById('changelog-proj-id').value;
    const data = {
      action:     'changelog_save',
      project_id: id,
      version:    document.getElementById('changelog-version').value.trim(),
      changelog:  document.getElementById('changelog-text').value.trim(),
    };

    const res = await Api.post('projects', data);
    if (res?.success) {
      Toast.success(res.message);
      this.fetchChangelogs(id);
      this.fetchProjects(); // Update version in table
    } else {
      Toast.error(res?.message || 'Gagal menyimpan');
    }
  },

  getHealthDot(status) {
    if (status === 'up') return '<span class="w-2.5 h-2.5 rounded-full bg-success shadow-[0_0_8px_rgba(22,163,74,0.4)]" title="Online"></span>';
    if (status === 'down') return '<span class="w-2.5 h-2.5 rounded-full bg-danger shadow-[0_0_8px_rgba(220,38,38,0.4)]" title="Offline"></span>';
    return '<span class="w-2.5 h-2.5 rounded-full bg-gray-300" title="No data"></span>';
  },

  async checkHealth(id) {
    Toast.info('Memeriksa kesehatan...');
    const res = await Api.get('health', { action: 'check_now', project_id: id });
    if (res?.success) {
      if (res.data.status === 'up') {
        Toast.success(`Project Online! (${(res.data.time * 1000).toFixed(0)}ms)`);
      } else {
        Toast.error(`Project Offline! ${res.data.error || ''}`);
      }
      this.fetchProjects();
    } else {
      Toast.error(res?.message || 'Gagal melakukan check');
    }
  },

  formatTimeShort(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  },

  async checkDrift(id) {
    Toast.info('Memeriksa perbedaan (drift)...');
    const res = await Api.get('git', { action: 'drift', project_id: id });
    if (res?.success) {
      if (res.data.is_drift) {
        Swal.fire({
          title: '⚠️ Drift Terdeteksi!',
          html: `<p class="mb-2">Ditemukan <strong>${res.data.count}</strong> perubahan manual di server yang tidak ada di Git:</p>
                 <div class="terminal text-left text-xs max-h-40 overflow-auto">${res.data.changes.join('<br>')}</div>
                 <p class="mt-2 text-xs text-muted">Gunakan <code>git reset --hard</code> (Rollback) jika ingin menyamakan kembali.</p>`,
          icon: 'warning'
        });
      } else {
        Toast.success('Project sinkron! (In Sync)');
      }
      this.fetchProjects();
    } else {
      Toast.error(res?.message || 'Gagal memeriksa drift');
    }
  },

  getSyncBadge(p) {
    if (!p.last_drift_check) return '<span class="text-[9px] text-muted opacity-50 italic">Not checked</span>';
    if (parseInt(p.is_drift)) {
      return `<span class="badge badge-danger !text-[8px] !px-1 !py-0 cursor-help" title="Ada perubahan manual di server (Out of Sync)">OUT OF SYNC</span>`;
    }
    return `<span class="badge badge-success !text-[8px] !px-1 !py-0" title="Server sesuai dengan Git repository">IN SYNC</span>`;
  },

  async fetchDiskUsage(id) {
    const res = await Api.get('resources', { action: 'disk', project_id: id });
    const el = document.getElementById('disk-usage-' + id);
    if (res?.success && el) {
      el.innerHTML = `💾 ${res.data.size_human}`;
      el.title = `Full path: ${res.data.path}`;
    } else if (el) {
      el.innerHTML = '<span class="text-danger">error</span>';
    }
  },

  async showLogs(id) {
    const res = await Api.get('resources', { action: 'logs_list', project_id: id });
    if (!res?.success) {
      Toast.error(res?.message || 'Gagal memuat daftar log');
      return;
    }

    if (res.data.length === 0) {
      Swal.fire('Info', 'Tidak ditemukan file log (.log, .txt, storage/logs) di project ini.', 'info');
      return;
    }

    let html = `
      <div class="text-left">
        <p class="text-xs text-muted mb-4">Pilih file log untuk dibuka:</p>
        <div class="space-y-2 max-h-64 overflow-auto border rounded p-2 bg-gray-50">
          ${res.data.map(f => `
            <div class="flex justify-between items-center p-2 hover:bg-white rounded border border-transparent hover:border-gray-200 cursor-pointer group"
                 onclick="swal.clickConfirm(); PageProjects.viewLog(${id}, '${f.name}')">
              <div class="flex flex-col">
                <span class="text-xs font-bold text-indigo-600 truncate max-w-[280px]">${f.name}</span>
                <span class="text-[10px] text-muted">${f.mtime}</span>
              </div>
              <span class="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded">${f.size_human}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    Swal.fire({
      title: '📁 Log Explorer',
      html: html,
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: 'Tutup'
    });
  },

  async viewLog(projectId, filename) {
    Toast.info(`Membuka ${filename}...`);
    const res = await Api.get('resources', { 
      action: 'logs_read', 
      project_id: projectId, 
      file: filename 
    });

    if (res?.success) {
      Swal.fire({
        title: filename,
        html: `
          <div class="text-left">
            <div class="flex justify-between text-[10px] text-muted mb-2">
              <span>Size: ${res.data.size_human}</span>
              <span>Showing last 500 lines</span>
            </div>
            <div class="terminal text-[10px] max-h-[70vh] overflow-auto whitespace-pre-wrap leading-relaxed">${this.escapeLog(res.data.content)}</div>
          </div>
        `,
        width: '900px',
        confirmButtonText: 'Tutup',
        showDenyButton: true,
        denyButtonText: 'Refresh',
        customClass: {
          container: 'log-viewer-swal'
        }
      }).then((result) => {
        if (result.isDenied) {
          this.viewLog(projectId, filename);
        }
      });
    } else {
      Toast.error(res?.message || 'Gagal membaca log');
    }
  },

  escapeLog(s) {
    if (!s) return '<span class="italic text-muted">File log kosong</span>';
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/ERROR/g, '<span class="text-danger font-bold">ERROR</span>')
            .replace(/WARNING/g, '<span class="text-warning font-bold">WARNING</span>')
            .replace(/INFO/g, '<span class="text-info font-bold">INFO</span>');
  },

  async checkSecurity(id) {
    Toast.info('Menjalankan audit keamanan...');
    const res = await Api.get('security', { action: 'check', project_id: id });
    if (res?.success) {
      this.showSecurityReport(res.data);
      this.fetchProjects();
    } else {
      Toast.error(res?.message || 'Gagal menjalankan audit');
    }
  },

  showSecurityReport(data) {
    const findings = data.sensitive_files.filter(f => f.status === 'Exposed');
    const phpAlert = data.php_status === 'Outdated' ? `<li>⚠️ Versi PHP (${data.php_info}) sudah usang.</li>` : '';
    
    let html = `
      <div class="text-left">
        <div class="flex justify-between items-center mb-4">
          <span class="text-lg font-bold">Security Score: ${data.score}/100</span>
          <span class="badge ${data.score >= 90 ? 'badge-success' : data.score >= 70 ? 'badge-warning' : 'badge-danger'}">
            ${data.score >= 90 ? 'A - Secure' : data.score >= 70 ? 'B - Warning' : 'C - Critical'}
          </span>
        </div>
        
        <h4 class="font-bold text-sm mb-2">Temuan Utama:</h4>
        <ul class="text-xs mb-4 list-disc pl-4">
          ${findings.length === 0 && !phpAlert ? '<li>✅ Tidak ditemukan celah keamanan kritis.</li>' : ''}
          ${findings.map(f => `<li class="text-danger">❌ File <strong>${f.file}</strong> dapat diakses publik!</li>`).join('')}
          ${phpAlert}
        </ul>

        <h4 class="font-bold text-sm mb-2">Detail Pengecekan:</h4>
        <div class="bg-gray-50 border rounded p-2 text-[10px] space-y-1">
          ${data.sensitive_files.map(f => `
            <div class="flex justify-between">
              <span>${f.file} (${f.description})</span>
              <span class="${f.status === 'Exposed' ? 'text-danger font-bold' : 'text-success'}">${f.status}</span>
            </div>
          `).join('')}
          <div class="flex justify-between border-t mt-1 pt-1">
            <span>Server/PHP Version</span>
            <span class="${data.php_status === 'Outdated' ? 'text-warning font-bold' : 'text-success'}">${data.php_info}</span>
          </div>
        </div>
      </div>
    `;

    Swal.fire({
      title: 'Security Audit Report',
      html: html,
      width: '500px',
      confirmButtonText: 'Tutup'
    });
  },

  getSecurityBadge(p) {
    if (p.security_score === null) return '';
    const score = parseInt(p.security_score);
    let color = 'text-success';
    if (score < 90) color = 'text-warning';
    if (score < 70) color = 'text-danger';
    
    return `<span class="cursor-pointer ${color} ml-1" title="Security Score: ${score}/100 (Klik untuk detail)" onclick="event.stopPropagation();PageProjects.checkSecurity(${p.id})">🛡️ ${score}</span>`;
  },

  toggleDropdown(e, id, name, app_url) {
    e.stopPropagation();
    const btn = e.currentTarget;
    
    // Create/get global menu
    let menu = document.getElementById('global-action-menu');
    if (!menu) {
      menu = document.createElement('div');
      menu.id = 'global-action-menu';
      menu.className = 'dropdown-menu dropdown-menu-fixed';
      document.body.appendChild(menu);
    }

    const isOpen = menu.classList.contains('open') && menu.dataset.activeId == id;
    
    // Close others
    this.closeGlobalMenu();
    
    if (!isOpen) {
      menu.dataset.activeId = id;
      menu.innerHTML = `
        <div class="px-3 py-1.5 border-b bg-gray-50 mb-1">
          <div class="text-[10px] font-bold text-muted uppercase">Project: ${name}</div>
        </div>
        <div class="dropdown-item" onclick="PageProjects.showLogs(${id}); PageProjects.closeGlobalMenu()"><span>📄</span> View Logs</div>
        <div class="dropdown-item" onclick="PageProjects.checkSecurity(${id}); PageProjects.closeGlobalMenu()"><span>🛡️</span> Security Audit</div>
        <div class="dropdown-item" onclick="PageProjects.checkDrift(${id}); PageProjects.closeGlobalMenu()"><span>⚖</span> Check Sync</div>
        <div class="dropdown-item" onclick="PageProjects.backupProject(${id}); PageProjects.closeGlobalMenu()"><span>🗄️</span> Backup Database</div>
        ${app_url ? `<div class="dropdown-item" onclick="PageProjects.checkHealth(${id}); PageProjects.closeGlobalMenu()"><span>🔍</span> Check Health</div>` : ''}
        <hr class="my-1 border-gray-100">
        <div class="dropdown-item" onclick="PageProjects.showModal(${id}); PageProjects.closeGlobalMenu()"><span>✎</span> Edit Project</div>
        <div class="dropdown-item text-danger" onclick="PageProjects.deleteProject(${id}); PageProjects.closeGlobalMenu()"><span>🗑</span> Hapus</div>
      `;

      const rect = btn.getBoundingClientRect();
      const menuHeight = 260; // Estimated
      const spaceBelow = window.innerHeight - rect.bottom;
      
      let top = rect.bottom + 5;
      let left = rect.right - 180; // Menu width approx 180

      // Viewport safety
      if (spaceBelow < menuHeight) {
        top = rect.top - menuHeight;
      }
      left = Math.max(10, Math.min(left, window.innerWidth - 190));

      menu.style.top = `${top}px`;
      menu.style.left = `${left}px`;
      menu.classList.add('open');
      btn.classList.add('active');
    }
  },

  closeGlobalMenu() {
    const menu = document.getElementById('global-action-menu');
    if (menu) {
      menu.classList.remove('open');
      delete menu.dataset.activeId;
    }
    document.querySelectorAll('.dropdown-btn').forEach(b => b.classList.remove('active'));
  },

  async backupProject(id) {
    if (this.isBackingUp) return;
    this.isBackingUp = true;
    
    Toast.info('Sedang melakukan backup database project...');
    
    try {
      const res = await Api.post('backup', { action: 'project_save', id });
      if (res?.success) {
        Swal.fire({
          title: 'Berhasil',
          text: `Backup berhasil disimpan: ${res.data.filename}`,
          icon: 'success',
          showCancelButton: true,
          confirmButtonText: 'Buka Menu Backup',
          cancelButtonText: 'Tutup'
        }).then(result => {
          if (result.isConfirmed) {
            location.hash = '#backup';
          }
        });
      } else {
        Swal.fire('Gagal', res?.message || 'Gagal melakukan backup', 'error');
      }
    } catch (err) {
      Toast.error('Gagal menghubungi server');
    } finally {
      this.isBackingUp = false;
    }
  }
};

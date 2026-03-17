import { Api, Toast } from "../api.js";

export const PageProjects = {
  async render() {
    const view = document.getElementById('page-view');
    const canManage = window.CurrentUser?.permissions?.projects?.includes('manage');

    view.innerHTML = `
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

      <div class="card mb-4 overflow-hidden">
        <div class="table-wrap">
          <table id="projects-table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Repo Name</th>
                <th>Folder</th>
                <th>Branch</th>
                <th>Version</th>
                <th>Last Status</th>
                <th>Last Deploy</th>
                ${canManage ? '<th class="text-right">Aksi</th>' : ''}
              </tr>
            </thead>
            <tbody id="projects-tbody">
              <tr><td colspan="7" class="text-center py-8"><span class="spinner"></span> Memuat projects...</td></tr>
            </tbody>
          </table>
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
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Belum ada project ditambahkan.</td></tr>`;
      return;
    }

    tbody.innerHTML = res.data.map(p => `
      <tr>
        <td>
          <div class="font-bold text-primary">${p.name}</div>
          ${!parseInt(p.is_active) ? `<span class="badge badge-danger">Nonaktif</span>` : ''}
        </td>
        <td><code class="text-xs">${p.repo_name}</code></td>
        <td><code class="text-xs">${p.folder_name}</code></td>
        <td><span class="badge badge-indigo">${p.branch || 'main'}</span></td>
        <td>
          <div class="flex items-center gap-1">
            <span class="text-xs font-mono">${p.current_version || '1.0.0'}</span>
            <button class="btn-icon text-xs" title="Changelog" onclick="PageProjects.showChangelog(${p.id}, '${p.name}')">📋</button>
          </div>
        </td>
        <td>
          ${p.last_status === 'success' ? `<span class="badge badge-success">Berhasil</span>` : 
            p.last_status === 'failed' ? `<span class="badge badge-danger">Gagal</span>` : 
            p.last_status === 'running' ? `<span class="badge badge-info">Running</span>` : 
            `<span class="badge badge-warning">Belum Deploy</span>`}
        </td>
        <td class="text-xs text-muted">${p.last_deploy || '-'}</td>
        ${canManage ? `
          <td class="text-right">
            <div class="flex gap-2 justify-end">
              <button class="btn-icon" title="Edit" onclick="PageProjects.showModal(${p.id})">✎</button>
              <button class="btn-icon" title="Hapus" onclick="PageProjects.deleteProject(${p.id})">🗑</button>
            </div>
          </td>
        ` : ''}
      </tr>
    `).join('');
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
      const res = await Api.get('projects', { action: 'detail', id });
      if (res?.success) {
        const p = res.data;
        document.getElementById('proj-name').value = p.name;
        document.getElementById('proj-repo').value = p.repo_name;
        document.getElementById('proj-folder').value = p.folder_name;
        document.getElementById('proj-branch').value = p.branch;
        document.getElementById('proj-version').value = p.current_version;
        document.getElementById('proj-secret').value = p.webhook_secret;
        document.getElementById('proj-desc').value = p.description;
        document.getElementById('proj-active').checked = parseInt(p.is_active) === 1;
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
      current_version: document.getElementById('proj-version').value.trim() || '1.0.0',
      webhook_secret: document.getElementById('proj-secret').value.trim(),
      description:    document.getElementById('proj-desc').value.trim(),
      is_active:      document.getElementById('proj-active').checked ? 1 : 0
    };

    const res = await Api.post('projects', data);
    if (res?.success) {
      Toast.success(res.message);
      document.getElementById('project-modal').classList.remove('open');
      this.fetchProjects();
    } else {
      alertEl.textContent = res?.message || 'Gagal menyimpan';
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
  }
};

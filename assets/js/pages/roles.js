// ============================================================
// pages/roles.js - Roles & Permissions Management
// ============================================================
import { Api, Toast } from "../api.js";

export const PageRoles = (() => {
  let allPerms = [];

  async function render() {
    const view = document.getElementById('page-view');
    const canManage = window.CurrentUser?.permissions?.roles?.includes('manage');

    // Load all permissions upfront
    const permsRes = await Api.get('roles', { action: 'permissions' });
    allPerms = permsRes?.data || [];

    view.innerHTML = `
      <div class="card mb-4">
        <div class="flex items-center justify-between mb-4">
          <h2 style="font-size:15px;font-weight:600;margin:0">Daftar Role</h2>
          ${canManage ? '<button class="btn btn-primary btn-sm" onclick="PageRoles.openModal()">+ Tambah Role</button>' : ''}
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Name</th><th>Label</th><th>Users</th><th>Permissions</th><th></th></tr></thead>
            <tbody id="roles-tbody"><tr><td colspan="6"><div style="padding:30px;text-align:center"><div class="spinner"></div></div></td></tr></tbody>
          </table>
        </div>
      </div>

      <!-- Modal -->
      <div class="modal-overlay" id="role-modal">
        <div class="modal-box" style="max-width:600px">
          <div class="modal-header">
            <span class="modal-title" id="role-modal-title">Tambah Role</span>
            <button class="modal-close" onclick="PageRoles.closeModal()">×</button>
          </div>
          <div class="modal-body">
            <div id="role-modal-alert" class="alert alert-error" style="display:none"></div>
            <input type="hidden" id="role-id">
            <div class="form-group" id="role-name-group">
              <label class="form-label">Name <span class="text-muted text-sm">(huruf kecil, underscore)</span></label>
              <input type="text" id="role-name" class="form-input" placeholder="custom_role">
            </div>
            <div class="form-group">
              <label class="form-label">Label</label>
              <input type="text" id="role-label" class="form-input" placeholder="Custom Role">
            </div>
            <div class="form-group">
              <label class="form-label">Permissions</label>
              <div id="perm-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;max-height:280px;overflow-y:auto;padding:4px"></div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" onclick="PageRoles.closeModal()">Batal</button>
            <button class="btn btn-primary" onclick="PageRoles.saveRole()">Simpan</button>
          </div>
        </div>
      </div>`;

    await fetchRoles();
  }

  async function fetchRoles() {
    const res = await Api.get('roles', { action: 'list' });
    const tbody = document.getElementById('roles-tbody');
    const canManage = window.CurrentUser?.permissions?.roles?.includes('manage');

    tbody.innerHTML = res?.data?.map((r, i) => `
      <tr>
        <td>${i+1}</td>
        <td><code class="font-mono">${r.name}</code></td>
        <td>${r.label}</td>
        <td><span class="badge badge-indigo">${r.user_count} user</span></td>
        <td><span class="badge badge-info">${r.perm_count} izin</span></td>
        <td>
          ${canManage ? `
            <button class="btn-icon" onclick="PageRoles.openModal(${r.id})" title="Edit">✏</button>
            ${r.name !== 'admin' ? `<button class="btn-icon" onclick="PageRoles.deleteRole(${r.id})" title="Hapus" style="margin-left:4px">🗑</button>` : ''}
          ` : '—'}
        </td>
      </tr>`).join('') || `<tr><td colspan="6"><div class="empty-state" style="padding:20px"><p>Tidak ada role</p></div></td></tr>`;
  }

  async function openModal(id = null) {
    document.getElementById('role-modal-title').textContent = id ? 'Edit Role' : 'Tambah Role';
    document.getElementById('role-id').value = id || '';
    document.getElementById('role-name').value = '';
    document.getElementById('role-label').value = '';
    document.getElementById('role-modal-alert').style.display = 'none';
    document.getElementById('role-name-group').style.display = id ? 'none' : '';

    // Load detail if editing
    let checkedIds = [];
    if (id) {
      const detail = await Api.get('roles', { action: 'detail', id });
      if (detail?.data) {
        document.getElementById('role-label').value = detail.data.label;
        document.getElementById('role-name').value  = detail.data.name;
        checkedIds = detail.data.permissions.map(p => p.id);
      }
    }

    // Group permissions by module
    const grouped = {};
    allPerms.forEach(p => {
      if (!grouped[p.module]) grouped[p.module] = [];
      grouped[p.module].push(p);
    });

    document.getElementById('perm-grid').innerHTML = Object.entries(grouped).map(([mod, perms]) => `
      <div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:10px;border:1px solid var(--border)">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:8px;font-weight:600">${mod}</div>
        ${perms.map(p => `
          <label style="display:flex;align-items:center;gap:6px;margin-bottom:4px;cursor:pointer;font-size:12.5px">
            <input type="checkbox" name="perm_ids" value="${p.id}" ${checkedIds.includes(p.id)?'checked':''}>
            ${p.action}
          </label>`).join('')}
      </div>`).join('');

    document.getElementById('role-modal').classList.add('open');
  }

  function closeModal() { document.getElementById('role-modal').classList.remove('open'); }

  async function saveRole() {
    const id     = document.getElementById('role-id').value;
    const alertEl = document.getElementById('role-modal-alert');
    const permIds = [...document.querySelectorAll('[name="perm_ids"]:checked')].map(c => c.value);

    const data = {
      action:         id ? 'update' : 'create',
      label:          document.getElementById('role-label').value,
      permission_ids: permIds,
    };
    if (id) data.id = id;
    else data.name = document.getElementById('role-name').value;

    alertEl.style.display = 'none';
    const res = await Api.post('roles', data);

    if (!res?.success) {
      alertEl.textContent = res?.message || 'Gagal menyimpan';
      alertEl.style.display = 'flex';
      return;
    }

    Toast.success(id ? 'Role diupdate' : 'Role dibuat');
    closeModal();
    fetchRoles();
  }

  async function deleteRole(id) {
    const result = await Swal.fire({
      title: 'Hapus Role?',
      text: 'Role ini akan dihapus permanen!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    const res = await Api.post('roles', { action: 'delete', id });
    if (res?.success) {
      Toast.success('Role dihapus');
      fetchRoles();
    } else {
      Toast.error(res?.message || 'Gagal menghapus');
    }
  }

  return { render, openModal, closeModal, saveRole, deleteRole };
})();

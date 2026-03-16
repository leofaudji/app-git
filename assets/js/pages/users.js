// ============================================================
// pages/users.js - User Management Page
// ============================================================
const PageUsers = (() => {
  let allRoles = [];

  async function render() {
    const view = document.getElementById('page-view');
    const canCreate = window.CurrentUser?.permissions?.users?.includes('create');

    // Load roles for form
    const rolesRes = await Api.get('roles', { action: 'list' });
    allRoles = rolesRes?.data || [];

    view.innerHTML = `
      <div class="card mb-4">
        <div class="flex items-center justify-between mb-4">
          <h2 style="font-size:15px;font-weight:600;margin:0">Daftar User</h2>
          ${canCreate ? '<button class="btn btn-primary btn-sm" onclick="PageUsers.openModal()">+ Tambah User</button>' : ''}
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Username</th><th>Nama</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th><th></th></tr></thead>
            <tbody id="users-tbody"><tr><td colspan="8"><div style="padding:30px;text-align:center"><div class="spinner"></div></div></td></tr></tbody>
          </table>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div class="modal-overlay" id="user-modal">
        <div class="modal-box">
          <div class="modal-header">
            <span class="modal-title" id="user-modal-title">Tambah User</span>
            <button class="modal-close" onclick="PageUsers.closeModal()">×</button>
          </div>
          <div class="modal-body">
            <div id="user-modal-alert" class="alert alert-error" style="display:none"></div>
            <form id="user-form">
              <input type="hidden" id="user-id">
              <div class="form-group" id="username-group">
                <label class="form-label">Username</label>
                <input type="text" id="user-username" class="form-input" placeholder="john_doe">
              </div>
              <div class="form-group">
                <label class="form-label">Nama Lengkap</label>
                <input type="text" id="user-fullname" class="form-input" placeholder="John Doe">
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" id="user-email" class="form-input" placeholder="john@example.com">
              </div>
              <div class="form-group">
                <label class="form-label" id="pass-label">Password</label>
                <input type="password" id="user-password" class="form-input" placeholder="••••••">
                <div class="form-hint" id="pass-hint">Kosongkan jika tidak ingin mengubah password</div>
              </div>
              <div class="form-group">
                <label class="form-label">Role</label>
                <div id="role-checkboxes" style="display:flex;flex-wrap:wrap;gap:10px"></div>
              </div>
              <div class="form-group">
                <label class="toggle-wrap">
                  <label class="toggle">
                    <input type="checkbox" id="user-active" checked>
                    <span class="toggle-slider"></span>
                  </label>
                  <span class="form-label" style="margin:0">Aktif</span>
                </label>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" onclick="PageUsers.closeModal()">Batal</button>
            <button class="btn btn-primary" id="user-save-btn" onclick="PageUsers.saveUser()">Simpan</button>
          </div>
        </div>
      </div>`;

    await fetchUsers();
  }

  async function fetchUsers() {
    const res = await Api.get('users', { action: 'list' });
    const tbody = document.getElementById('users-tbody');
    if (!res?.success) { tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">Gagal memuat</td></tr>`; return; }

    const canUpdate = window.CurrentUser?.permissions?.users?.includes('update');
    const canDelete = window.CurrentUser?.permissions?.users?.includes('delete');

    tbody.innerHTML = res.data.map((u, i) => `
      <tr>
        <td>${i+1}</td>
        <td><code class="font-mono">${u.username}</code></td>
        <td>${u.full_name}</td>
        <td class="text-sm text-muted">${u.email}</td>
        <td><span class="badge badge-indigo">${u.roles || '-'}</span></td>
        <td><span class="badge ${u.is_active ? 'badge-success' : 'badge-danger'}">${u.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
        <td class="text-sm text-muted">${u.last_login || '-'}</td>
        <td>
          ${canUpdate ? `<button class="btn-icon" onclick="PageUsers.openModal(${u.id})" title="Edit">✏</button>` : ''}
          ${canDelete && u.id != window.CurrentUser?.id ? `<button class="btn-icon" onclick="PageUsers.deleteUser(${u.id})" title="Hapus" style="margin-left:4px">🗑</button>` : ''}
        </td>
      </tr>`).join('') || `<tr><td colspan="8"><div class="empty-state" style="padding:20px"><div class="empty-icon">👥</div><p>Belum ada user</p></div></td></tr>`;
  }

  async function openModal(id = null) {
    document.getElementById('user-modal-title').textContent = id ? 'Edit User' : 'Tambah User';
    document.getElementById('user-id').value = id || '';
    document.getElementById('user-username').value = '';
    document.getElementById('user-fullname').value = '';
    document.getElementById('user-email').value = '';
    document.getElementById('user-password').value = '';
    document.getElementById('user-active').checked = true;
    document.getElementById('user-modal-alert').style.display = 'none';

    // Username field: only on create
    document.getElementById('username-group').style.display = id ? 'none' : '';
    document.getElementById('pass-label').textContent = id ? 'Password Baru' : 'Password';
    document.getElementById('pass-hint').style.display = id ? '' : 'none';

    // Render role checkboxes
    const detail = id ? await Api.get('users', { action: 'detail', id }) : null;
    const checkedIds = detail?.data?.roles?.map(r => r.id) || [];

    document.getElementById('role-checkboxes').innerHTML = allRoles.map(r => `
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;background:rgba(255,255,255,0.04);padding:6px 12px;border-radius:8px;border:1px solid var(--border)">
        <input type="checkbox" name="role_ids" value="${r.id}" ${checkedIds.includes(r.id) ? 'checked' : ''}>
        ${r.label}
      </label>`).join('');

    if (detail?.data) {
      document.getElementById('user-fullname').value = detail.data.full_name;
      document.getElementById('user-email').value = detail.data.email;
      document.getElementById('user-active').checked = !!detail.data.is_active;
    }

    document.getElementById('user-modal').classList.add('open');
  }

  function closeModal() { document.getElementById('user-modal').classList.remove('open'); }

  async function saveUser() {
    const id       = document.getElementById('user-id').value;
    const alertEl  = document.getElementById('user-modal-alert');
    const saveBtn  = document.getElementById('user-save-btn');
    const roleIds  = [...document.querySelectorAll('[name="role_ids"]:checked')].map(c => c.value);

    const data = {
      action:    id ? 'update' : 'create',
      full_name: document.getElementById('user-fullname').value,
      email:     document.getElementById('user-email').value,
      password:  document.getElementById('user-password').value,
      is_active: document.getElementById('user-active').checked ? '1' : '',
      role_ids:  roleIds,
    };

    if (!id) {
      data.username = document.getElementById('user-username').value;
    } else {
      data.id = id;
    }

    saveBtn.disabled = true;
    alertEl.style.display = 'none';

    const res = await Api.post('users', data);
    saveBtn.disabled = false;

    if (!res?.success) {
      alertEl.textContent = res?.message || 'Gagal menyimpan';
      alertEl.style.display = 'flex';
      return;
    }

    Toast.success(id ? 'User diupdate' : 'User dibuat');
    closeModal();
    fetchUsers();
  }

  async function deleteUser(id) {
    if (!confirm('Hapus user ini?')) return;
    const res = await Api.post('users', { action: 'delete', id });
    if (res?.success) { Toast.success('User dihapus'); fetchUsers(); }
    else Toast.error(res?.message || 'Gagal menghapus');
  }

  return { render, openModal, closeModal, saveUser, deleteUser };
})();

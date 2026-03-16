// ============================================================
// pages/profile.js - User Profile Page
// ============================================================
import { Api, Toast } from "../api.js";

export const PageProfile = (() => {

  async function render() {
    const view = document.getElementById('page-view');

    const res = await Api.get('profile', { action: 'get' });
    if (!res?.success) {
      view.innerHTML = `<div class="alert alert-error">${res?.message || 'Gagal memuat profil'}</div>`;
      return;
    }

    const u = res.data;
    const initials = u.full_name.split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase();

    view.innerHTML = `
      <div class="grid-2">
        <!-- Profile Card -->
        <div class="card">
          <div style="text-align:center;margin-bottom:24px">
            <div style="width:80px;height:80px;background:linear-gradient(135deg,#6366f1,#818cf8);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#fff;margin:0 auto 16px">${initials}</div>
            <h2 style="font-size:18px;font-weight:700;margin:0">${u.full_name}</h2>
            <div class="text-muted text-sm">@${u.username}</div>
            <div class="text-muted text-sm" style="margin-top:4px">${u.email}</div>
            <div style="margin-top:10px">
              <span class="badge badge-indigo">Member sejak ${u.created_at?.split(' ')[0]}</span>
            </div>
          </div>

          <div id="profile-alert" class="alert alert-success" style="display:none"></div>

          <div class="form-group">
            <label class="form-label">Nama Lengkap</label>
            <input type="text" id="prof-fullname" class="form-input" value="${u.full_name}">
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" id="prof-email" class="form-input" value="${u.email}">
          </div>

          <button class="btn btn-primary" onclick="PageProfile.saveProfile()">💾 Update Profil</button>
        </div>

        <!-- Change Password -->
        <div class="card">
          <div class="card-title">🔒 Ubah Password</div>

          <div id="pass-alert" class="alert" style="display:none"></div>

          <div class="form-group">
            <label class="form-label">Password Lama</label>
            <input type="password" id="prof-old-pass" class="form-input" placeholder="••••••••">
          </div>
          <div class="form-group">
            <label class="form-label">Password Baru</label>
            <input type="password" id="prof-new-pass" class="form-input" placeholder="Min. 6 karakter">
          </div>
          <div class="form-group">
            <label class="form-label">Konfirmasi Password Baru</label>
            <input type="password" id="prof-conf-pass" class="form-input" placeholder="••••••••">
          </div>

          <button class="btn btn-primary" onclick="PageProfile.changePassword()">🔑 Ubah Password</button>

          <div style="margin-top:24px;padding-top:20px;border-top:1px solid var(--border)">
            <div class="card-title">ℹ Info Akun</div>
            <div style="display:flex;flex-direction:column;gap:8px;font-size:13px;color:var(--text-muted)">
              <div>Username: <strong style="color:var(--text-primary)">${u.username}</strong></div>
              <div>Last Login: <strong style="color:var(--text-primary)">${u.last_login || 'Belum pernah'}</strong></div>
              <div>Terdaftar: <strong style="color:var(--text-primary)">${u.created_at}</strong></div>
            </div>
          </div>
        </div>
      </div>`;
  }

  async function saveProfile() {
    const alertEl = document.getElementById('profile-alert');
    const data = {
      action:    'update',
      full_name: document.getElementById('prof-fullname').value,
      email:     document.getElementById('prof-email').value,
    };

    const res = await Api.post('profile', data);
    alertEl.style.display = 'flex';
    if (!res?.success) {
      alertEl.className = 'alert alert-error';
      alertEl.textContent = res?.message || 'Gagal menyimpan';
      return;
    }
    alertEl.className = 'alert alert-success';
    alertEl.textContent = '✓ Profil berhasil diupdate';
    Toast.success('Profil diupdate');

    // Update sidebar user name
    document.getElementById('user-full-name').textContent = data.full_name;
    const initials = data.full_name.split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase();
    document.getElementById('user-avatar-initials').textContent = initials;

    setTimeout(() => alertEl.style.display = 'none', 3000);
  }

  async function changePassword() {
    const alertEl  = document.getElementById('pass-alert');
    const oldPass  = document.getElementById('prof-old-pass').value;
    const newPass  = document.getElementById('prof-new-pass').value;
    const confPass = document.getElementById('prof-conf-pass').value;

    alertEl.style.display = 'none';

    if (!oldPass || !newPass) {
      alertEl.className = 'alert alert-error';
      alertEl.textContent = 'Password lama dan baru wajib diisi';
      alertEl.style.display = 'flex';
      return;
    }
    if (newPass !== confPass) {
      alertEl.className = 'alert alert-error';
      alertEl.textContent = 'Konfirmasi password tidak sesuai';
      alertEl.style.display = 'flex';
      return;
    }
    if (newPass.length < 6) {
      alertEl.className = 'alert alert-error';
      alertEl.textContent = 'Password baru minimal 6 karakter';
      alertEl.style.display = 'flex';
      return;
    }

    const res = await Api.post('profile', {
      action:       'update',
      full_name:    window.CurrentUser?.full_name,
      old_password: oldPass,
      new_password: newPass,
    });

    alertEl.style.display = 'flex';
    if (!res?.success) {
      alertEl.className = 'alert alert-error';
      alertEl.textContent = res?.message || 'Gagal mengubah password';
    } else {
      alertEl.className = 'alert alert-success';
      alertEl.textContent = '✓ Password berhasil diubah';
      document.getElementById('prof-old-pass').value = '';
      document.getElementById('prof-new-pass').value = '';
      document.getElementById('prof-conf-pass').value = '';
      Toast.success('Password diubah');
    }
  }

  return { render, saveProfile, changePassword };
})();

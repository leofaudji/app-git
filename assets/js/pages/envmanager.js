// ============================================================
// pages/envmanager.js - Environment (.env) Manager
// ============================================================
import { Api, Toast } from "../api.js";

export const PageEnvManager = (() => {

  let _sections = {};

  async function render() {
    const view = document.getElementById('page-view');
    view.innerHTML = `
      <div class="fade-in-up">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h2 class="text-2xl font-bold tracking-tight text-primary">Environment (.env) Manager</h2>
            <p class="text-muted text-sm mt-1">Edit konfigurasi server secara aman langsung dari dashboard.</p>
          </div>
          <button onclick="PageEnvManager.saveAll()" id="env-save-btn" class="btn btn-primary flex items-center gap-2">
            💾 Simpan .env
          </button>
        </div>

        <div id="env-status-banner" style="display:none" class="alert alert-warning mb-6">
          ⚠ File <code>.env</code> belum ada. Data di bawah diambil dari template <code>.env.example</code>. Klik <strong>Simpan .env</strong> untuk membuatnya.
        </div>

        <div id="env-readonly-banner" style="display:none" class="alert alert-error mb-6">
          🔒 File <code>.env</code> tidak dapat diedit karena tidak memiliki permission write. Hubungi administrator server.
        </div>

        <!-- Main Grid -->
        <div class="grid-3 gap-6 items-start">
          <!-- Sections Editor (col-span-2) -->
          <div class="col-span-2">
            <div class="flex items-center gap-2 mb-4">
              <span class="w-2 h-6 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]"></span>
              <h3 class="text-base font-bold text-primary">Konfigurasi Aktif</h3>
            </div>
            <div id="env-sections-container">
              <div class="card p-8 text-center text-muted">
                <div class="spinner" style="width:28px;height:28px;margin:0 auto 10px"></div>
                Memuat konfigurasi...
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="col-span-1 flex flex-col gap-6">
            <!-- Add New Key -->
            <div>
              <div class="flex items-center gap-2 mb-4">
                <span class="w-2 h-6 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.4)]"></span>
                <h3 class="text-base font-bold text-primary">Tambah Key Baru</h3>
              </div>
              <div class="card border-0 shadow-md card-accent-green p-6">
                <div class="form-group">
                  <label class="form-label text-xs uppercase font-bold">Nama Key</label>
                  <input type="text" id="new-key-name" class="form-input font-mono"
                    placeholder="NAMA_KEY" oninput="this.value = this.value.toUpperCase()">
                  <div class="form-hint">Huruf besar, angka, dan underscore saja.</div>
                </div>
                <div class="form-group">
                  <label class="form-label text-xs uppercase font-bold">Nilai</label>
                  <input type="text" id="new-key-value" class="form-input font-mono" placeholder="nilai_key">
                </div>
                <button onclick="PageEnvManager.addKey()" class="btn btn-success w-full justify-center">
                  ➕ Tambahkan
                </button>
              </div>
            </div>

            <!-- Info Card -->
            <div>
              <div class="flex items-center gap-2 mb-4">
                <span class="w-2 h-6 bg-amber-400 rounded-full"></span>
                <h3 class="text-base font-bold text-primary">Informasi</h3>
              </div>
              <div class="card border-0 shadow-md p-6 space-y-3 text-xs text-muted">
                <p>📍 File <code class="bg-gray-100 px-1 rounded">.env</code> disimpan di root folder aplikasi.</p>
                <p>🔒 Field bertanda <span class="font-bold text-amber-600">🔑</span> adalah data sensitif. Nilainya disembunyikan secara default.</p>
                <p>💾 Setiap simpan akan otomatis membuat backup <code class="bg-gray-100 px-1 rounded">.env.backup_*</code> di folder <code>backups/</code>.</p>
                <p>🔄 Perubahan <code>DB_*</code> memerlukan restart PHP-FPM atau server.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    await loadEnv();
  }

  async function loadEnv() {
    const container = document.getElementById('env-sections-container');
    const res = await Api.get('env', { action: 'get' });

    if (!res?.success) {
      container.innerHTML = `<div class="alert alert-error">Gagal memuat konfigurasi .env.</div>`;
      return;
    }

    const { sections, exists, writable } = res.data;
    _sections = sections;

    if (!exists) {
      document.getElementById('env-status-banner').style.display = 'block';
    }
    if (!writable) {
      document.getElementById('env-readonly-banner').style.display = 'block';
      document.getElementById('env-save-btn').disabled = true;
    }

    if (!sections || Object.keys(sections).length === 0) {
      container.innerHTML = `
        <div class="card p-8 text-center text-muted">
          <div style="font-size:2.5rem;opacity:.3">📄</div>
          <p class="mt-3 text-sm">File .env tidak ditemukan atau kosong.</p>
          <p class="text-xs mt-1">Gunakan form <strong>Tambah Key Baru</strong> untuk mulai mengisi konfigurasi.</p>
        </div>`;
      return;
    }

    container.innerHTML = Object.entries(sections).map(([sectionName, keys]) => `
      <div class="card border-0 shadow-md overflow-hidden mb-5">
        <div class="px-6 py-3 border-b flex items-center gap-2" style="background:linear-gradient(90deg,#f8fafc,#fff)">
          <span class="w-1.5 h-4 bg-indigo-400 rounded-full"></span>
          <h4 class="text-xs font-bold uppercase tracking-widest text-muted">${sectionName}</h4>
        </div>
        <div class="p-6 space-y-4">
          ${keys.map(item => `
            <div class="flex items-center gap-3" data-key="${item.key}">
              <label class="text-xs font-mono font-bold text-gray-700 w-44 shrink-0 flex items-center gap-1">
                ${item.sensitive ? '<span title="Sensitive key" class="text-amber-500">🔑</span>' : ''}
                ${item.key}
              </label>
              <div class="flex-1 flex gap-2">
                <input
                  type="${item.sensitive ? 'password' : 'text'}"
                  id="env-${item.key}"
                  class="form-input font-mono text-xs flex-1"
                  value="${escHtml(item.value)}"
                  placeholder="(kosong)">
                ${item.sensitive
                  ? `<button type="button" onclick="PageEnvManager.toggleSensitive('env-${item.key}')"
                       class="btn btn-ghost btn-xs shrink-0" title="Tampilkan/Sembunyikan">👁</button>`
                  : ''}
              </div>
              <button onclick="PageEnvManager.deleteKey('${item.key}')"
                class="btn btn-ghost btn-xs text-danger hover:bg-red-50 shrink-0" title="Hapus key ini">🗑</button>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  async function saveAll() {
    const btn = document.getElementById('env-save-btn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Menyimpan...'; }

    // Collect all inputs
    const pairs = [];
    document.querySelectorAll('[data-key]').forEach(row => {
      const key = row.dataset.key;
      const input = document.getElementById('env-' + key);
      if (input) pairs.push({ key, value: input.value });
    });

    if (pairs.length === 0) {
      Toast.error('Tidak ada data untuk disimpan');
      if (btn) { btn.disabled = false; btn.innerHTML = '💾 Simpan .env'; }
      return;
    }

    const res = await Api.post('env?action=save', { pairs });
    if (btn) { btn.disabled = false; btn.innerHTML = '💾 Simpan .env'; }

    if (res?.success) {
      Toast.success(res.message || '.env berhasil disimpan');
      // Hide "not exists" banner since it now exists
      const banner = document.getElementById('env-status-banner');
      if (banner) banner.style.display = 'none';
    } else {
      Toast.error(res?.message || 'Gagal menyimpan .env');
    }
  }

  async function addKey() {
    const keyEl = document.getElementById('new-key-name');
    const valEl = document.getElementById('new-key-value');
    const key   = keyEl?.value?.trim().toUpperCase();
    const value = valEl?.value ?? '';

    if (!key) { Toast.error('Nama key tidak boleh kosong'); return; }
    if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
      Toast.error('Nama key hanya boleh huruf besar, angka, dan underscore'); return;
    }

    const res = await Api.post('env?action=add_key', { key, value });
    if (res?.success) {
      Toast.success(res.message);
      keyEl.value = '';
      valEl.value = '';
      await loadEnv();
    } else {
      Toast.error(res?.message || 'Gagal menambah key');
    }
  }

  async function deleteKey(key) {
    const result = await Swal.fire({
      title: `Hapus "${key}"?`,
      text: 'Key ini akan dihapus permanen dari file .env.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });
    if (!result.isConfirmed) return;

    const res = await Api.post('env?action=delete_key', { key });
    if (res?.success) {
      Toast.success(res.message);
      await loadEnv();
    } else {
      Toast.error(res?.message || 'Gagal menghapus key');
    }
  }

  function toggleSensitive(id) {
    const inp = document.getElementById(id);
    if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
  }

  function escHtml(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { render, saveAll, addKey, deleteKey, toggleSensitive };
})();

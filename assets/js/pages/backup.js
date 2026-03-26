// ============================================================
// pages/backup.js - Database Backup Manager
// ============================================================
import { Api, Toast } from "../api.js";

export const PageBackup = (() => {

  async function render() {
    const view = document.getElementById('page-view');
    view.innerHTML = `
      <div class="fade-in-up">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h2 class="text-2xl font-bold tracking-tight text-primary">Database Backup Manager</h2>
            <p class="text-muted text-sm mt-1">Lindungi data Anda dengan backup otomatis sebelum deployment.</p>
          </div>
          <button onclick="PageBackup.saveBackup()" class="btn btn-primary flex items-center gap-2">
            💾 Backup Sekarang
          </button>
        </div>

        <div id="backup-alert"></div>

        <!-- Stats Row -->
        <div class="grid-3 gap-6 mb-8">
          <div class="stat-card-premium flex flex-col justify-between bg-mesh-green hover-glow-green border-0 shadow-md">
            <div class="stat-label uppercase tracking-widest text-[10px] font-bold text-success mb-1">Total Backup</div>
            <div class="text-3xl font-bold text-success" id="bk-count">—</div>
            <p class="text-[10px] text-muted mt-2 uppercase tracking-tighter">File tersimpan di disk</p>
          </div>
          <div class="stat-card-premium flex flex-col justify-between bg-mesh-blue hover-glow-blue border-0 shadow-md">
            <div class="stat-label uppercase tracking-widest text-[10px] font-bold text-blue-600 mb-1">Total Ukuran</div>
            <div class="text-3xl font-bold text-blue-700" id="bk-total-size">—</div>
            <p class="text-[10px] text-muted mt-2 uppercase tracking-tighter">Kapasitas yang digunakan</p>
          </div>
          <div class="stat-card-premium flex flex-col justify-between bg-mesh-orange hover-glow-orange border-0 shadow-md">
            <div class="stat-label uppercase tracking-widest text-[10px] font-bold text-orange-600 mb-1">Backup Terakhir</div>
            <div class="text-lg font-bold text-orange-700 truncate" id="bk-last">—</div>
            <p class="text-[10px] text-muted mt-2 uppercase tracking-tighter">Timestamp terbaru</p>
          </div>
        </div>

        <!-- Main Content: History + Restore -->
        <div class="grid-3 gap-6 items-start">

          <!-- Backup History Table (col-span-2) -->
          <div class="col-span-2">
            <div class="flex items-center gap-2 mb-4">
              <span class="w-2 h-6 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]"></span>
              <h3 class="text-base font-bold text-primary">Riwayat Backup</h3>
            </div>
            <div class="card border-0 shadow-md card-accent-indigo overflow-hidden">
              <div class="overflow-x-auto">
                <table class="table w-full">
                  <thead>
                    <tr>
                      <th>Nama File</th>
                      <th>Ukuran</th>
                      <th>Dibuat</th>
                      <th class="text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody id="backup-list">
                    <tr><td colspan="4" class="text-center text-muted py-8">
                      <div class="spinner" style="width:24px;height:24px;margin:0 auto 8px"></div>
                      Memuat riwayat backup...
                    </td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Right Column: Restore + Quick Export -->
          <div class="col-span-1 flex flex-col gap-6">
            <!-- Restore Zone -->
            <div>
              <div class="flex items-center gap-2 mb-4">
                <span class="w-2 h-6 bg-danger rounded-full"></span>
                <h3 class="text-base font-bold text-primary">Restore Database</h3>
              </div>
              <div class="card border-0 shadow-md card-accent-danger p-6">
                <p class="text-xs text-muted mb-4">Upload file <code>.sql</code> hasil backup untuk mengembalikan database ke kondisi sebelumnya.</p>
                <div class="bg-red-50 border border-red-100 rounded-lg p-3 mb-4">
                  <p class="text-xs text-danger font-bold">⚠ Perhatian!</p>
                  <p class="text-xs text-muted mt-1">Restore akan <strong>menimpa seluruh data saat ini</strong>. Pastikan Anda sudah backup data terbaru.</p>
                </div>
                <input type="file" id="restore-file" class="form-input text-xs mb-3" accept=".sql">
                <button onclick="PageBackup.restoreBackup()" class="btn btn-danger w-full justify-center">
                  📤 Restore Database
                </button>
              </div>
            </div>

            <!-- Quick Export -->
            <div>
              <div class="flex items-center gap-2 mb-4">
                <span class="w-2 h-6 bg-gray-400 rounded-full"></span>
                <h3 class="text-base font-bold text-primary">Quick Export</h3>
              </div>
              <div class="card border-0 shadow-md p-6">
                <p class="text-xs text-muted mb-4">Download backup langsung ke browser Anda tanpa menyimpan ke disk server.</p>
                <button onclick="PageBackup.quickExport()" class="btn btn-ghost w-full justify-center">
                  📥 Download Langsung (.sql)
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;

    await loadList();
  }

  async function loadList() {
    const tbody = document.getElementById('backup-list');
    const res = await Api.get('backup', { action: 'list' });

    if (!res?.success) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-6">Gagal memuat riwayat backup.</td></tr>`;
      return;
    }

    const backups = res.data;

    // Update stats
    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setEl('bk-count', backups.length);

    if (backups.length > 0) {
      const totalBytes = backups.reduce((acc, b) => acc + b.size, 0);
      const totalFmt = totalBytes > 1048576
        ? (totalBytes / 1048576).toFixed(2) + ' MB'
        : (totalBytes / 1024).toFixed(1) + ' KB';
      setEl('bk-total-size', totalFmt);
      setEl('bk-last', backups[0].created);
    } else {
      setEl('bk-total-size', '0 KB');
      setEl('bk-last', 'Belum ada');
    }

    if (backups.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="4" class="text-center text-muted py-10">
          <div style="font-size:2.5rem;opacity:.3">💾</div>
          <div class="text-sm mt-2">Belum ada backup tersimpan. Klik <strong>Backup Sekarang</strong> untuk membuat yang pertama.</div>
        </td></tr>`;
      return;
    }

    tbody.innerHTML = backups.map((b, i) => `
      <tr class="${i === 0 ? 'bg-green-50' : ''}">
        <td>
          <div class="flex items-center gap-2">
            ${i === 0 ? '<span class="badge badge-success text-[9px]">TERBARU</span>' : ''}
            <span class="font-mono text-xs truncate max-w-[220px]" title="${b.filename}">${b.filename}</span>
          </div>
        </td>
        <td class="text-xs text-muted font-mono">${b.size_fmt}</td>
        <td class="text-xs text-muted">${b.created}</td>
        <td class="text-right">
          <div class="flex gap-2 justify-end">
            <a href="${window.APP_PATH}/api/backup?action=download&file=${encodeURIComponent(b.filename)}"
               class="btn btn-ghost btn-xs" title="Download" download>📥</a>
            <button onclick="PageBackup.deleteBackup('${b.filename}')"
               class="btn btn-ghost btn-xs text-danger hover:bg-red-50" title="Hapus">🗑</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  async function saveBackup() {
    const btn = document.querySelector('button[onclick="PageBackup.saveBackup()"]');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Memproses...'; }

    const res = await Api.post('backup?action=save', {});
    if (btn) { btn.disabled = false; btn.innerHTML = '💾 Backup Sekarang'; }

    if (res?.success) {
      Toast.success('Backup berhasil: ' + res.data.filename);
      await loadList();
    } else {
      Toast.error(res?.message || 'Backup gagal');
    }
  }

  async function deleteBackup(filename) {
    const result = await Swal.fire({
      title: 'Hapus Backup?',
      text: `File "${filename}" akan dihapus permanen dari server.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });
    if (!result.isConfirmed) return;

    const res = await Api.post('backup?action=delete', { filename });
    if (res?.success) {
      Toast.success(res.message);
      await loadList();
    } else {
      Toast.error(res?.message || 'Gagal menghapus backup');
    }
  }

  async function restoreBackup() {
    const fileInp = document.getElementById('restore-file');
    if (!fileInp?.files?.length) {
      Toast.error('Pilih file backup (.sql) terlebih dahulu');
      return;
    }

    const result = await Swal.fire({
      title: 'Konfirmasi Restore?',
      text: 'PERHATIAN: Seluruh data saat ini akan DIHAPUS dan digantikan dengan data dari file backup!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Lakukan Restore!',
      cancelButtonText: 'Batal'
    });
    if (!result.isConfirmed) return;

    const formData = new FormData();
    formData.append('backup_file', fileInp.files[0]);

    const res = await Api.post('backup?action=import', formData);
    if (res?.success) {
      await Swal.fire('Berhasil!', 'Database berhasil direstore. Halaman akan direfresh.', 'success');
      window.location.reload();
    } else {
      Toast.error(res?.message || 'Gagal restore database');
    }
  }

  function quickExport() {
    window.location.href = `${window.APP_PATH}/api/backup?action=export`;
  }

  return { render, saveBackup, deleteBackup, restoreBackup, quickExport };
})();

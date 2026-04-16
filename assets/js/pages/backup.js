// ============================================================
// pages/backup.js - Database Backup Manager
// ============================================================
import { Api, Toast } from "../api.js";

export const PageBackup = (() => {
  let currentView = 'history';
  let selectedDate = null;
  let currentMonth = new Date();
  let allBackups = [];

  async function render() {
    const view = document.getElementById('page-view');
    view.innerHTML = `
      <div class="fade-in-up">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h2 class="text-2xl font-bold tracking-tight text-primary">Database Backup Manager</h2>
            <p class="text-muted text-sm mt-1">Lindungi data Anda dengan backup otomatis dan pantau riwayat melalui kalender.</p>
          </div>
          <div class="flex gap-3">
             <div class="flex bg-gray-100 p-1 rounded-lg border">
                <button onclick="PageBackup.switchView('history')" id="view-btn-history" class="btn btn-xs px-4 rounded-md transition-all">📜 History</button>
                <button onclick="PageBackup.switchView('calendar')" id="view-btn-calendar" class="btn btn-xs px-4 rounded-md transition-all">📅 Calendar</button>
             </div>
             <button onclick="PageBackup.saveBackup()" class="btn btn-primary flex items-center gap-2">
               💾 Backup Sekarang
             </button>
          </div>
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

          <!-- Backup History Table / Calendar View (col-span-2) -->
          <div class="col-span-2">
            <div id="view-history">
              <div class="flex items-center gap-2 mb-4">
                <span class="w-2 h-6 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]"></span>
                <h3 class="text-base font-bold text-primary">Riwayat Backup</h3>
              </div>
              <div class="card border-0 shadow-md card-accent-indigo overflow-hidden">
                <div class="overflow-x-auto scroll-y-auto">
                  <table class="table w-full">
                    <thead class="sticky top-0 bg-white z-10 shadow-sm">
                      <tr>
                        <th>Identitas Backup</th>
                        <th>Waktu & Ukuran</th>
                        <th class="text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody id="backup-list">
                      <tr><td colspan="5" class="text-center text-muted py-8">
                        <div class="spinner" style="width:24px;height:24px;margin:0 auto 8px"></div>
                        Memuat riwayat backup...
                      </td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div id="view-calendar" style="display:none">
               <div class="flex items-center gap-2 mb-4">
                <span class="w-2 h-6 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                <h3 class="text-base font-bold text-primary">Kalender Backup</h3>
              </div>
              <div id="calendar-mount"></div>
              
              <div id="selected-date-backups" class="mt-6">
                 <!-- filtered list here -->
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

    currentView = 'history';
    selectedDate = null;
    currentMonth = new Date();
    allBackups = [];

    await loadList();
    switchView('history');
  }

  async function loadList(filterDate = null) {
    const tbody = document.getElementById('backup-list');
    const res = await Api.get('backup', { action: 'list' });

    if (!res?.success) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-6">Gagal memuat riwayat backup.</td></tr>`;
      return;
    }

    allBackups = res.data;
    const backups = filterDate 
      ? allBackups.filter(b => b.created.startsWith(filterDate))
      : allBackups;

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
        <tr><td colspan="3" class="text-center text-muted py-10">
          <div style="font-size:2.5rem;opacity:.3">💾</div>
          <div class="text-sm mt-2">Belum ada backup tersimpan. Klik <strong>Backup Sekarang</strong> untuk membuat yang pertama.</div>
        </td></tr>`;
      return;
    }

    const html = backups.map((b, i) => `
      <tr class="${!filterDate && i === 0 ? 'bg-green-50' : ''}">
        <td class="py-3">
          <div class="flex flex-col gap-0.5">
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm ${b.type === 'system' ? 'text-indigo-600' : 'text-emerald-700'}">${b.project}</span>
              <span class="badge ${b.type === 'system' ? 'badge-indigo' : 'badge-emerald'} text-[9px] uppercase px-1.5 py-0.5">${b.type}</span>
              ${!filterDate && i === 0 ? '<span class="badge badge-success text-[9px]">TERBARU</span>' : ''}
            </div>
            <span class="font-mono text-[10px] text-muted truncate max-w-[300px]" title="${b.filename}">
              📂 ${b.filename.split('/').pop()}
            </span>
          </div>
        </td>
        <td class="py-3">
           <div class="flex flex-col">
              <span class="text-xs text-primary font-semibold">${b.created}</span>
              <span class="text-[10px] text-muted font-mono uppercase tracking-tighter mt-0.5">${b.size_fmt}</span>
           </div>
        </td>
        <td class="text-right py-3">
          <div class="flex gap-1 justify-end">
            <a href="${window.APP_PATH}/api/backup?action=download&file=${encodeURIComponent(b.filename)}&type=${b.type}"
               class="btn btn-ghost btn-xs w-8 h-8 rounded-full p-0 flex items-center justify-center hover:bg-indigo-50" title="Download" download>📥</a>
            <button onclick="PageBackup.deleteBackup('${b.filename}', '${b.type}')"
               class="btn btn-ghost btn-xs w-8 h-8 rounded-full p-0 flex items-center justify-center text-danger hover:bg-red-50" title="Hapus">🗑</button>
          </div>
        </td>
      </tr>
    `).join('');

    if (filterDate) {
       const container = document.getElementById('selected-date-backups');
       if (container) {
          container.innerHTML = `
            <div class="card border-0 shadow-md">
               <div class="p-3 border-b bg-gray-50 flex justify-between items-center rounded-t-lg">
                  <span class="text-xs font-bold">Files on ${filterDate}</span>
                  <span class="badge badge-indigo">${backups.length} Files</span>
               </div>
               <div class="table-wrap scroll-y-auto" style="max-height: 250px;">
                  <table class="table w-full">
                     <tbody>${html || '<tr><td class="text-center py-4 text-muted">No backups found for this date.</td></tr>'}</tbody>
                  </table>
               </div>
            </div>
          `;
       }
    } else if (tbody) {
       tbody.innerHTML = html;
    }
    
    if (!filterDate) renderCalendarUI();
  }

  function renderCalendarUI() {
    const mount = document.getElementById('calendar-mount');
    if (!mount) return;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(currentMonth);
    
    // Has backup set for quick lookup
    const datesWithBackup = new Set(allBackups.map(b => b.created.split(' ')[0]));
    const todayStr = new Date().toISOString().split('T')[0];

    let html = `
      <div class="calendar-container shadow-sm">
        <div class="calendar-header">
           <button onclick="PageBackup.navMonth(-1)" class="calendar-nav-btn">‹</button>
           <div class="text-sm font-bold text-slate-800">${monthName}</div>
           <button onclick="PageBackup.navMonth(1)" class="calendar-nav-btn">›</button>
        </div>
        <div class="calendar-grid">
           ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<div class="calendar-day-label">${d}</div>`).join('')}
    `;

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
       html += `<div class="calendar-cell empty"></div>`;
    }

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
       const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
       const hasBackup = datesWithBackup.has(dateStr);
       const isToday = dateStr === todayStr;
       const isSelected = dateStr === selectedDate;

       html += `
         <div class="calendar-cell ${hasBackup ? 'has-backup' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}"
              onclick="PageBackup.selectDate('${dateStr}')">
            ${d}
         </div>
       `;
    }

    html += `</div></div>`;
    mount.innerHTML = html;
  }

  function switchView(view) {
    currentView = view;
    document.getElementById('view-history').style.display = view === 'history' ? 'block' : 'none';
    document.getElementById('view-calendar').style.display = view === 'calendar' ? 'block' : 'none';
    
    const hBtn = document.getElementById('view-btn-history');
    const cBtn = document.getElementById('view-btn-calendar');
    
    if (view === 'history') {
       hBtn.className = 'btn btn-xs px-4 rounded-md bg-white shadow-sm border-gray-200';
       cBtn.className = 'btn btn-xs px-4 rounded-md transition-all text-muted';
    } else {
       cBtn.className = 'btn btn-xs px-4 rounded-md bg-white shadow-sm border-gray-200';
       hBtn.className = 'btn btn-xs px-4 rounded-md transition-all text-muted';
       renderCalendarUI();
    }
  }

  function navMonth(dir) {
     currentMonth.setMonth(currentMonth.getMonth() + dir);
     renderCalendarUI();
  }

  function selectDate(date) {
     selectedDate = date;
     renderCalendarUI();
     loadList(date);
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

  async function deleteBackup(filename, type = 'system') {
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
    
    // Convert to basename for display if needed but pass full path to api
    const res = await Api.post('backup?action=delete', { filename, type });
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

  return { render, saveBackup, deleteBackup, restoreBackup, quickExport, switchView, navMonth, selectDate };
})();

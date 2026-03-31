# Changelog - GitDeploy

Semua perubahan penting pada sistem GitDeploy didokumentasikan di sini.

## [1.6.0] - 2026-04-01
### Added
- **Login Splash Screen**: Transisi mulus setelah login dengan simulasi progress loading dan animasi logo pulse.
- **Logout Confirmation**: Dialog konfirmasi kustom menggunakan SweetAlert2 untuk mencegah logout tidak sengaja.
- **Markdown Support in Changelog**: Dukungan pemformatan `**bold**`, `*italic*`, dan `` `code` `` pada halaman riwayat perubahan.
- **Custom Favicon**: Implementasi `assets/favicon.png` sebagai ikon aplikasi dan Apple touch icon.

### Changed
- **Dashboard Reordering (Contribution First)**: Memindahkan heatmap aktivitas ke posisi paling atas untuk menonjolkan konsistensi pengembangan.
- **Light Theme Header**: Transformasi Topbar dan Sidebar logo ke warna putih bersih (Light) untuk estetika yang lebih modern.
- **Minimalist Version Badge**: Menghapus background pada label versi di sidebar agar lebih bersih dan menyatu dengan tema baru.

### Fixed
- **Changelog Rendering**: Perbaikan sistem rendering yang sebelumnya hanya mendukung plain text.

## [1.4.4] - 2026-03-28
### Added
- **Security Audit System**: Integrasi penuh dengan API eksternal untuk pemindaian kerentanan website (SQL Injection, XSS, dll).
- **Drift Detection**: Peringatan otomatis jika file website berubah tanpa melalui proses deployment Git.
- **Security Score**: Dashboard visual yang menampilkan kesehatan keamanan setiap project (0-100).
- **Audit Logs**: Pencatatan otomatis setiap kali audit keamanan atau drift check dilakukan.

### Fixed
- **Cache Busting**: Perbaikan total pada sistem cache (Service Worker & HTML) untuk memastikan pengguna selalu mendapatkan versi terbaru.
- **UI Responsiveness**: Penyesuaian layout untuk layar kecil dan perbaikan elemen yang tumpang tindih.

## [1.4.1] - 2026-03-19
### Added
- **Database Backup Manager**: Halaman manajemen backup database yang lengkap (`#backup`) dengan fitur save-to-disk, riwayat backup, download, hapus, dan restore.
- **Backup API Upgrade**: Endpoint `backup.php` ditingkatkan dengan aksi `list`, `save`, `delete`, dan `download` untuk mendukung manajemen backup berbasis disk.
- **Perlindungan Folder Backups**: Folder `backups/` otomatis dibuat dengan `.htaccess` deny yang mencegah akses publik langsung.
- **HTML Minification**: Output HTML aplikasi di-minify secara otomatis menggunakan `ob_start` untuk performa dan stealth yang lebih baik.
- **Project Action Dropdown (Smart)**: Merapikan UI dengan menu dropdown yang cerdas; otomatis mendeteksi posisi layar dan membuka ke atas jika ruang di bawah terbatas.

## [1.3.0] - 2026-03-17
### Added
- **Visual Upgrade: Vibrant & Premium Design System**: Implementasi mesh gradients, glassmorphism, dan color-coded accent borders untuk pengalaman UI yang lebih modern.
- **Server Health Monitoring**: Integrasi pemantau real-time untuk CPU, RAM, dan Disk Usage langsung di dashboard.
- **High-Definition Data Visualization**: Grafik monitoring baru dengan palet warna kontras tinggi dan gradasi halus.

### Fixed
- **JavaScript Safety Hardening**: Implementasi layer proteksi pada manipulasi DOM untuk mencegah error *null pointer* dan meningkatkan stabilitas runtime.
- **Perfect Alignment Restoration**: Perbaikan redundansi elemen header dan sinkronisasi tinggi kartu (symmetry) pada layout dashboard.

## [1.2.0] - 2026-03-17
### Added
- Fitur **Automated Changelog Sync** dari file `changelog.md` di setiap project.
- Halaman **Changelog Global** dengan tampilan timeline modern.
- Pendeteksian path otomatis (`APP_PATH`) yang lebih tangguh untuk berbagai lingkungan server.

### Fixed 
- Perbaikan masalah MIME type pada server produksi (VPS/Apache).
- Perbaikan bug modal yang tidak bisa ditutup pada user non-admin.
- Optimalisasi cache-busting untuk Service Worker dan file JavaScript.

### Changed
- Pembaruan desain Sidebar & Login dengan indikator versi sistem.
- Re-strukturisasi API untuk mendukung pengambilan riwayat perubahan lintas project.

## [1.1.0] - 2026-03-14
### Added
- Fitur manajemen versi manual pada setiap project.
- Integrasi Webhook multi-project.
- Sistem log deployment yang lebih mendetail.

## [1.0.0] - 2026-03-01
### Added
- Rilis awal GitDeploy Platform.
- Dashboard monitoring status deployment.
- Fitur Git Pull manual.

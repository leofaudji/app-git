# Changelog - GitDeploy

Semua perubahan penting pada sistem GitDeploy didokumentasikan di sini.

## [1.8.0] - 2026-05-01
### Added
- **Redis Pro Insight Dashboard**: Menambahkan halaman monitoring Redis yang modern dengan tampilan tab atas yang bersih, hero cards statistik real-time (Memory, Keys, Clients), grafik memory pulse, dan server throughput gauge.
- **Key Browser**: Panel CRUD untuk memantau, mencari, dan menghapus kunci Redis berdasarkan pola (wildcard) secara langsung dari dashboard.
- **Redis CLI Console**: Terminal interaktif di dalam browser untuk mengeksekusi perintah Redis mentah (PING, SET, GET, KEYS, dll.) secara langsung.
- **API Caching dengan Redis**: Implementasi `RedisManager::remember()` pada `api/projects.php` — data project kini di-cache selama 5–10 menit untuk mempercepat respons API secara signifikan.
- **Rate Limiting Global**: Pembatasan permintaan 60 req/menit per IP pada API project menggunakan Redis counter, mengembalikan HTTP 429 jika melampaui batas.
- **Cache Invalidation Otomatis**: Cache API dihapus secara otomatis saat data project disimpan, diubah, atau dihapus agar data selalu akurat.
- **Universal Redis Connection**: `RedisManager` mendukung ekstensi `php-redis` dengan fallback otomatis ke Unix Socket/TCP Socket — kompatibel di shared hosting (cPanel) maupun server sendiri.

### Changed
- **Desain Dashboard Redis**: Tampilan diubah dari dark mode menjadi light theme "Prism Light Pro" yang modern — menggunakan gradien vibrant, card interaktif, dan tipografi premium (font Outfit).
- **Navigasi Dashboard**: Layout sidebar kiri diubah menjadi tab navigasi atas yang lebih bersih dan memberikan ruang konten lebih luas.
- **Keamanan API Redis**: Endpoint POST (`delete`, `execute`, `flush`) kini dilindungi validasi CSRF (`requireCsrf()`) dan penanganan input yang lebih robust.

### Fixed
- **CSS Conflict**: Memperbaiki bentrok nama class `.nav-item` antara dashboard Redis dan sidebar utama aplikasi yang menyebabkan jarak menu menjadi renggang.
- **Error 400 Delete Key**: Memperbaiki kegagalan penghapusan kunci Redis akibat pemanggilan fungsi CSRF yang salah (`verifyCSRF` → `requireCsrf`).
- **Syntax Error JS**: Memperbaiki `Illegal return statement` pada `redis.js` akibat duplikasi blok `return { render }`.

---

## [1.7.0] - 2026-04-16
### Added
- **Backup Database Per Project**: Sekarang Anda bisa membackup database untuk setiap project secara terpisah. Aplikasi akan otomatis mendeteksi pengaturan database dari file project Anda.
- **Sistem Notifikasi Email**: Sekarang Anda akan menerima laporan backup otomatis langsung ke email (konfigurasi SMTP tersedia di menu Pengaturan).
- **Backup Otomatis Terjadwal**: Menambahkan fitur backup otomatis yang bisa diatur jam dan harinya melalui menu Pengaturan agar data selalu terjaga.
- **Kalender Riwayat Backup**: Tampilan riwayat backup kini lebih rapi dalam bentuk kalender, memudahkan Anda memantau ketersediaan data cadangan setiap harinya.
- **Pemicu Backup Manual**: Menambahkan opsi untuk menjalankan backup kapan saja melalui sistem luar (seperti Crontab) tanpa harus menunggu jadwal rutin.
- **Penyimpanan Lebih Aman**: File backup kini disimpan di folder khusus yang terpisah dari folder aplikasi utama untuk meningkatkan keamanan data.

### Changed
- **Pengaturan Hari Backup**: Cara memilih hari backup kini lebih mudah dengan sistem centang (checkbox), bukan lagi mengetik manual.
- **Pembaruan Sistem Backup**: Memperbaiki cara kerja internal sistem backup agar lebih stabil saat dijalankan otomatis maupun manual.

### Fixed
- **Masalah Menu Backup**: Memperbaiki error "Invalid Action" yang terkadang muncul saat mengklik tombol backup.
- **Perbaikan Tampilan**: Memperbaiki masalah teknis yang sempat membuat halaman riwayat backup tidak muncul dengan benar.

## [1.6.0] - 2026-04-01
### Added
- **Tampilan Loading Login**: Menambahkan layar loading yang cantik setelah login agar transisi masuk ke aplikasi terasa lebih mulus.
- **Konfirmasi Keluar**: Sekarang akan muncul kotak konfirmasi saat Anda ingin Logout, untuk mencegah tidak sengaja keluar dari aplikasi.
- **Format Tulisan di Riwayat**: Catatan perubahan kini mendukung tulisan **tebal**, *miring*, dan kode agar lebih mudah dibaca.
- **Icon Baru**: Memasang icon (favicon) baru agar tab aplikasi di browser terlihat lebih profesional.

### Changed
- **Tampilan Dashboard Baru**: Memindahkan grafik aktivitas ke posisi paling atas agar Anda bisa langsung melihat perkembangan project.
- **Tema Warna Putih (Light)**: Mengubah warna bagian atas dan samping menjadi putih bersih agar mata tidak cepat lelah dan terlihat lebih modern.

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

# Changelog - GitDeploy

Semua perubahan penting pada sistem GitDeploy didokumentasikan di sini.

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

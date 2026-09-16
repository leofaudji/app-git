<?php
// ============================================================
// Backup API - Full & Project-Specific Database Backup Manager
// ============================================================
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/csrf.php';
require_once __DIR__ . '/../includes/backup_helper.php';

header('X-Content-Type-Options: nosniff');

$user = requireLogin();
// Require settings edit permission
if (!isset($user['permissions']['settings']) || !in_array('edit', $user['permissions']['settings'])) {
    header('Content-Type: application/json');
    jsonError('Permission denied', 403);
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';

// Main application backups directory
$backupDir = BASE_PATH . '/backups';
if (!is_dir($backupDir)) {
    mkdir($backupDir, 0755, true);
    file_put_contents($backupDir . '/.htaccess', "Order deny,allow\nDeny from all\n");
}

// Global project backups directory from settings (User requested OUTSIDE project root)
$projectBackupBase = DB::getSetting('backup_base_dir', BASE_PATH . '/../backups_projects');
if (!is_dir($projectBackupBase)) {
    @mkdir($projectBackupBase, 0755, true);
}

// ─────────────────────────────────────────────────────────
// ACTION: list — both system and project backups
// ─────────────────────────────────────────────────────────
if ($action === 'list') {
    header('Content-Type: application/json');

    $systemFiles = array_merge(
        glob($backupDir . '/*.sql') ?: [],
        glob($backupDir . '/*.sql.gz') ?: []
    );
    $backups = [];

    // System Backups
    if ($systemFiles) {
        foreach ($systemFiles as $f) {
            $size = filesize($f);
            $filename = basename($f);
            $backups[] = [
                'filename'   => $filename,
                'type'       => 'system',
                'project'    => 'System',
                'size'       => $size,
                'size_fmt'   => $size > 1048576 ? round($size/1048576, 2).' MB' : round($size/1024, 1).' KB',
                'created'    => date('Y-m-d H:i:s', filemtime($f)),
                'compressed' => str_ends_with($filename, '.gz')
            ];
        }
    }

    // Project Backups (Recursively scan $projectBackupBase)
    if (is_dir($projectBackupBase)) {
        $it = new RecursiveDirectoryIterator($projectBackupBase, RecursiveDirectoryIterator::SKIP_DOTS);
        foreach (new RecursiveIteratorIterator($it) as $file) {
            $ext = strtolower($file->getExtension());
            if ($file->isFile() && ($ext === 'sql' || $ext === 'gz')) {
                $size = $file->getSize();
                $relPath = str_replace([$projectBackupBase, DIRECTORY_SEPARATOR], ['', '/'], $file->getPathname());
                $relFilename = ltrim($relPath, '/');
                $backups[] = [
                    'filename'   => $relFilename,
                    'type'       => 'project',
                    'project'    => basename(dirname($file->getPathname())),
                    'size'       => $size,
                    'size_fmt'   => $size > 1048576 ? round($size/1048576, 2).' MB' : round($size/1024, 1).' KB',
                    'created'    => date('Y-m-d H:i:s', $file->getMTime()),
                    'compressed' => str_ends_with($relFilename, '.gz')
                ];
            }
        }
    }

    // Sort newest first
    usort($backups, fn($a, $b) => strtotime($b['created']) - strtotime($a['created']));

    jsonSuccess($backups);
}

// ─────────────────────────────────────────────────────────
// ACTION: project_save — backup a specific project
// ─────────────────────────────────────────────────────────
if ($action === 'project_save') {
    header('Content-Type: application/json');
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
    requireCsrf();

    try {
        $id = (int)($_POST['id'] ?? 0);
        $result = performProjectBackup($id, $projectBackupBase);
        $localCleaned = performLocalRetention();
        $msg = 'Backup database project ' . $result['project_name'] . ' berhasil.';
        if ($localCleaned > 0) $msg .= " (Auto-retention: $localCleaned file lama dibersihkan)";
        jsonSuccess($result, $msg);
    } catch (Exception $e) {
        jsonError($e->getMessage());
    }
}

// ─────────────────────────────────────────────────────────
// ACTION: full_system_backup — Run all projects + system + email
// ─────────────────────────────────────────────────────────
if ($action === 'full_system_backup') {
    header('Content-Type: application/json');
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
    requireCsrf();

    $report = performFullBackupChain();
    jsonSuccess($report, 'Full system backup selesai dijalankan.');
}

// ─────────────────────────────────────────────────────────
// ACTION: save — system backup
// ─────────────────────────────────────────────────────────
if ($action === 'save') {
    header('Content-Type: application/json');
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
    requireCsrf();

    $isGzip = DB::getSetting('backup_gzip_enable', '1') === '1';
    $extension = $isGzip ? '.sql.gz' : '.sql';
    $filename  = 'gitdeploy_backup_' . date('Ymd_His') . $extension;
    $filepath  = $backupDir . '/' . $filename;
    $sql       = generateSqlDump();
    $content   = $isGzip ? gzencode($sql, 9) : $sql;

    if (file_put_contents($filepath, $content) === false) jsonError('Gagal menyimpan file backup.');
    
    $localCleaned = performLocalRetention();
    $msg = 'Backup sistem berhasil disimpan' . ($isGzip ? ' (terkompresi Gzip).' : '.');
    if ($localCleaned > 0) $msg .= " (Auto-retention: $localCleaned file lama dibersihkan)";

    jsonSuccess(['filename' => $filename, 'compressed' => $isGzip], $msg);
}

// ─────────────────────────────────────────────────────────
// ACTION: clean_retention — Purge expired local backups manually
// ─────────────────────────────────────────────────────────
if ($action === 'clean_retention') {
    header('Content-Type: application/json');
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
    requireCsrf();

    $days = (int)DB::getSetting('backup_retention_days', 30);
    $deleted = performLocalRetention();
    jsonSuccess(
        ['deleted' => $deleted, 'days' => $days],
        "Auto-Retention selesai. $deleted file backup lokal (> $days hari) telah dibersihkan."
    );
}

// ─────────────────────────────────────────────────────────
// ACTION: download
// ─────────────────────────────────────────────────────────
if ($action === 'download') {
    $file = $_GET['file'] ?? '';
    $type = $_GET['type'] ?? 'system';
    
    // Safety check path traversal
    $file = str_replace('..', '', $file);
    
    if ($type === 'project') {
        $filepath = $projectBackupBase . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $file);
    } else {
        $filepath = $backupDir . DIRECTORY_SEPARATOR . basename($file);
    }

    if (!file_exists($filepath)) {
        header('Content-Type: application/json');
        jsonError('File tidak ditemukan', 404);
    }

    $isGz = str_ends_with(strtolower($filepath), '.gz');
    header('Content-Type: ' . ($isGz ? 'application/x-gzip' : 'application/octet-stream'));
    header('Content-Disposition: attachment; filename="' . basename($filepath) . '"');
    header('Content-Length: ' . filesize($filepath));
    readfile($filepath);
    exit;
}

// ─────────────────────────────────────────────────────────
// ACTION: export — Stream backup dump directly to browser
// ─────────────────────────────────────────────────────────
if ($action === 'export') {
    $isGzip = DB::getSetting('backup_gzip_enable', '1') === '1';
    $format = $_GET['format'] ?? ($isGzip ? 'gz' : 'sql');
    $sql = generateSqlDump();
    
    if ($format === 'gz' || $format === 'gzip') {
        $filename = 'gitdeploy_export_' . date('Ymd_His') . '.sql.gz';
        $content = gzencode($sql, 9);
        header('Content-Type: application/x-gzip');
    } else {
        $filename = 'gitdeploy_export_' . date('Ymd_His') . '.sql';
        $content = $sql;
        header('Content-Type: application/sql');
    }
    
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . strlen($content));
    echo $content;
    exit;
}

// ─────────────────────────────────────────────────────────
// ACTION: restore / import — Restore database from SQL or SQL.GZ
// ─────────────────────────────────────────────────────────
if ($action === 'restore' || $action === 'import') {
    header('Content-Type: application/json');
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
    requireCsrf();

    $content = '';
    $uploadedFile = $_FILES['backup_file'] ?? $_FILES['sql_file'] ?? null;
    
    if ($uploadedFile && !empty($uploadedFile['tmp_name'])) {
        if ($uploadedFile['error'] !== UPLOAD_ERR_OK) {
            jsonError('Gagal mengunggah file backup (Error code: ' . $uploadedFile['error'] . ')');
        }
        $content = file_get_contents($uploadedFile['tmp_name']);
    } else {
        $file = $_POST['filename'] ?? $_POST['file'] ?? '';
        $type = $_POST['type'] ?? 'system';
        $file = str_replace('..', '', $file);
        
        if (empty($file)) {
            jsonError('File backup tidak ditemukan atau tidak diunggah.');
        }

        if ($type === 'project') {
            $filepath = $projectBackupBase . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $file);
        } else {
            $filepath = $backupDir . DIRECTORY_SEPARATOR . basename($file);
        }

        if (!file_exists($filepath)) {
            jsonError('File backup tidak ditemukan di server.');
        }

        $content = file_get_contents($filepath);
    }

    if (empty($content)) {
        jsonError('Konten file backup kosong.');
    }

    // 1. Create Pre-Restore Safety Snapshot
    $snapshotFile = createPreRestoreSnapshot();

    // 2. Execute SQL dump
    try {
        executeSqlDump($content);
        $msg = 'Database berhasil direstore.';
        if ($snapshotFile) {
            $msg .= " (Safety snapshot otomatis dibuat: $snapshotFile)";
        }
        jsonSuccess(['snapshot' => $snapshotFile], $msg);
    } catch (Exception $e) {
        jsonError('Restore gagal: ' . $e->getMessage());
    }
}

// ─────────────────────────────────────────────────────────
// ACTION: delete
// ─────────────────────────────────────────────────────────
if ($action === 'delete') {
    header('Content-Type: application/json');
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
    requireCsrf();

    $file = $_POST['filename'] ?? '';
    $type = $_POST['type'] ?? 'system';
    
    $file = str_replace('..', '', $file);

    if ($type === 'project') {
        $filepath = $projectBackupBase . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $file);
    } else {
        $filepath = $backupDir . DIRECTORY_SEPARATOR . basename($file);
    }

    if (!file_exists($filepath)) jsonError('File tidak ditemukan');
    if (!unlink($filepath)) jsonError('Gagal menghapus file');

    jsonSuccess(null, 'Backup berhasil dihapus.');
}

// ─────────────────────────────────────────────────────────
// ACTION: delete_batch
// ─────────────────────────────────────────────────────────
if ($action === 'delete_batch') {
    header('Content-Type: application/json');
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
    requireCsrf();

    $rawItems = $_POST['items'] ?? [];
    if (is_string($rawItems)) {
        $items = json_decode($rawItems, true) ?: [];
    } else {
        $items = (array)$rawItems;
    }

    if (empty($items)) {
        jsonError('Tidak ada file yang dipilih untuk dihapus.');
    }

    $deleted = 0;
    $errors = [];

    foreach ($items as $item) {
        if (is_array($item)) {
            $file = $item['filename'] ?? '';
            $type = $item['type'] ?? 'system';
        } elseif (strpos($item, '|') !== false) {
            [$type, $file] = explode('|', $item, 2);
        } else {
            $type = 'system';
            $file = $item;
        }

        $file = str_replace('..', '', $file);

        if ($type === 'project') {
            $filepath = $projectBackupBase . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $file);
        } else {
            $filepath = $backupDir . DIRECTORY_SEPARATOR . basename($file);
        }

        if (file_exists($filepath)) {
            if (@unlink($filepath)) {
                $deleted++;
            } else {
                $errors[] = basename($file);
            }
        }
    }

    if ($deleted > 0) {
        $msg = "$deleted file backup berhasil dihapus.";
        if (!empty($errors)) {
            $msg .= " (" . count($errors) . " file gagal dihapus)";
        }
        jsonSuccess(['deleted' => $deleted, 'errors' => $errors], $msg);
    } else {
        jsonError('Gagal menghapus file yang dipilih.');
    }
}

header('Content-Type: application/json');
jsonError('Invalid action', 404);

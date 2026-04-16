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

    $systemFiles = glob($backupDir . '/*.sql');
    $backups = [];

    // System Backups
    if ($systemFiles) {
        foreach ($systemFiles as $f) {
            $size = filesize($f);
            $backups[] = [
                'filename' => basename($f),
                'type'     => 'system',
                'project'  => 'System',
                'size'     => $size,
                'size_fmt' => $size > 1048576 ? round($size/1048576, 2).' MB' : round($size/1024, 1).' KB',
                'created'  => date('Y-m-d H:i:s', filemtime($f)),
            ];
        }
    }

    // Project Backups (Recursively scan $projectBackupBase)
    if (is_dir($projectBackupBase)) {
        $it = new RecursiveDirectoryIterator($projectBackupBase);
        foreach (new RecursiveIteratorIterator($it) as $file) {
            if ($file->getExtension() === 'sql') {
                $size = $file->getSize();
                $relPath = str_replace([$projectBackupBase, DIRECTORY_SEPARATOR], ['', '/'], $file->getPathname());
                $backups[] = [
                    'filename' => ltrim($relPath, '/'),
                    'type'     => 'project',
                    'project'  => basename(dirname($file->getPathname())),
                    'size'     => $size,
                    'size_fmt' => $size > 1048576 ? round($size/1048576, 2).' MB' : round($size/1024, 1).' KB',
                    'created'  => date('Y-m-d H:i:s', $file->getMTime()),
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
        jsonSuccess($result, 'Backup database project ' . $result['project_name'] . ' berhasil.');
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

    $filename  = 'gitdeploy_backup_' . date('Ymd_His') . '.sql';
    $filepath  = $backupDir . '/' . $filename;
    $sql       = generateSqlDump();

    if (file_put_contents($filepath, $sql) === false) jsonError('Gagal menyimpan file backup.');

    jsonSuccess(['filename' => $filename], 'Backup sistem berhasil disimpan.');
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

    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . basename($filepath) . '"');
    header('Content-Length: ' . filesize($filepath));
    readfile($filepath);
    exit;
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

header('Content-Type: application/json');
jsonError('Invalid action', 404);

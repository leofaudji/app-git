<?php
// ============================================================
// Backup API - Full Database Backup Manager
// ============================================================
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/csrf.php';

header('X-Content-Type-Options: nosniff');

$user = requireLogin();
// Require settings edit permission
if (!isset($user['permissions']['settings']) || !in_array('edit', $user['permissions']['settings'])) {
    header('Content-Type: application/json');
    jsonError('Permission denied', 403);
}

$action = $_GET['action'] ?? '';

// Dedicated backups directory
$backupDir = BASE_PATH . '/backups';
if (!is_dir($backupDir)) {
    mkdir($backupDir, 0755, true);
    // Protect from direct public access
    file_put_contents($backupDir . '/.htaccess', "Order deny,allow\nDeny from all\n");
}

// ─── Helper: generate SQL dump ───────────────────────────
function generateSqlDump(): string {
    $tables = [
        'roles', 'users', 'permissions', 'role_permissions',
        'projects', 'deploy_logs', 'webhook_logs', 'settings'
    ];

    $output  = "-- GitDeploy Database Backup\n";
    $output .= "-- Generated: " . date('Y-m-d H:i:s') . "\n";
    $output .= "-- Host: " . DB_HOST . " | DB: " . DB_NAME . "\n";
    $output .= "-- --------------------------------------------------------\n\n";
    $output .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

    $pdo = DB::getInstance();

    foreach ($tables as $table) {
        try {
            $output .= "-- Table: `$table`\n";
            $output .= "DROP TABLE IF EXISTS `$table`;\n";

            $res = $pdo->query("SHOW CREATE TABLE `$table`")->fetch();
            $output .= $res['Create Table'] . ";\n\n";

            $rows = DB::fetchAll("SELECT * FROM `$table`");
            if (!empty($rows)) {
                $output .= "INSERT INTO `$table` VALUES \n";
                $valStrings = [];
                foreach ($rows as $row) {
                    $vals = array_map(function($v) use ($pdo) {
                        return $v === null ? 'NULL' : $pdo->quote($v);
                    }, array_values($row));
                    $valStrings[] = "(" . implode(", ", $vals) . ")";
                }
                $output .= implode(",\n", $valStrings) . ";\n\n";
            }
        } catch (Exception $e) {
            $output .= "-- Skipped table `$table`: " . $e->getMessage() . "\n\n";
        }
    }

    $output .= "SET FOREIGN_KEY_CHECKS=1;\n";
    return $output;
}

// ─────────────────────────────────────────────────────────
// ACTION: list — return all saved backup files
// ─────────────────────────────────────────────────────────
if ($action === 'list') {
    header('Content-Type: application/json');

    $files = glob($backupDir . '/*.sql');
    $backups = [];

    if ($files) {
        // Sort newest first
        usort($files, fn($a, $b) => filemtime($b) - filemtime($a));

        foreach ($files as $f) {
            $name = basename($f);
            $size = filesize($f);
            $backups[] = [
                'filename' => $name,
                'size'     => $size,
                'size_fmt' => $size > 1048576
                    ? round($size / 1048576, 2) . ' MB'
                    : round($size / 1024, 1) . ' KB',
                'created'  => date('Y-m-d H:i:s', filemtime($f)),
            ];
        }
    }

    jsonSuccess($backups);
}

// ─────────────────────────────────────────────────────────
// ACTION: save — generate and save backup to disk
// ─────────────────────────────────────────────────────────
if ($action === 'save') {
    header('Content-Type: application/json');
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
    requireCsrf();

    $filename  = 'gitdeploy_backup_' . date('Ymd_His') . '.sql';
    $filepath  = $backupDir . '/' . $filename;
    $sql       = generateSqlDump();

    if (file_put_contents($filepath, $sql) === false) {
        jsonError('Gagal menyimpan file backup ke disk. Periksa permission folder /backups.');
    }

    $size = filesize($filepath);
    jsonSuccess([
        'filename' => $filename,
        'size'     => $size,
        'size_fmt' => round($size / 1024, 1) . ' KB',
        'created'  => date('Y-m-d H:i:s'),
    ], 'Backup berhasil disimpan: ' . $filename);
}

// ─────────────────────────────────────────────────────────
// ACTION: download — stream a saved backup file
// ─────────────────────────────────────────────────────────
if ($action === 'download') {
    $filename = preg_replace('/[^a-zA-Z0-9_\-\.]/', '', $_GET['file'] ?? '');
    $filepath = $backupDir . '/' . $filename;

    if (!$filename || !file_exists($filepath) || pathinfo($filename, PATHINFO_EXTENSION) !== 'sql') {
        header('Content-Type: application/json');
        jsonError('File tidak ditemukan', 404);
    }

    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . filesize($filepath));
    readfile($filepath);
    exit;
}

// ─────────────────────────────────────────────────────────
// ACTION: delete — remove a saved backup file
// ─────────────────────────────────────────────────────────
if ($action === 'delete') {
    header('Content-Type: application/json');
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
    requireCsrf();

    $body     = json_decode(file_get_contents('php://input'), true);
    $filename = preg_replace('/[^a-zA-Z0-9_\-\.]/', '', $body['filename'] ?? '');
    $filepath = $backupDir . '/' . $filename;

    if (!$filename || !file_exists($filepath) || pathinfo($filename, PATHINFO_EXTENSION) !== 'sql') {
        jsonError('File tidak ditemukan', 404);
    }

    if (!unlink($filepath)) {
        jsonError('Gagal menghapus file. Periksa permission folder /backups.');
    }

    jsonSuccess(null, 'Backup "' . $filename . '" berhasil dihapus.');
}

// ─────────────────────────────────────────────────────────
// ACTION: export (legacy) — direct download inline
// ─────────────────────────────────────────────────────────
if ($action === 'export') {
    $sql = generateSqlDump();
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="gitdeploy_backup_' . date('Ymd_His') . '.sql"');
    echo $sql;
    exit;
}

// ─────────────────────────────────────────────────────────
// ACTION: import — restore from uploaded .sql file
// ─────────────────────────────────────────────────────────
if ($action === 'import') {
    header('Content-Type: application/json');
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
    requireCsrf();

    if (!isset($_FILES['backup_file']) || $_FILES['backup_file']['error'] !== UPLOAD_ERR_OK) {
        jsonError('File tidak valid atau gagal upload');
    }

    $file = $_FILES['backup_file']['tmp_name'];
    $sql  = file_get_contents($file);
    if (!$sql) jsonError('Gagal membaca isi file');

    try {
        $pdo = DB::getInstance();
        $pdo->beginTransaction();
        $queries = explode(";\n", $sql);
        foreach ($queries as $query) {
            $query = trim($query);
            if (!empty($query)) {
                $pdo->exec($query);
            }
        }
        $pdo->commit();
        jsonSuccess(null, 'Database berhasil direstore dari backup');
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        jsonError('Gagal restore: ' . $e->getMessage());
    }
}

header('Content-Type: application/json');
jsonError('Invalid action', 404);

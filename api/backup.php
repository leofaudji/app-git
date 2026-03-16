<?php
// ============================================================
// Backup API - Export/Import Database (.sql)
// ============================================================
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/csrf.php';

header('X-Content-Type-Options: nosniff');

$user = requireLogin();
// Check if user has permission to manage settings (which includes backup)
if (!isset($user['permissions']['settings']) || !in_array('edit', $user['permissions']['settings'])) {
    header('Content-Type: application/json');
    jsonError('Permission denied', 403);
}

$action = $_GET['action'] ?? '';

if ($action === 'export') {
    $tables = [
        'roles', 'users', 'permissions', 'role_permissions', 
        'projects', 'deploy_logs', 'webhook_logs', 'settings'
    ];
    
    $output = "-- GitDeploy Database Backup\n";
    $output .= "-- Generated: " . date('Y-m-d H:i:s') . "\n";
    $output .= "-- --------------------------------------------------------\n\n";
    $output .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

    $pdo = DB::getInstance();

    foreach ($tables as $table) {
        // Drop table
        $output .= "DROP TABLE IF EXISTS `$table`;\n";
        
        // Show create table
        $res = $pdo->query("SHOW CREATE TABLE `$table`")->fetch();
        $output .= $res['Create Table'] . ";\n\n";
        
        // Dump data
        $rows = DB::fetchAll("SELECT * FROM `$table`");
        if (!empty($rows)) {
            $output .= "INSERT INTO `$table` VALUES \n";
            $valStrings = [];
            foreach ($rows as $row) {
                $vals = array_map(function($v) use ($pdo) {
                    if ($v === null) return 'NULL';
                    return $pdo->quote($v);
                }, array_values($row));
                $valStrings[] = "(" . implode(", ", $vals) . ")";
            }
            $output .= implode(",\n", $valStrings) . ";\n\n";
        }
    }
    
    $output .= "SET FOREIGN_KEY_CHECKS=1;\n";

    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="gitdeploy_backup_' . date('Ymd_His') . '.sql"');
    echo $output;
    exit;
}

if ($action === 'import') {
    header('Content-Type: application/json');
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
    
    // CSRF Check
    requireCsrf();

    if (!isset($_FILES['backup_file']) || $_FILES['backup_file']['error'] !== UPLOAD_ERR_OK) {
        jsonError('File tidak valid atau gagal upload');
    }

    $file = $_FILES['backup_file']['tmp_name'];
    $sql = file_get_contents($file);

    if (!$sql) jsonError('Gagal membaca isi file');

    try {
        $pdo = DB::getInstance();
        $pdo->beginTransaction();
        
        // Execute the SQL file content
        // We use exec because it can handle multiple statements if supported, 
        // but PDO::exec might vary. A better way is to split by ; and loop
        // However, standard SQL dump from this script uses ; and \n\n
        
        // Simple splitting by ; followed by newline
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

jsonError('Invalid action', 404);

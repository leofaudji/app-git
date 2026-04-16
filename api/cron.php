<?php
/**
 * Cron API - Entry point for automated tasks
 * Usage: curl http://localhost/app-git/api/cron.php?secret=YOUR_TOKEN
 */
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/backup.php'; // Include backup helpers

header('Content-Type: application/json');

$secret = $_GET['secret'] ?? '';
$configuredSecret = DB::getSetting('backup_cron_secret');

if (!$secret || $secret !== $configuredSecret) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Invalid cron secret']);
    exit;
}

$force = isset($_GET['force']) && $_GET['force'] === '1';

// 1. Check if Automatic Backup is enabled (skipped if forced)
if (!$force && DB::getSetting('backup_auto_enable') !== '1') {
    echo json_encode(['success' => true, 'message' => 'Automatic backup is disabled']);
    exit;
}

// 2. Check Schedule (Day and Time) - skipped if forced
if (!$force) {
    $scheduleDays = explode(',', DB::getSetting('backup_schedule_days', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'));
    $scheduleTime = DB::getSetting('backup_schedule_time', '02:00');
    $lastRun      = DB::getSetting('backup_last_run', '');

    $currentDay  = date('D'); // Mon, Tue, etc.
    $currentDate = date('Y-m-d');
    $currentTime = date('H:i');

    // Check day
    if (!in_array($currentDay, $scheduleDays)) {
        echo json_encode(['success' => true, 'message' => "Today ($currentDay) is not in schedule: " . implode(',', $scheduleDays)]);
        exit;
    }

    // Check if already run today
    if ($lastRun === $currentDate) {
        echo json_encode(['success' => true, 'message' => "Backup already performed today ($currentDate)"]);
        exit;
    }

    // Check time window (e.g. if current time is >= schedule time)
    if ($currentTime < $scheduleTime) {
        echo json_encode(['success' => true, 'message' => "Waiting for schedule time ($scheduleTime). Current time: $currentTime"]);
        exit;
    }
}

// Prepare current date for last_run update
$currentDate = date('Y-m-d');

// 3. Execute Backup
$projects = DB::fetchAll("SELECT id, name FROM projects WHERE is_active = 1");
$results = [];
$errors = [];

// Get project backup base dir
$projectBackupBase = DB::getSetting('backup_base_dir', BASE_PATH . '/../backups_projects');

foreach ($projects as $p) {
    try {
        $results[] = performProjectBackup($p['id'], $projectBackupBase);
    } catch (Exception $e) {
        $errors[] = "[{$p['name']}] " . $e->getMessage();
    }
}

// 4. Update Last Run
DB::execute("UPDATE settings SET `value` = ? WHERE `key` = 'backup_last_run'", [$currentDate]);

// 5. Optional: System Backup too?
try {
    $backupDir = BASE_PATH . '/backups';
    if (!is_dir($backupDir)) mkdir($backupDir, 0755, true);
    $sysFile = 'gitdeploy_auto_backup_' . date('Ymd_His') . '.sql';
    file_put_contents($backupDir . '/' . $sysFile, generateSqlDump());
    $results[] = ['filename' => $sysFile, 'project_name' => 'System'];
} catch (Exception $e) {
    $errors[] = "[System] " . $e->getMessage();
}

$successCount = count($results);
$errorCount = count($errors);

echo json_encode([
    'success' => true,
    'message' => "Processed $successCount projects with $errorCount errors.",
    'backups' => $results,
    'errors'  => $errors,
    'timestamp' => date('Y-m-d H:i:s')
]);

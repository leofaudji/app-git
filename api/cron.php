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

// 6. Send Email Notification if enabled
if (DB::getSetting('backup_notify_enable') === '1') {
    require_once __DIR__ . '/../includes/mailer.php';
    
    $notifyEmail = DB::getSetting('notify_email');
    if ($notifyEmail) {
        $smtpConfig = [
            'host'       => DB::getSetting('smtp_host'),
            'port'       => DB::getSetting('smtp_port'),
            'user'       => DB::getSetting('smtp_user'),
            'pass'       => DB::getSetting('smtp_pass'),
            'encryption' => DB::getSetting('smtp_encryption'),
            'from_name'  => APP_NAME . ' Backup'
        ];
        
        $mailer = new Mailer($smtpConfig);
        
        $statusIcon = ($errorCount === 0) ? '✅' : '⚠️';
        $subject = "$statusIcon Backup Report: " . date('Y-m-d H:i');
        
        $body = "<h2>Backup Report</h2>";
        $body .= "<p>Status: <strong>" . ($errorCount === 0 ? 'Success' : 'Completed with errors') . "</strong></p>";
        $body .= "<p>Time: " . date('Y-m-d H:i:s') . "</p>";
        
        $body .= "<h3>Successful Backups ($successCount):</h3><ul>";
        foreach ($results as $res) {
            $body .= "<li><strong>{$res['project_name']}</strong>: {$res['filename']}</li>";
        }
        $body .= "</ul>";
        
        if ($errorCount > 0) {
            $body .= "<h3>Errors ($errorCount):</h3><ul style='color:red;'>";
            foreach ($errors as $err) {
                $body .= "<li>$err</li>";
            }
            $body .= "</ul>";
        }
        
        $body .= "<hr><p><small>This is an automated message from " . APP_NAME . ".</small></p>";
        
        $mailer->send($notifyEmail, $subject, $body);
    }
}

echo json_encode([
    'success' => true,
    'message' => "Processed $successCount projects with $errorCount errors.",
    'backups' => $results,
    'errors'  => $errors,
    'timestamp' => date('Y-m-d H:i:s'),
    'notified' => (DB::getSetting('backup_notify_enable') === '1')
]);

<?php
// ============================================================
// Health Cron - Run this every 5-15 mins
// ============================================================
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/HealthCheck.php';
require_once __DIR__ . '/../includes/AuditLog.php';

// Check if running from CLI or authorized
if (php_sapi_name() !== 'cli' && !isset($_GET['secret']) && env('APP_DEBUG') !== true) {
    die("Unauthorized");
}

header('Content-Type: text/plain');
echo "Starting Health Check for all projects...\n";

$projects = DB::fetchAll("SELECT id, name, app_url FROM projects WHERE is_active = 1 AND app_url IS NOT NULL AND app_url != ''");

$results = [
    'total' => count($projects),
    'up' => 0,
    'down' => 0,
    'skipped' => 0
];

foreach ($projects as $p) {
    echo "- Checking {$p['name']} ({$p['app_url']})... ";
    $res = HealthCheck::check($p['id'], $p['app_url']);
    
    if ($res['status'] === 'up') {
        $results['up']++;
        echo "UP ({$res['time']}s)\n";
    } else {
        $results['down']++;
        echo "DOWN! ({$res['error']})\n";
        // Option: Log as Audit Log if down?
        // AuditLog::record('system', 'health_down', $p['id'], "Project {$p['name']} is DOWN. Error: {$res['error']}");
    }
}

echo "\nDone!\n";
echo "Up: {$results['up']} | Down: {$results['down']}\n";

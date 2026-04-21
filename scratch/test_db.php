<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';

$dbs = DB::fetchAll("SHOW DATABASES");
echo "Available Databases:\n";
foreach ($dbs as $db) {
    echo "  - " . $db['Database'] . "\n";
}

$latest = DB::fetchOne("SELECT * FROM webhook_logs ORDER BY id DESC LIMIT 1");
echo "Latest log entry ID: " . ($latest['id'] ?? 'None') . " created at: " . ($latest['created_at'] ?? 'N/A') . "\n";

<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';

$projectName = 'smkn5-toko';
$project = DB::fetchOne("SELECT * FROM projects WHERE name = ?", [$projectName]);

echo "\nSchema of webhook_logs:\n";
$schema = DB::fetchAll("DESCRIBE webhook_logs");
print_r($schema);

echo "\nLatest 5 logs in webhook_logs:\n";
$all_logs = DB::fetchAll("SELECT * FROM webhook_logs ORDER BY id DESC LIMIT 5");
print_r($all_logs);

echo "\nAll Logs for Project 8 (smkn5-toko):\n";
$logs = DB::fetchAll("SELECT * FROM webhook_logs WHERE project_id = 8 ORDER BY id DESC");
foreach ($logs as $log) {
    echo "ID: " . $log['id'] . "\n";
    echo "Status: " . $log['status'] . "\n";
    echo "Error: " . $log['error_message'] . "\n";
    echo "Headers: " . $log['headers'] . "\n";
    echo "Created: " . $log['created_at'] . "\n";
    echo "-------------------\n";
}

$defaultSecret = DB::getSetting('webhook_secret_default', '');
echo "\nDefault Webhook Secret: " . $defaultSecret . "\n";

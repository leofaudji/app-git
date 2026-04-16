<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';

// Check if running from CLI or authorized
if (php_sapi_name() !== 'cli' && !isset($_GET['run'])) {
    die("To run migration, access: ?run=1");
}

$newSettings = [
    ['key' => 'smtp_host', 'label' => 'SMTP Host', 'type' => 'text', 'value' => 'smtp.gmail.com'],
    ['key' => 'smtp_port', 'label' => 'SMTP Port', 'type' => 'text', 'value' => '587'],
    ['key' => 'smtp_user', 'label' => 'SMTP Username', 'type' => 'text', 'value' => ''],
    ['key' => 'smtp_pass', 'label' => 'SMTP Password', 'type' => 'password', 'value' => ''],
    ['key' => 'smtp_encryption', 'label' => 'SMTP Encryption', 'type' => 'text', 'value' => 'tls'],
    ['key' => 'backup_notify_enable', 'label' => 'Backup Email Notification', 'type' => 'boolean', 'value' => '0'],
];

echo "Starting SMTP Settings migration...\n";

foreach ($newSettings as $s) {
    try {
        $exists = DB::fetchOne("SELECT `key` FROM settings WHERE `key` = ?", [$s['key']]);
        if (!$exists) {
            DB::execute(
                "INSERT INTO settings (`key`, `label`, `type`, `value`) VALUES (?, ?, ?, ?)",
                [$s['key'], $s['label'], $s['type'], $s['value']]
            );
            echo "Added: {$s['key']}\n";
        } else {
            echo "Skipped (exists): {$s['key']}\n";
        }
    } catch (Exception $e) {
        echo "Error adding {$s['key']}: " . $e->getMessage() . "\n";
    }
}

echo "Migration complete.\n";

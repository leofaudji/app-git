<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';

$settings = [
    [
        'key'   => 'backup_auto_enable',
        'value' => '0',
        'label' => 'Enable Automatic Backups',
        'type'  => 'boolean'
    ],
    [
        'key'   => 'backup_schedule_time',
        'value' => '02:00',
        'label' => 'Backup Schedule Time (HH:mm)',
        'type'  => 'text'
    ],
    [
        'key'   => 'backup_schedule_days',
        'value' => 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
        'label' => 'Backup Schedule Days (Comma-separated)',
        'type'  => 'text'
    ],
    [
        'key'   => 'backup_cron_secret',
        'value' => bin2hex(random_bytes(16)),
        'label' => 'Cron Secret Token',
        'type'  => 'password'
    ],
    [
        'key'   => 'backup_last_run',
        'value' => '',
        'label' => 'Last Auto Backup Run',
        'type'  => 'text'
    ]
];

foreach ($settings as $s) {
    try {
        DB::execute(
            "INSERT IGNORE INTO settings (`key`, `value`, `label`, `type`) VALUES (?, ?, ?, ?)",
            [$s['key'], $s['value'], $s['label'], $s['type']]
        );
        echo "✓ Setting '{$s['key']}' added.\n";
    } catch (Exception $e) {
        echo "✗ Error adding '{$s['key']}': " . $e->getMessage() . "\n";
    }
}

echo "\nMigration finished.\n";

<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

// Only admin can run migration (or check if CLI)
if (php_sapi_name() !== 'cli') {
    requirePermission('settings', 'manage');
}

echo "Running Migration: Add Drift Detection Columns...\n";

try {
    // 1. Add is_drift column
    $checkDrift = DB::fetchAll("SHOW COLUMNS FROM projects LIKE 'is_drift'");
    if (empty($checkDrift)) {
        DB::execute("ALTER TABLE projects ADD COLUMN is_drift TINYINT(1) DEFAULT 0 AFTER app_url");
        echo "- added column 'is_drift'\n";
    }

    // 2. Add last_drift_check column
    $checkTime = DB::fetchAll("SHOW COLUMNS FROM projects LIKE 'last_drift_check'");
    if (empty($checkTime)) {
        DB::execute("ALTER TABLE projects ADD COLUMN last_drift_check DATETIME DEFAULT NULL AFTER is_drift");
        echo "- added column 'last_drift_check'\n";
    }

    echo "Migration completed successfully!\n";
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}

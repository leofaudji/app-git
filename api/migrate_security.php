<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

// Only admin can run migration (or check if CLI)
if (php_sapi_name() !== 'cli') {
    requirePermission('settings', 'manage');
}

echo "Running Migration: Add Security Auditing Columns...\n";

try {
    // 1. Add security_score column (0-100)
    $checkScore = DB::fetchAll("SHOW COLUMNS FROM projects LIKE 'security_score'");
    if (empty($checkScore)) {
        DB::execute("ALTER TABLE projects ADD COLUMN security_score INT DEFAULT NULL AFTER is_drift");
        echo "- added column 'security_score'\n";
    }

    // 2. Add security_details column (JSON)
    $checkDetails = DB::fetchAll("SHOW COLUMNS FROM projects LIKE 'security_details'");
    if (empty($checkDetails)) {
        DB::execute("ALTER TABLE projects ADD COLUMN security_details TEXT DEFAULT NULL AFTER security_score");
        echo "- added column 'security_details'\n";
    }

    // 3. Add last_security_check column
    $checkTime = DB::fetchAll("SHOW COLUMNS FROM projects LIKE 'last_security_check'");
    if (empty($checkTime)) {
        DB::execute("ALTER TABLE projects ADD COLUMN last_security_check DATETIME DEFAULT NULL AFTER security_details");
        echo "- added column 'last_security_check'\n";
    }

    echo "Migration completed successfully!\n";
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}

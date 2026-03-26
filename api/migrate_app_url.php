<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';

header('Content-Type: text/plain');
echo "Adding app_url to projects...\n";

try {
    $db = DB::getInstance();
    $cols = $db->query("SHOW COLUMNS FROM projects LIKE 'app_url'")->fetch();
    
    if (!$cols) {
        DB::execute("ALTER TABLE projects ADD COLUMN app_url VARCHAR(255) DEFAULT NULL AFTER branch");
        echo "[OK] Column app_url added to projects table.\n";
    } else {
        echo "[INFO] Column app_url already exists.\n";
    }

    echo "\nFinished Successfully!";
} catch (Exception $e) {
    echo "\n[ERROR] " . $e->getMessage();
}
// unlink(__FILE__);

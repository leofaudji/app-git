<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';

header('Content-Type: text/plain');
echo "Updating settings table with backup_base_dir...\n";

try {
    $exists = DB::fetchOne("SELECT `key` FROM settings WHERE `key` = 'backup_base_dir'");
    
    if (!$exists) {
        DB::execute(
            "INSERT INTO settings (`key`, `value`, `label`, `type`) VALUES (?, ?, ?, ?)",
            ['backup_base_dir', 'D:\\laragon\\backups\\gitdeploy', 'Global Backups Directory (absolute path)', 'text']
        );
        echo "[OK] Setting backup_base_dir added.\n";
    } else {
        echo "[INFO] Setting backup_base_dir already exists.\n";
    }

    echo "\nFinished Successfully!";
} catch (Exception $e) {
    echo "\n[ERROR] " . $e->getMessage();
}
// unlink(__FILE__);

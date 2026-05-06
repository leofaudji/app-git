<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

header('Content-Type: application/json');
$user = requireLogin();

if (!$user['is_admin']) {
    jsonError('Unauthorized', 403);
}

try {
    // 1. Create system_stats table
    DB::query("CREATE TABLE IF NOT EXISTS system_stats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        stat_key VARCHAR(50) NOT NULL,
        stat_value FLOAT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    
    // 2. Fix 'type' column length in settings table
    DB::query("ALTER TABLE settings MODIFY COLUMN `type` VARCHAR(50) DEFAULT 'text'");

    // 3. Add index
    try {
        DB::query("CREATE INDEX idx_stat_key_date ON system_stats (stat_key, created_at)");
    } catch (Exception $e) { /* ignore if index exists */ }


    jsonSuccess(null, 'Database table system_stats created successfully.');
} catch (Exception $e) {
    jsonError('Database error: ' . $e->getMessage());
}

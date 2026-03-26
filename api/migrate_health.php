<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';

header('Content-Type: text/plain');

try {
    // 1. Create table if not exists
    DB::execute("CREATE TABLE IF NOT EXISTS `project_health` (
      `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      `project_id` INT UNSIGNED NOT NULL,
      `status` ENUM('up', 'down') NOT NULL,
      `response_code` INT,
      `response_time` FLOAT,
      `error_message` TEXT,
      `checked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    
    echo "Table project_health exists.\n";

    // 2. Add Index
    try {
        DB::execute("CREATE INDEX idx_health_project ON project_health(project_id, checked_at DESC)");
        echo "Index added.\n";
    } catch (Exception $e) {
        echo "Index might already exist: " . $e->getMessage() . "\n";
    }

    // 3. Add FK if not exists
    $fkExists = DB::fetchOne("
        SELECT CONSTRAINT_NAME 
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE TABLE_NAME = 'project_health' 
        AND CONSTRAINT_NAME = 'fk_health_project' 
        AND TABLE_SCHEMA = ?", [DB_NAME]);

    if (!$fkExists) {
        DB::execute("ALTER TABLE project_health ADD CONSTRAINT fk_health_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE");
        echo "[OK] Foreign key fk_health_project added.\n";
    } else {
        echo "[INFO] Foreign key fk_health_project already exists.\n";
    }

    echo "\nFinished Successfully!";
} catch (Exception $e) {
    echo "\n[FATAL ERROR] " . $e->getMessage();
}

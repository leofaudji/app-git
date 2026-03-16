<?php
// ============================================================
// Seed admin user and default data
// Run: php seed_admin.php
// ============================================================
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/db.php';

echo "=== GitDeploy Seeder ===\n\n";

try {
    // Check if admin user already exists
    $exists = DB::fetchOne("SELECT id FROM users WHERE username = 'admin'");

    if ($exists) {
        echo "[SKIP] Admin user already exists (ID: {$exists['id']})\n";
    } else {
        DB::execute(
            "INSERT INTO users (username, email, full_name, password, is_active) VALUES (?, ?, ?, ?, 1)",
            ['admin', 'admin@gitdeploy.local', 'Administrator', password_hash('Admin@12345', PASSWORD_BCRYPT)]
        );
        $userId = DB::lastInsertId();

        // Assign admin role
        $adminRole = DB::fetchOne("SELECT id FROM roles WHERE name = 'admin'");
        if ($adminRole) {
            DB::execute("INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)", [$userId, $adminRole['id']]);
        }

        echo "[OK] Admin user created: admin / Admin@12345\n";
        echo "     User ID: $userId\n";
    }

    // Create a developer user
    $devExists = DB::fetchOne("SELECT id FROM users WHERE username = 'developer'");
    if (!$devExists) {
        DB::execute(
            "INSERT INTO users (username, email, full_name, password, is_active) VALUES (?, ?, ?, ?, 1)",
            ['developer', 'dev@gitdeploy.local', 'Developer User', password_hash('Dev@12345', PASSWORD_BCRYPT)]
        );
        $devId = DB::lastInsertId();

        $devRole = DB::fetchOne("SELECT id FROM roles WHERE name = 'developer'");
        if ($devRole) {
            DB::execute("INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)", [$devId, $devRole['id']]);
        }
        echo "[OK] Developer user created: developer / Dev@12345\n";
    } else {
        echo "[SKIP] Developer user already exists\n";
    }

    echo "\n=== Done! ===\n";
    echo "Open: http://localhost/app-git\n";
    echo "Login: admin / Admin@12345\n";

} catch (Exception $e) {
    echo "[ERROR] " . $e->getMessage() . "\n";
    echo "Make sure the database exists. Run schema.sql first.\n";
}

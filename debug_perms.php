<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/auth.php';

$user = DB::fetchOne("SELECT id FROM users WHERE username = 'admin'");
if ($user) {
    echo "Admin Permissions:\n";
    print_r(getUserPermissions($user['id']));
} else {
    echo "Admin not found";
}

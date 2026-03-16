<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/csrf.php';

header('Content-Type: application/json');

$currentUser = requireLogin();
$action = $_GET['action'] ?? $_POST['action'] ?? 'get';

switch ($action) {

    case 'get':
        $user = DB::fetchOne(
            "SELECT id, username, email, full_name, avatar, last_login, created_at FROM users WHERE id = ?",
            [$currentUser['id']]
        );
        jsonSuccess($user);

    case 'update':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
        requireCsrf();

        $fullName    = trim($_POST['full_name'] ?? '');
        $email       = trim($_POST['email'] ?? '');
        $oldPassword = $_POST['old_password'] ?? '';
        $newPassword = $_POST['new_password'] ?? '';

        if (!$fullName) jsonError('Nama lengkap wajib diisi');
        if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) jsonError('Format email tidak valid');

        // Check email duplicate for other users
        if ($email) {
            $dup = DB::fetchOne(
                "SELECT id FROM users WHERE email = ? AND id != ?",
                [$email, $currentUser['id']]
            );
            if ($dup) jsonError('Email sudah digunakan user lain');
        }

        $updates = ["full_name = ?"];
        $params  = [$fullName];

        if ($email) {
            $updates[] = "email = ?";
            $params[]  = $email;
        }

        // Password change
        if ($newPassword) {
            if (strlen($newPassword) < 6) jsonError('Password baru minimal 6 karakter');
            // Verify old password
            $userData = DB::fetchOne("SELECT password FROM users WHERE id = ?", [$currentUser['id']]);
            if (!password_verify($oldPassword, $userData['password'])) {
                jsonError('Password lama tidak sesuai');
            }
            $updates[] = "password = ?";
            $params[]  = password_hash($newPassword, PASSWORD_BCRYPT);
        }

        $params[] = $currentUser['id'];
        DB::execute("UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?", $params);

        jsonSuccess(null, 'Profil berhasil diupdate');

    default:
        jsonError('Action tidak ditemukan', 404);
}

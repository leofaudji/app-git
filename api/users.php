<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/csrf.php';

header('Content-Type: application/json');

requirePermission('users', 'view');
$action = $_GET['action'] ?? $_POST['action'] ?? 'list';

switch ($action) {

    case 'list':
        $users = DB::fetchAll(
            "SELECT u.id, u.username, u.email, u.full_name, u.is_active, u.last_login, u.created_at,
                    GROUP_CONCAT(r.label ORDER BY r.label SEPARATOR ', ') AS roles
             FROM users u
             LEFT JOIN user_roles ur ON ur.user_id = u.id
             LEFT JOIN roles r ON r.id = ur.role_id
             GROUP BY u.id
             ORDER BY u.created_at DESC"
        );
        jsonSuccess($users);

    case 'detail':
        $id   = (int) ($_GET['id'] ?? 0);
        $user = DB::fetchOne("SELECT id, username, email, full_name, is_active FROM users WHERE id = ?", [$id]);
        if (!$user) jsonError('User tidak ditemukan', 404);
        $user['roles'] = DB::fetchAll(
            "SELECT r.id, r.name, r.label FROM roles r
             JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ?",
            [$id]
        );
        jsonSuccess($user);

    case 'create':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
        requirePermission('users', 'create');
        requireCsrf();

        $username  = trim($_POST['username'] ?? '');
        $email     = trim($_POST['email'] ?? '');
        $fullName  = trim($_POST['full_name'] ?? '');
        $password  = $_POST['password'] ?? '';
        $isActive  = isset($_POST['is_active']) ? 1 : 0;
        $roleIds   = $_POST['role_ids'] ?? [];

        if (!$username || !$email || !$fullName || !$password) {
            jsonError('Semua field wajib wajib diisi');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonError('Format email tidak valid');
        if (strlen($password) < 6) jsonError('Password minimal 6 karakter');

        // Check duplicate
        if (DB::fetchOne("SELECT id FROM users WHERE username = ? OR email = ?", [$username, $email])) {
            jsonError('Username atau email sudah digunakan');
        }

        DB::execute(
            "INSERT INTO users (username, email, full_name, password, is_active) VALUES (?, ?, ?, ?, ?)",
            [$username, $email, $fullName, password_hash($password, PASSWORD_BCRYPT), $isActive]
        );
        $userId = (int) DB::lastInsertId();

        foreach ($roleIds as $rid) {
            DB::execute("INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)", [$userId, (int)$rid]);
        }

        jsonSuccess(['id' => $userId], 'User berhasil dibuat');

    case 'update':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
        requirePermission('users', 'update');
        requireCsrf();

        $id        = (int) ($_POST['id'] ?? 0);
        $email     = trim($_POST['email'] ?? '');
        $fullName  = trim($_POST['full_name'] ?? '');
        $password  = $_POST['password'] ?? '';
        $isActive  = isset($_POST['is_active']) ? 1 : 0;
        $roleIds   = $_POST['role_ids'] ?? [];

        if (!$id) jsonError('ID user tidak valid');

        $user = DB::fetchOne("SELECT id FROM users WHERE id = ?", [$id]);
        if (!$user) jsonError('User tidak ditemukan', 404);

        if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) jsonError('Format email tidak valid');

        $updates = "full_name = ?, is_active = ?";
        $params  = [$fullName, $isActive];

        if ($email) {
            $updates .= ", email = ?";
            $params[] = $email;
        }
        if ($password) {
            if (strlen($password) < 6) jsonError('Password minimal 6 karakter');
            $updates .= ", password = ?";
            $params[] = password_hash($password, PASSWORD_BCRYPT);
        }

        $params[] = $id;
        DB::execute("UPDATE users SET $updates WHERE id = ?", $params);

        // Sync roles
        DB::execute("DELETE FROM user_roles WHERE user_id = ?", [$id]);
        foreach ($roleIds as $rid) {
            DB::execute("INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)", [$id, (int)$rid]);
        }

        jsonSuccess(null, 'User berhasil diupdate');

    case 'delete':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
        requirePermission('users', 'delete');
        requireCsrf();

        $id = (int) ($_POST['id'] ?? 0);
        $me = requireLogin();
        if ($id === (int)$me['id']) jsonError('Tidak dapat menghapus akun sendiri');

        DB::execute("DELETE FROM users WHERE id = ?", [$id]);
        jsonSuccess(null, 'User dihapus');

    default:
        jsonError('Action tidak ditemukan', 404);
}

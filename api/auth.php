<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/csrf.php';

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {

    case 'login':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);

        $username = trim($_POST['username'] ?? '');
        $password = $_POST['password'] ?? '';

        if (!$username || !$password) {
            jsonError('Username dan password wajib diisi');
        }

        $user = DB::fetchOne(
            "SELECT * FROM users WHERE (username = ? OR email = ?) AND is_active = 1",
            [$username, $username]
        );

        if (!$user || !password_verify($password, $user['password'])) {
            jsonError('Username atau password salah', 401);
        }

        // Regenerate session to prevent fixation
        session_regenerate_id(true);
        $_SESSION['user_id'] = $user['id'];

        // Update last login
        DB::execute("UPDATE users SET last_login = NOW() WHERE id = ?", [$user['id']]);

        // Generate fresh CSRF token
        $token = regenerateCsrfToken();

        jsonSuccess([
            'csrf_token' => $token,
            'user' => [
                'id'        => $user['id'],
                'username'  => $user['username'],
                'full_name' => $user['full_name'],
                'email'     => $user['email'],
                'avatar'    => $user['avatar'],
            ]
        ], 'Login berhasil');

    case 'logout':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
        requireCsrf();
        $_SESSION = [];
        session_destroy();
        jsonSuccess(null, 'Logout berhasil');

    case 'status':
        $user = getCurrentUser();
        if (!$user) {
            jsonResponse(['authenticated' => false], 200);
        }
        jsonSuccess([
            'authenticated' => true,
            'user' => [
                'id'          => $user['id'],
                'username'    => $user['username'],
                'full_name'   => $user['full_name'],
                'email'       => $user['email'],
                'avatar'      => $user['avatar'],
                'roles'       => $user['roles'],
                'permissions' => $user['permissions'],
            ],
            'csrf_token' => generateCsrfToken(),
        ]);

    default:
        jsonError('Action tidak ditemukan', 404);
}

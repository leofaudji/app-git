<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

function getCurrentUser(): array|false {
    if (!isset($_SESSION['user_id'])) return false;
    $user = DB::fetchOne(
        "SELECT u.id, u.username, u.email, u.full_name, u.avatar, u.is_active
         FROM users u WHERE u.id = ? AND u.is_active = 1",
        [$_SESSION['user_id']]
    );
    if (!$user) return false;
    $user['roles']       = getUserRoles($user['id']);
    $user['permissions'] = getUserPermissions($user['id']);
    return $user;
}

function getUserRoles(int $userId): array {
    return DB::fetchAll(
        "SELECT r.name, r.label FROM roles r
         JOIN user_roles ur ON ur.role_id = r.id
         WHERE ur.user_id = ?",
        [$userId]
    );
}

function getUserPermissions(int $userId): array {
    $rows = DB::fetchAll(
        "SELECT DISTINCT p.module, p.action FROM permissions p
         JOIN role_permissions rp ON rp.permission_id = p.id
         JOIN user_roles ur ON ur.role_id = rp.role_id
         WHERE ur.user_id = ?",
        [$userId]
    );
    $perms = [];
    foreach ($rows as $row) {
        $perms[$row['module']][] = $row['action'];
    }
    return $perms;
}

function hasPermission(string $module, string $action): bool {
    $user = getCurrentUser();
    if (!$user) return false;
    return isset($user['permissions'][$module]) &&
           in_array($action, $user['permissions'][$module]);
}

function requireLogin(): array {
    $user = getCurrentUser();
    if (!$user) {
        jsonError('Unauthenticated', 401);
    }
    return $user;
}

function requirePermission(string $module, string $action): array {
    $user = requireLogin();
    if (!hasPermission($module, $action)) {
        jsonError('Forbidden', 403);
    }
    return $user;
}

function jsonResponse(array $data, int $code = 200): never {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function jsonError(string $message, int $code = 400): never {
    jsonResponse(['success' => false, 'message' => $message], $code);
}

function jsonSuccess(mixed $data = null, string $message = 'OK'): never {
    jsonResponse(['success' => true, 'message' => $message, 'data' => $data]);
}

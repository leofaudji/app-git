<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/csrf.php';

header('Content-Type: application/json');

requirePermission('roles', 'view');
$action = $_GET['action'] ?? $_POST['action'] ?? 'list';

switch ($action) {

    case 'list':
        $roles = DB::fetchAll(
            "SELECT r.id, r.name, r.label, r.created_at,
                    COUNT(DISTINCT ur.user_id) AS user_count,
                    COUNT(DISTINCT rp.permission_id) AS perm_count
             FROM roles r
             LEFT JOIN user_roles ur ON ur.role_id = r.id
             LEFT JOIN role_permissions rp ON rp.role_id = r.id
             GROUP BY r.id
             ORDER BY r.id"
        );
        jsonSuccess($roles);

    case 'detail':
        $id   = (int) ($_GET['id'] ?? 0);
        $role = DB::fetchOne("SELECT * FROM roles WHERE id = ?", [$id]);
        if (!$role) jsonError('Role tidak ditemukan', 404);

        $role['permissions'] = DB::fetchAll(
            "SELECT p.id, p.module, p.action, p.label FROM permissions p
             JOIN role_permissions rp ON rp.permission_id = p.id
             WHERE rp.role_id = ?
             ORDER BY p.module, p.action",
            [$id]
        );
        jsonSuccess($role);

    case 'permissions':
        // All permissions for form
        $perms = DB::fetchAll("SELECT id, module, action, label FROM permissions ORDER BY module, action");
        jsonSuccess($perms);

    case 'create':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
        requirePermission('roles', 'manage');
        requireCsrf();

        $name  = trim($_POST['name'] ?? '');
        $label = trim($_POST['label'] ?? '');
        $permIds = $_POST['permission_ids'] ?? [];

        if (!$name || !$label) jsonError('Name dan label wajib diisi');
        if (!preg_match('/^[a-z_]+$/', $name)) jsonError('Name hanya boleh huruf kecil dan underscore');

        if (DB::fetchOne("SELECT id FROM roles WHERE name = ?", [$name])) {
            jsonError('Role name sudah ada');
        }

        DB::execute("INSERT INTO roles (name, label) VALUES (?, ?)", [$name, $label]);
        $roleId = (int) DB::lastInsertId();

        foreach ($permIds as $pid) {
            DB::execute("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)", [$roleId, (int)$pid]);
        }

        jsonSuccess(['id' => $roleId], 'Role berhasil dibuat');

    case 'update':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
        requirePermission('roles', 'manage');
        requireCsrf();

        $id      = (int) ($_POST['id'] ?? 0);
        $label   = trim($_POST['label'] ?? '');
        $permIds = $_POST['permission_ids'] ?? [];

        if (!$id || !$label) jsonError('Input tidak valid');

        $role = DB::fetchOne("SELECT id, name FROM roles WHERE id = ?", [$id]);
        if (!$role) jsonError('Role tidak ditemukan', 404);

        DB::execute("UPDATE roles SET label = ? WHERE id = ?", [$label, $id]);

        // Sync permissions
        DB::execute("DELETE FROM role_permissions WHERE role_id = ?", [$id]);
        foreach ($permIds as $pid) {
            DB::execute("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)", [$id, (int)$pid]);
        }

        jsonSuccess(null, 'Role berhasil diupdate');

    case 'delete':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
        requirePermission('roles', 'manage');
        requireCsrf();

        $id   = (int) ($_POST['id'] ?? 0);
        $role = DB::fetchOne("SELECT name FROM roles WHERE id = ?", [$id]);
        if (!$role) jsonError('Role tidak ditemukan', 404);

        if ($role['name'] === 'admin') jsonError('Role admin tidak dapat dihapus');

        DB::execute("DELETE FROM roles WHERE id = ?", [$id]);
        jsonSuccess(null, 'Role dihapus');

    default:
        jsonError('Action tidak ditemukan', 404);
}

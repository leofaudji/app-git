<?php
// ============================================================
// Projects API - CRUD and scanning for multi-project support
// ============================================================
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/csrf.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? $_POST['action'] ?? 'list';

switch ($action) {
    case 'list':
        requirePermission('projects', 'view');
        $projects = DB::fetchAll("SELECT p.*, 
            (SELECT dl.status FROM deploy_logs dl WHERE dl.project_id = p.id ORDER BY dl.created_at DESC LIMIT 1) as last_status,
            (SELECT dl.created_at FROM deploy_logs dl WHERE dl.project_id = p.id ORDER BY dl.created_at DESC LIMIT 1) as last_deploy
            FROM projects p ORDER BY p.name ASC");
        jsonSuccess($projects);

    case 'detail':
        requirePermission('projects', 'view');
        $id = (int) ($_GET['id'] ?? 0);
        $project = DB::fetchOne("SELECT * FROM projects WHERE id = ?", [$id]);
        if (!$project) jsonError('Project tidak ditemukan', 404);
        jsonSuccess($project);

    case 'save':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
        requirePermission('projects', 'manage');
        requireCsrf();

        $id             = (int) ($_POST['id'] ?? 0);
        $name           = trim($_POST['name'] ?? '');
        $repo_name      = trim($_POST['repo_name'] ?? '');
        $folder_name    = trim($_POST['folder_name'] ?? '');
        $branch         = trim($_POST['branch'] ?? 'main');
        $current_version = trim($_POST['current_version'] ?? '1.0.0');
        $webhook_secret = trim($_POST['webhook_secret'] ?? '');
        $description    = trim($_POST['description'] ?? '');
        $is_active      = (int) ($_POST['is_active'] ?? 1);

        if (!$name || !$folder_name) jsonError('Nama dan Folder wajib diisi');

        try {
            if ($id > 0) {
                DB::execute(
                    "UPDATE projects SET name=?, repo_name=?, folder_name=?, branch=?, current_version=?, webhook_secret=?, description=?, is_active=? WHERE id=?",
                    [$name, $repo_name, $folder_name, $branch, $current_version, $webhook_secret, $description, $is_active, $id]
                );
                jsonSuccess(['id' => $id], 'Project diperbarui');
            } else {
                DB::execute(
                    "INSERT INTO projects (name, repo_name, folder_name, branch, current_version, webhook_secret, description, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    [$name, $repo_name, $folder_name, $branch, $current_version, $webhook_secret, $description, $is_active]
                );
                jsonSuccess(['id' => DB::lastInsertId()], 'Project ditambahkan');
            }
        } catch (Exception $e) {
            jsonError('Database Error: ' . $e->getMessage());
        }

    case 'delete':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
        requirePermission('projects', 'manage');
        requireCsrf();

        $id = (int) ($_POST['id'] ?? 0);
        DB::execute("DELETE FROM projects WHERE id = ?", [$id]);
        jsonSuccess(null, 'Project dihapus');

    case 'scan':
        requirePermission('projects', 'manage');
        $baseDir = DB::getSetting('git_base_dir', '');
        if (!$baseDir || !is_dir($baseDir)) {
            jsonError('Global base directory belum dikonfigurasi atau tidak ditemukan');
        }

        $items = scandir($baseDir);
        $folders = [];
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') continue;
            $fullPath = rtrim($baseDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $item;
            if (is_dir($fullPath) && is_dir($fullPath . DIRECTORY_SEPARATOR . '.git')) {
                // Check if already in DB
                $exists = DB::fetchOne("SELECT id FROM projects WHERE folder_name = ?", [$item]);
                $folders[] = [
                    'name' => $item,
                    'is_managed' => (bool)$exists
                ];
            }
        }
        jsonSuccess($folders);

    case 'changelog_list':
        requirePermission('projects', 'view');
        $id = (int) ($_GET['project_id'] ?? 0);
        $logs = DB::fetchAll("SELECT cl.*, u.full_name as author 
            FROM project_changelogs cl 
            LEFT JOIN users u ON u.id = cl.user_id 
            WHERE cl.project_id = ? ORDER BY cl.created_at DESC", [$id]);
        jsonSuccess($logs);

    case 'changelog_save':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
        requirePermission('projects', 'manage');
        requireCsrf();

        $project_id = (int) ($_POST['project_id'] ?? 0);
        $version    = trim($_POST['version'] ?? '');
        $changelog  = trim($_POST['changelog'] ?? '');
        $user_id    = $_SESSION['user_id'] ?? null;

        if (!$project_id || !$version || !$changelog) jsonError('Data tidak lengkap');

        DB::execute(
            "INSERT INTO project_changelogs (project_id, version, changelog, user_id) VALUES (?, ?, ?, ?)",
            [$project_id, $version, $changelog, $user_id]
        );
        
        // Also update project current_version
        DB::execute("UPDATE projects SET current_version = ? WHERE id = ?", [$version, $project_id]);

        jsonSuccess(null, 'Changelog ditambahkan');

    default:
        jsonError('Action tidak ditemukan', 404);
}

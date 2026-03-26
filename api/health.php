<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/HealthCheck.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? 'list';

switch ($action) {
    case 'latest':
        requirePermission('projects', 'view');
        $health = HealthCheck::getAllLatest();
        jsonSuccess($health);
        break;

    case 'history':
        requirePermission('projects', 'view');
        $projectId = (int) ($_GET['project_id'] ?? 0);
        $limit = (int) ($_GET['limit'] ?? 20);
        
        $history = DB::fetchAll(
            "SELECT * FROM project_health 
             WHERE project_id = ? 
             ORDER BY checked_at DESC 
             LIMIT ?", 
            [$projectId, $limit]
        );
        jsonSuccess($history);
        break;

    case 'check_now':
        // Manual trigger for a specific project
        requirePermission('projects', 'manage');
        $projectId = (int) ($_GET['project_id'] ?? 0);
        $project = DB::fetchOne("SELECT id, app_url FROM projects WHERE id = ?", [$projectId]);
        
        if (!$project || !$project['app_url']) {
            jsonError('Project tidak memiliki App URL');
        }

        $res = HealthCheck::check($project['id'], $project['app_url']);
        jsonSuccess($res, 'Check selesai');
        break;

    default:
        jsonError('Action tidak ditemukan');
}

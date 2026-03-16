<?php
// ============================================================
// Logs API - Multi-Project Support
// ============================================================
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/csrf.php';

header('Content-Type: application/json');

requirePermission('logs', 'view');

$action = $_GET['action'] ?? $_POST['action'] ?? 'list';

switch ($action) {
    case 'list':
        $page      = max(1, (int) ($_GET['page'] ?? 1));
        $limit     = min(50, max(5, (int) ($_GET['limit'] ?? 15)));
        $offset    = ($page - 1) * $limit;
        $status    = $_GET['status'] ?? '';
        $trigger   = $_GET['trigger'] ?? '';
        $projectId = (int) ($_GET['project_id'] ?? 0);

        $where  = [];
        $params = [];

        if ($projectId > 0) {
            $where[] = "dl.project_id = ?";
            $params[] = $projectId;
        }
        if ($status && in_array($status, ['success', 'failed', 'running'])) {
            $where[] = "dl.status = ?";
            $params[] = $status;
        }
        if ($trigger && in_array($trigger, ['manual', 'webhook'])) {
            $where[] = "dl.triggered_by = ?";
            $params[] = $trigger;
        }

        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $totalSql = "SELECT COUNT(*) AS c FROM deploy_logs dl $whereClause";
        $total = (int) DB::fetchOne($totalSql, $params)['c'];

        $logs = DB::fetchAll(
            "SELECT dl.id, dl.triggered_by, dl.branch, dl.commit_hash,
                    dl.status, dl.ip_address, dl.created_at,
                    u.full_name as user_name,
                    p.name as project_name
             FROM deploy_logs dl
             LEFT JOIN users u ON u.id = dl.user_id
             LEFT JOIN projects p ON p.id = dl.project_id
             $whereClause
             ORDER BY dl.created_at DESC
             LIMIT $limit OFFSET $offset",
            $params
        );

        jsonSuccess([
            'logs'  => $logs,
            'total' => $total,
            'page'  => $page,
            'limit' => $limit,
            'pages' => (int) ceil($total / $limit),
        ]);

    case 'detail':
        $id  = (int) ($_GET['id'] ?? 0);
        $log = DB::fetchOne(
            "SELECT dl.*, u.full_name as user_name, p.name as project_name
             FROM deploy_logs dl
             LEFT JOIN users u ON u.id = dl.user_id
             LEFT JOIN projects p ON p.id = dl.project_id
             WHERE dl.id = ?",
            [$id]
        );
        if (!$log) jsonError('Log tidak ditemukan', 404);
        jsonSuccess($log);

    case 'delete':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
        requirePermission('logs', 'delete');
        requireCsrf();
        $id = (int) ($_POST['id'] ?? 0);
        DB::execute("DELETE FROM deploy_logs WHERE id = ?", [$id]);
        jsonSuccess(null, 'Log dihapus');

    case 'clear':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
        requirePermission('logs', 'delete');
        requireCsrf();
        
        $projectId = (int) ($_POST['project_id'] ?? 0);
        if ($projectId > 0) {
            DB::execute("DELETE FROM deploy_logs WHERE project_id = ?", [$projectId]);
            jsonSuccess(null, 'Log project dihapus');
        } else {
            DB::execute("TRUNCATE TABLE deploy_logs");
            jsonSuccess(null, 'Semua log dihapus');
        }

    default:
        jsonError('Action tidak ditemukan', 404);
}

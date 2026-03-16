<?php
// ============================================================
// Webhook Logs API - CRUD operations for webhook traffic
// ============================================================
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/csrf.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? $_POST['action'] ?? 'list';

switch ($action) {
    case 'list':
        requirePermission('webhook_logs', 'view');
        $logs = DB::fetchAll("SELECT l.*, p.name as project_name 
                              FROM webhook_logs l 
                              LEFT JOIN projects p ON l.project_id = p.id 
                              ORDER BY l.created_at DESC LIMIT 200");
        jsonSuccess($logs);

    case 'delete':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
        requirePermission('webhook_logs', 'delete');
        requireCsrf();
        $id = (int) ($_POST['id'] ?? 0);
        DB::execute("DELETE FROM webhook_logs WHERE id = ?", [$id]);
        jsonSuccess(null, 'Log dihapus');

    case 'clear':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
        requirePermission('webhook_logs', 'delete');
        requireCsrf();
        DB::execute("DELETE FROM webhook_logs");
        jsonSuccess(null, 'Semua log dibersihkan');

    default:
        jsonError('Action tidak ditemukan', 404);
}

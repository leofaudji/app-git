<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/csrf.php';

header('Content-Type: application/json');

$user = requirePermission('audit', 'view');
$action = $_GET['action'] ?? 'list';

if ($action === 'list') {
    $page = (int) ($_GET['page'] ?? 1);
    $limit = (int) ($_GET['limit'] ?? 50);
    $offset = ($page - 1) * $limit;
    
    $where = [];
    $params = [];
    
    if (!empty($_GET['module'])) {
        $where[] = "a.module = ?";
        $params[] = $_GET['module'];
    }
    if (!empty($_GET['user_id'])) {
        $where[] = "a.user_id = ?";
        $params[] = $_GET['user_id'];
    }
    
    $whereSql = $where ? "WHERE " . implode(" AND ", $where) : "";
    
    $countSql = "SELECT COUNT(*) as total FROM audit_logs a $whereSql";
    $total = DB::fetchOne($countSql, $params)['total'];
    
    $sql = "SELECT a.*, u.username, u.full_name 
            FROM audit_logs a 
            LEFT JOIN users u ON a.user_id = u.id 
            $whereSql 
            ORDER BY a.created_at DESC 
            LIMIT $limit OFFSET $offset";
    
    $logs = DB::fetchAll($sql, $params);
    
    jsonSuccess([
        'logs' => $logs,
        'total' => $total,
        'pages' => ceil($total / $limit),
        'current_page' => $page
    ]);
}

elseif ($action === 'modules') {
    $modules = DB::fetchAll("SELECT DISTINCT module FROM audit_logs ORDER BY module ASC");
    jsonSuccess($modules);
}

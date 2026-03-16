<?php
// ============================================================
// Dashboard API - Multi-Project Summary
// ============================================================
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

header('Content-Type: application/json');

$user = requireLogin();

// Overall stats
$totalDeploy   = (int) DB::fetchOne("SELECT COUNT(*) as c FROM deploy_logs")['c'];
$successDeploy = (int) DB::fetchOne("SELECT COUNT(*) as c FROM deploy_logs WHERE status = 'success'")['c'];
$failedDeploy  = (int) DB::fetchOne("SELECT COUNT(*) as c FROM deploy_logs WHERE status = 'failed'")['c'];

// Recent activity (all projects)
$recentLogs = DB::fetchAll(
    "SELECT dl.id, dl.triggered_by, dl.status, dl.created_at, p.name as project_name
     FROM deploy_logs dl
     LEFT JOIN projects p ON p.id = dl.project_id
     ORDER BY dl.created_at DESC LIMIT 5"
);

// Project List Summary
$projects = DB::fetchAll(
    "SELECT p.id, p.name, p.branch, p.is_active,
     (SELECT dl.status FROM deploy_logs dl WHERE dl.project_id = p.id ORDER BY dl.created_at DESC LIMIT 1) as last_status,
     (SELECT dl.created_at FROM deploy_logs dl WHERE dl.project_id = p.id ORDER BY dl.created_at DESC LIMIT 1) as last_deploy
     FROM projects p ORDER BY p.name ASC"
);

jsonSuccess([
    'stats' => [
        'total'   => $totalDeploy,
        'success' => $successDeploy,
        'failed'  => $failedDeploy,
    ],
    'recent'   => $recentLogs,
    'projects' => $projects,
]);

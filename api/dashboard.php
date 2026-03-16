<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/csrf.php';

header('Content-Type: application/json');

requirePermission('dashboard', 'view');

// Get git info for dashboard
$gitDir = DB::getSetting('git_dir', GIT_DIR_DEFAULT);
$branch = 'N/A';
$lastCommit = 'N/A';
$lastCommitMsg = '';

if (is_dir($gitDir . '/.git')) {
    $branch = trim(@shell_exec("cd \"$gitDir\" && " . GIT_BINARY . " rev-parse --abbrev-ref HEAD 2>&1"));
    $lastCommit = trim(@shell_exec("cd \"$gitDir\" && " . GIT_BINARY . " log -1 --format='%h - %s (%ci)' 2>&1"));
}

// Stats
$totalDeploys    = (int) (DB::fetchOne("SELECT COUNT(*) AS c FROM deploy_logs")['c'] ?? 0);
$successDeploys  = (int) (DB::fetchOne("SELECT COUNT(*) AS c FROM deploy_logs WHERE status = 'success'")['c'] ?? 0);
$failedDeploys   = (int) (DB::fetchOne("SELECT COUNT(*) AS c FROM deploy_logs WHERE status = 'failed'")['c'] ?? 0);
$lastDeploy      = DB::fetchOne(
    "SELECT dl.*, u.full_name FROM deploy_logs dl
     LEFT JOIN users u ON u.id = dl.user_id
     ORDER BY dl.created_at DESC LIMIT 1"
);

// Recent logs (5)
$recentLogs = DB::fetchAll(
    "SELECT dl.id, dl.triggered_by, dl.branch, dl.status, dl.created_at, u.full_name
     FROM deploy_logs dl
     LEFT JOIN users u ON u.id = dl.user_id
     ORDER BY dl.created_at DESC LIMIT 5"
);

jsonSuccess([
    'stats' => [
        'total_deploys'   => $totalDeploys,
        'success_deploys' => $successDeploys,
        'failed_deploys'  => $failedDeploys,
        'current_branch'  => $branch,
        'last_commit'     => $lastCommit,
    ],
    'last_deploy'  => $lastDeploy ?: null,
    'recent_logs'  => $recentLogs,
    'app_name'     => DB::getSetting('app_name', APP_NAME),
]);

<?php
// ============================================================
// Git API - Multi-Project Support
// Handles operations for a specific project
// ============================================================
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/csrf.php';

header('Content-Type: application/json');

$action    = $_GET['action']    ?? $_POST['action']    ?? 'status';
$projectId = (int) ($_GET['project_id'] ?? $_POST['project_id'] ?? 0);

if ($projectId <= 0) jsonError('Project ID wajib diisi');

// Find project
$project = DB::fetchOne("SELECT * FROM projects WHERE id = ?", [$projectId]);
if (!$project) jsonError('Project tidak ditemukan', 404);

function getProjPath(array $project): string {
    $baseDir    = DB::getSetting('git_base_dir', '');
    $projFolder = $project['folder_name'];
    return is_dir($projFolder) ? $projFolder : rtrim($baseDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $projFolder;
}

function runGit(string $cmd, string $path): array {
    $safeDir = escapeshellarg($path);
    $fullCmd = "cd $safeDir && " . GIT_BINARY . " $cmd 2>&1";
    $output  = [];
    $code    = 0;
    exec($fullCmd, $output, $code);
    return ['output' => implode("\n", $output), 'exit_code' => $code];
}

$path = getProjPath($project);

switch ($action) {

    case 'status':
        requirePermission('git', 'view');
        if (!is_dir($path . '/.git')) {
            jsonError("Direktori '$path' bukan git repository");
        }
        $branch     = trim(@shell_exec("cd \"$path\" && " . GIT_BINARY . " rev-parse --abbrev-ref HEAD 2>&1"));
        $status     = runGit('status --short', $path);
        $logLines   = runGit('log --oneline -10', $path);
        $remoteUrl  = trim(@shell_exec("cd \"$path\" && " . GIT_BINARY . " remote get-url origin 2>&1"));
        $lastCommit = runGit('log -1 --format="%H|%an|%ae|%s|%ci"', $path);
        $commitParts = explode('|', $lastCommit['output']);

        jsonSuccess([
            'project'     => $project,
            'branch'      => $branch,
            'remote_url'  => $remoteUrl,
            'path'        => $path,
            'status'      => $status['output'],
            'log'         => $logLines['output'],
            'last_commit' => [
                'hash'    => $commitParts[0] ?? '',
                'author'  => $commitParts[1] ?? '',
                'email'   => $commitParts[2] ?? '',
                'message' => $commitParts[3] ?? '',
                'date'    => $commitParts[4] ?? '',
            ],
        ]);

    case 'branches':
        requirePermission('git', 'view');
        $result = runGit('branch -a', $path);
        $branches = array_filter(array_map(fn($l) => trim(str_replace('*', '', $l)), explode("\n", $result['output'])));
        jsonSuccess(['branches' => array_values($branches)]);

    case 'pull':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
        $currentUser = requirePermission('git', 'pull');
        requireCsrf();

        $branch = $project['branch'] ?: 'main';

        if (!is_dir($path . '/.git')) {
            jsonError("Direktori '$path' bukan git repository");
        }

        // Log start
        DB::execute(
            "INSERT INTO deploy_logs (project_id, triggered_by, user_id, branch, ip_address) VALUES (?, 'manual', ?, ?, ?)",
            [$project['id'], $currentUser['id'], $branch, $_SERVER['REMOTE_ADDR'] ?? 'localhost']
        );
        $logId = (int) DB::lastInsertId();

        $result = runGit("pull origin $branch", $path);
        $status = $result['exit_code'] === 0 ? 'success' : 'failed';

        // Capture last commit
        $hash = trim(@shell_exec("cd \"$path\" && " . GIT_BINARY . " rev-parse --short HEAD 2>&1"));

        DB::execute(
            "UPDATE deploy_logs SET status = ?, output = ?, commit_hash = ? WHERE id = ?",
            [$status, $result['output'], $hash, $logId]
        );

        jsonSuccess([
            'status'    => $status,
            'output'    => $result['output'],
            'branch'    => $branch,
            'log_id'    => $logId,
        ], $status === 'success' ? 'Git pull berhasil' : 'Git pull gagal');

    default:
        jsonError('Action tidak ditemukan', 404);
}

<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/csrf.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? $_POST['action'] ?? 'status';

function getGitDir(): string {
    return DB::getSetting('git_dir', GIT_DIR_DEFAULT);
}

function runGit(string $cmd, string $gitDir): array {
    $safeDir = escapeshellarg($gitDir);
    $fullCmd = "cd $safeDir && " . GIT_BINARY . " $cmd 2>&1";
    $output  = [];
    $code    = 0;
    exec($fullCmd, $output, $code);
    return ['output' => implode("\n", $output), 'exit_code' => $code];
}

switch ($action) {

    case 'status':
        requirePermission('git', 'view');
        $dir = getGitDir();
        if (!is_dir($dir . '/.git')) {
            jsonError("Direktori '$dir' bukan git repository");
        }
        $branch     = trim(@shell_exec("cd \"$dir\" && " . GIT_BINARY . " rev-parse --abbrev-ref HEAD 2>&1"));
        $status     = runGit('status --short', $dir);
        $logLines   = runGit('log --oneline -10', $dir);
        $remoteUrl  = trim(@shell_exec("cd \"$dir\" && " . GIT_BINARY . " remote get-url origin 2>&1"));
        $lastCommit = runGit('log -1 --format="%H|%an|%ae|%s|%ci"', $dir);
        $commitParts = explode('|', $lastCommit['output']);

        jsonSuccess([
            'branch'      => $branch,
            'remote_url'  => $remoteUrl,
            'git_dir'     => $dir,
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
        $dir = getGitDir();
        $result = runGit('branch -a', $dir);
        $branches = array_filter(array_map(fn($l) => trim(str_replace('*', '', $l)), explode("\n", $result['output'])));
        jsonSuccess(['branches' => array_values($branches)]);

    case 'pull':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
        $currentUser = requirePermission('git', 'pull');
        requireCsrf();

        $dir    = getGitDir();
        $branch = DB::getSetting('git_branch', 'main');

        if (!is_dir($dir . '/.git')) {
            jsonError("Direktori '$dir' bukan git repository");
        }

        // Log start
        DB::execute(
            "INSERT INTO deploy_logs (triggered_by, user_id, branch, status, ip_address) VALUES ('manual', ?, ?, 'running', ?)",
            [$currentUser['id'], $branch, $_SERVER['REMOTE_ADDR'] ?? 'localhost']
        );
        $logId = (int) DB::lastInsertId();

        $result = runGit("pull origin $branch", $dir);
        $status = $result['exit_code'] === 0 ? 'success' : 'failed';

        // Capture last commit
        $hash = trim(@shell_exec("cd \"$dir\" && " . GIT_BINARY . " rev-parse --short HEAD 2>&1"));

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

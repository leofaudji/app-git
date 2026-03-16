<?php
// ============================================================
// Webhook handler - receives pushes from GitHub/GitLab/Bitbucket
// No session / CSRF check - uses HMAC signature instead
// ============================================================
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

// Check if auto deploy is enabled
$autoDeploy = DB::getSetting('auto_deploy', '1');
if ($autoDeploy !== '1') {
    http_response_code(200);
    echo json_encode(['message' => 'Auto deploy disabled']);
    exit;
}

$payload    = file_get_contents('php://input');
$secret     = DB::getSetting('webhook_secret', 'change_me_secret_key');
$sigHeader  = $_SERVER['HTTP_X_HUB_SIGNATURE_256']
           ?? $_SERVER['HTTP_X_GITLAB_TOKEN']     // GitLab uses token header
           ?? '';

// Validate HMAC (GitHub / Bitbucket style)
$validSignature = false;
if (!empty($secret)) {
    if (strpos($sigHeader, 'sha256=') === 0) {
        // GitHub format: sha256=<hmac>
        $expected = 'sha256=' . hash_hmac('sha256', $payload, $secret);
        $validSignature = hash_equals($expected, $sigHeader);
    } elseif ($sigHeader === $secret) {
        // GitLab uses plain token comparison
        $validSignature = true;
    }
} else {
    // No secret configured - allow all (not recommended)
    $validSignature = true;
}

if (!$validSignature) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid signature']);
    exit;
}

// Parse payload
$data   = json_decode($payload, true);
$branch = '';

// GitHub
if (isset($data['ref'])) {
    $branch = str_replace('refs/heads/', '', $data['ref']);
}
// GitLab
if (isset($data['object_kind']) && $data['object_kind'] === 'push') {
    $branch = str_replace('refs/heads/', '', $data['ref'] ?? '');
}
// Bitbucket
if (isset($data['push']['changes'][0]['new']['name'])) {
    $branch = $data['push']['changes'][0]['new']['name'];
}

$configBranch = DB::getSetting('git_branch', 'main');

// Only deploy for the configured branch
if ($branch && $branch !== $configBranch) {
    http_response_code(200);
    echo json_encode(['message' => "Branch '$branch' ignored, watching '$configBranch'"]);
    exit;
}

$gitDir = DB::getSetting('git_dir', GIT_DIR_DEFAULT);
$ip     = $_SERVER['REMOTE_ADDR'] ?? 'webhook';

// Log start
DB::execute(
    "INSERT INTO deploy_logs (triggered_by, branch, status, ip_address) VALUES ('webhook', ?, 'running', ?)",
    [$configBranch, $ip]
);
$logId = (int) DB::lastInsertId();

// Execute git pull
$safeDir = escapeshellarg($gitDir);
$output  = [];
$code    = 0;
exec("cd $safeDir && " . GIT_BINARY . " pull origin $configBranch 2>&1", $output, $code);
$outputStr = implode("\n", $output);
$status    = $code === 0 ? 'success' : 'failed';
$hash      = trim(@shell_exec("cd $safeDir && " . GIT_BINARY . " rev-parse --short HEAD 2>&1"));

DB::execute(
    "UPDATE deploy_logs SET status = ?, output = ?, commit_hash = ? WHERE id = ?",
    [$status, $outputStr, $hash, $logId]
);

http_response_code(200);
echo json_encode([
    'success' => $status === 'success',
    'branch'  => $configBranch,
    'output'  => $outputStr,
    'log_id'  => $logId,
]);

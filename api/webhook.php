<?php
// ============================================================
// Webhook handler - Multi-Project Support
// Matches incoming repo name to project configuration
// ============================================================
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';

header('Content-Type: application/json');

function logWebhook($status, $error = '', $projectId = null, $data = null) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'webhook';
    $event = $_SERVER['HTTP_X_GITHUB_EVENT'] 
          ?? $_SERVER['HTTP_X_GITLAB_EVENT'] 
          ?? 'push';
    
    $summary = '';
    if ($data) {
        $repo = $data['repository']['full_name'] ?? $data['project']['path_with_namespace'] ?? '';
        $ref = $data['ref'] ?? '';
        $branch = str_replace('refs/heads/', '', $ref);
        $summary = $repo . ($branch ? " [$branch]" : "");
    }

    $headers = [
        'User-Agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
        'Signature'  => $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? $_SERVER['HTTP_X_GITLAB_TOKEN'] ?? '',
        'Event'      => $event
    ];

    DB::execute(
        "INSERT INTO webhook_logs (project_id, event_type, payload_summary, status, error_message, ip_address, headers) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [$projectId, $event, $summary, $status, $error, $ip, json_encode($headers)]
    );
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

// Check if global auto deploy is enabled
$autoDeploy = DB::getSetting('auto_deploy', '1');
if ($autoDeploy !== '1') {
    logWebhook('failed', 'Auto deploy globally disabled');
    http_response_code(200);
    echo json_encode(['message' => 'Auto deploy globally disabled']);
    exit;
}

$payload = file_get_contents('php://input');
$data    = json_decode($payload, true);

if (!$data) {
    logWebhook('failed', 'Invalid JSON payload');
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON payload']);
    exit;
}

// ─── Extract Repository Name from Payload ───
$repoName = '';
// GitHub
if (isset($data['repository']['full_name'])) {
    $repoName = $data['repository']['full_name'];
} 
// GitLab
elseif (isset($data['project']['path_with_namespace'])) {
    $repoName = $data['project']['path_with_namespace'];
}
// Bitbucket
elseif (isset($data['repository']['full_name'])) {
    $repoName = $data['repository']['full_name'];
}

if (!$repoName) {
    // Fallback: try folder_name matching if repo_name is missing
    if (isset($data['repository']['name'])) {
        $repoName = $data['repository']['name'];
    }
}

// ─── Find Matching Project ───
$project = null;
if ($repoName) {
    $project = DB::fetchOne("SELECT * FROM projects WHERE repo_name = ? AND is_active = 1", [$repoName]);
}

// Second fallback: try matching by folder_name if repo_name didn't match
if (!$project && isset($data['repository']['name'])) {
    $project = DB::fetchOne("SELECT * FROM projects WHERE folder_name = ? AND is_active = 1", [$data['repository']['name']]);
}

if (!$project) {
    logWebhook('failed', "No active project found for repository '$repoName'", null, $data);
    http_response_code(404);
    echo json_encode(['error' => "No active project found for repository '$repoName'"]);
    exit;
}

// ─── Validate Signature ───
$secret    = $project['webhook_secret'] ?: DB::getSetting('webhook_secret_default', '');
$sigHeader = $_SERVER['HTTP_X_HUB_SIGNATURE_256']
          ?? $_SERVER['HTTP_X_GITLAB_TOKEN']
          ?? '';

$validSignature = false;
if (!empty($secret)) {
    if (strpos($sigHeader, 'sha256=') === 0) {
        $expected = 'sha256=' . hash_hmac('sha256', $payload, $secret);
        $validSignature = hash_equals($expected, $sigHeader);
    } elseif ($sigHeader === $secret) {
        $validSignature = true;
    }
} else {
    $validSignature = true; // Allow if no secret
}

if (!$validSignature) {
    logWebhook('failed', 'Invalid signature', $project['id'], $data);
    http_response_code(403);
    echo json_encode(['error' => 'Invalid signature for project ' . $project['name']]);
    exit;
}

// ─── Extract Branch ───
$branch = '';
if (isset($data['ref'])) {
    $branch = str_replace('refs/heads/', '', $data['ref']);
} elseif (isset($data['push']['changes'][0]['new']['name'])) {
    $branch = $data['push']['changes'][0]['new']['name'];
}

$configBranch = $project['branch'] ?: 'main';
if ($branch && $branch !== $configBranch) {
    logWebhook('success', "Branch '$branch' ignored (watching '$configBranch')", $project['id'], $data);
    http_response_code(200);
    echo json_encode(['message' => "Branch '$branch' ignored, watching '$configBranch'"]);
    exit;
}

// ─── Execute Deploy ───
$baseDir = DB::getSetting('git_base_dir', '');
$projFolder = $project['folder_name'];
$fullPath = is_dir($projFolder) ? $projFolder : rtrim($baseDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $projFolder;

if (!is_dir($fullPath)) {
    logWebhook('failed', "Project directory not found: $fullPath", $project['id'], $data);
    http_response_code(500);
    echo json_encode(['error' => "Project directory not found: $fullPath"]);
    exit;
}

$ip = $_SERVER['REMOTE_ADDR'] ?? 'webhook';

// Log start
DB::execute(
    "INSERT INTO deploy_logs (project_id, triggered_by, branch, status, ip_address) VALUES (?, 'webhook', ?, 'running', ?)",
    [$project['id'], $configBranch, $ip]
);
$logId = (int) DB::lastInsertId();

$safeDir = escapeshellarg($fullPath);
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

// ─── Automated Changelog Sync (New) ───
if ($status === 'success') {
    require_once __DIR__ . '/../includes/changelog_parser.php';
    
    // Look for changelog.md (case-insensitive)
    $changelogFile = null;
    $possibleNames = ['changelog.md', 'CHANGELOG.md', 'Changelog.md'];
    foreach ($possibleNames as $name) {
        if (file_exists($fullPath . DIRECTORY_SEPARATOR . $name)) {
            $changelogFile = $fullPath . DIRECTORY_SEPARATOR . $name;
            break;
        }
    }

    if ($changelogFile) {
        $parsed = ChangelogParser::parse($changelogFile);
        if ($parsed && !empty($parsed['version'])) {
            $newVersion = $parsed['version'];
            
            // Only update and insert if version is different from current
            if ($newVersion !== $project['current_version']) {
                // Update Project Version
                DB::execute("UPDATE projects SET current_version = ? WHERE id = ?", [$newVersion, $project['id']]);
                
                // Add to Changelog History
                // Check if this version already exists in history to avoid duplicates
                $exists = DB::fetchOne("SELECT id FROM project_changelogs WHERE project_id = ? AND version = ?", [$project['id'], $newVersion]);
                if (!$exists) {
                    DB::execute(
                        "INSERT INTO project_changelogs (project_id, version, changelog, author) VALUES (?, ?, ?, ?)",
                        [$project['id'], $newVersion, $parsed['content'], 'Git (Auto)']
                    );
                }
            }
        }
    }
}

logWebhook('success', 'Deployment triggered', $project['id'], $data);

http_response_code(200);
echo json_encode([
    'project' => $project['name'],
    'success' => $status === 'success',
    'branch'  => $configBranch,
    'output'  => $outputStr,
    'log_id'  => $logId,
]);

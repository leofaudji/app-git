<?php
// ============================================================
// Security API - Probing for sensitive files and server info
// ============================================================
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/csrf.php';
require_once __DIR__ . '/../includes/AuditLog.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? $_POST['action'] ?? 'check';
$projectId = (int) ($_GET['project_id'] ?? $_POST['project_id'] ?? 0);

if ($projectId <= 0) jsonError('Project ID wajib diisi');

// Find project
$project = DB::fetchOne("SELECT * FROM projects WHERE id = ?", [$projectId]);
if (!$project) jsonError('Project tidak ditemukan', 404);

switch ($action) {

    case 'check':
        requirePermission('projects', 'view'); // Anyone with view project can run check
        $url = $project['app_url'];
        if (empty($url)) jsonError('App URL belum diisi untuk project ini');

        $results = [
            'sensitive_files' => [],
            'php_info' => null,
            'headers' => [],
            'score' => 100
        ];

        // 1. Probe Sensitive Files
        $probes = [
            '.env' => 'Environment configuration file',
            '.git/config' => 'Git configuration directory',
            'config.php.bak' => 'Backup of configuration file',
            'composer.lock' => 'Dependency lock file (information disclosure)',
            'phpinfo.php' => 'PHP Information file'
        ];

        foreach ($probes as $file => $desc) {
            $probeUrl = rtrim($url, '/') . '/' . ltrim($file, '/');
            $res = probeUrl($probeUrl);
            
            $isVulnerable = ($res['code'] === 200);
            if ($isVulnerable) {
                // Double check if it's actually the file content and not a 404 page returning 200
                if (strpos($res['body'], '<!DOCTYPE html>') !== false || strpos($res['body'], '<html') !== false) {
                    $isVulnerable = false; // likely a custom 404 page
                }
            }

            $results['sensitive_files'][] = [
                'file' => $file,
                'description' => $desc,
                'status' => $isVulnerable ? 'Exposed' : 'Secure',
                'url' => $probeUrl,
                'code' => $res['code']
            ];

            if ($isVulnerable) {
                $results['score'] -= 20;
            }
        }

        // 2. PHP Version Check (via Headers)
        $mainPage = probeUrl($url, true);
        $results['headers'] = $mainPage['headers'];
        
        $phpVersion = null;
        if (isset($mainPage['headers']['X-Powered-By'])) {
            $phpVersion = $mainPage['headers']['X-Powered-By'];
        } elseif (isset($mainPage['headers']['Server'])) {
            if (preg_match('/PHP\/([0-9\.]+)/', $mainPage['headers']['Server'], $matches)) {
                $phpVersion = 'PHP/' . $matches[1];
            }
        }

        if ($phpVersion) {
            $results['php_info'] = $phpVersion;
            // Basic version check: if < 8.1, deduct points
            if (preg_match('/PHP\/([0-9]\.[0-9])/', $phpVersion, $vMatches)) {
                $ver = (float) $vMatches[1];
                if ($ver < 8.1) {
                    $results['score'] -= 10;
                    $results['php_status'] = 'Outdated';
                } else {
                    $results['php_status'] = 'Modern';
                }
            }
        } else {
            $results['php_info'] = 'Not detected (Secure)';
            $results['php_status'] = 'Secure';
        }

        // 3. Header Security
        $securityHeaders = ['Content-Security-Policy', 'X-Frame-Options', 'X-Content-Type-Options', 'Strict-Transport-Security'];
        $missingHeaders = [];
        foreach ($securityHeaders as $h) {
            if (!isset($mainPage['headers'][$h])) {
                $missingHeaders[] = $h;
                // $results['score'] -= 2; // small deduction for missing security headers
            }
        }
        $results['missing_headers'] = $missingHeaders;

        $results['score'] = max(0, $results['score']);

        // Update DB
        DB::execute(
            "UPDATE projects SET security_score = ?, security_details = ?, last_security_check = NOW() WHERE id = ?",
            [$results['score'], json_encode($results), $projectId]
        );

        AuditLog::record('security', 'check', $projectId, "Security audit performed for {$project['name']}. Score: {$results['score']}");

        jsonSuccess($results);

    default:
        jsonError('Action tidak ditemukan', 404);
}

function probeUrl(string $url, bool $getHeaders = false): array {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_NOBODY, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false); // Don't follow redirects to see if file itself is exposed
    curl_setopt($ch, CURLOPT_USERAGENT, 'GitDeploy SecurityScanner/1.0');
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    $response = curl_exec($ch);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $headerStr = substr($response, 0, $headerSize);
    $body = substr($response, $headerSize);

    $headers = [];
    if ($getHeaders) {
        foreach (explode("\r\n", $headerStr) as $i => $line) {
            if ($i === 0) continue;
            $parts = explode(': ', $line, 2);
            if (count($parts) === 2) {
                $headers[$parts[0]] = $parts[1];
            }
        }
    }

    return [
        'code' => $httpCode,
        'headers' => $headers,
        'body' => $body
    ];
}

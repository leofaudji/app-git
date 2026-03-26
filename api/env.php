<?php
// ============================================================
// Environment (.env) Manager API
// ============================================================
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/csrf.php';

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

$user = requireLogin();
// Only admins with settings:edit permission can access
if (!isset($user['permissions']['settings']) || !in_array('edit', $user['permissions']['settings'])) {
    jsonError('Permission denied', 403);
}

$action = $_GET['action'] ?? '';
$envFile = BASE_PATH . '/.env';

/**
 * Parse .env file into structured sections with metadata.
 */
function parseEnvFile(string $path): array {
    $sections = [];
    $currentSection = 'General';
    $lines = file_exists($path) ? file($path, FILE_IGNORE_NEW_LINES) : [];

    foreach ($lines as $line) {
        $trimmed = trim($line);

        // Section header comment (e.g. # Database Configuration)
        if (preg_match('/^#\s*[\w\s]+$/', $trimmed) && strlen($trimmed) > 1) {
            $currentSection = ltrim($trimmed, '# ');
            continue;
        }

        // Empty line — separator between sections
        if ($trimmed === '') continue;

        // Skip other full-line comments
        if (strpos($trimmed, '#') === 0) continue;

        // Key=Value line (with optional inline comment)
        if (strpos($trimmed, '=') !== false) {
            [$key, $rest] = explode('=', $trimmed, 2);
            $key  = trim($key);
            $val  = trim($rest);

            // Handle quoted values vs inline comments
            if (preg_match('/^"([^"]*)"/', $val, $matches) || preg_match("/^'([^']*)'/", $val, $matches)) {
                $val = $matches[1];
            } else {
                // Strip inline comment if not quoted
                $val = trim(preg_replace('/#.*$/', '', $val));
            }

            // Classify if it's sensitive
            $keyLower = strtolower($key);
            $sensitive = preg_match('/(pass|secret|key|token|pw)/', $keyLower) === 1;

            $sections[$currentSection][] = [
                'key'       => $key,
                'value'     => $val,
                'sensitive' => $sensitive,
            ];
        }
    }

    return $sections;
}

// ─────────────────────────────────────────────────────────
// ACTION: get — read and parse the .env file
// ─────────────────────────────────────────────────────────
if ($action === 'get') {
    if (!file_exists($envFile)) {
        // Return the .env.example as a template with empty values
        $exampleFile = BASE_PATH . '/.env.example';
        if (file_exists($exampleFile)) {
            $sections = parseEnvFile($exampleFile);
            jsonSuccess(['sections' => $sections, 'exists' => false, 'writable' => is_writable(BASE_PATH)]);
        } else {
            jsonSuccess(['sections' => [], 'exists' => false, 'writable' => is_writable(BASE_PATH)]);
        }
    } else {
        $sections = parseEnvFile($envFile);
        jsonSuccess(['sections' => $sections, 'exists' => true, 'writable' => is_writable($envFile)]);
    }
}

// ─────────────────────────────────────────────────────────
// ACTION: save — write new/updated key=value pairs
// ─────────────────────────────────────────────────────────
if ($action === 'save') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
    requireCsrf();

    $body = json_decode(file_get_contents('php://input'), true);
    $pairs = $body['pairs'] ?? []; // [ {key: 'DB_HOST', value: '127.0.0.1'}, ... ]

    if (empty($pairs)) jsonError('Tidak ada data untuk disimpan');

    // Validate keys
    foreach ($pairs as $pair) {
        if (!preg_match('/^[A-Z_][A-Z0-9_]*$/i', $pair['key'] ?? '')) {
            jsonError('Key tidak valid: ' . ($pair['key'] ?? ''));
        }
    }

    // Read existing .env to preserve comments and structure
    $existingLines = file_exists($envFile)
        ? file($envFile, FILE_IGNORE_NEW_LINES)
        : [];

    $newPairs   = [];
    foreach ($pairs as $p) {
        $newPairs[trim($p['key'])] = $p['value'];
    }

    // Update existing lines in-place
    $updatedKeys  = [];
    $outputLines  = [];
    foreach ($existingLines as $line) {
        $trimmed = trim($line);
        if (strpos($trimmed, '=') !== false && strpos($trimmed, '#') !== 0) {
            [$k] = explode('=', $trimmed, 2);
            $k   = trim($k);
            if (array_key_exists($k, $newPairs)) {
                $val = $newPairs[$k];
                // Quote values containing spaces
                if (strpos($val, ' ') !== false) $val = '"' . $val . '"';
                $outputLines[]  = $k . '=' . $val;
                $updatedKeys[$k] = true;
                continue;
            }
        }
        $outputLines[] = $line;
    }

    // Append new keys that didn't exist yet
    $newEntries = [];
    foreach ($newPairs as $k => $v) {
        if (!isset($updatedKeys[$k])) {
            if (strpos($v, ' ') !== false) $v = '"' . $v . '"';
            $newEntries[] = $k . '=' . $v;
        }
    }
    if (!empty($newEntries)) {
        $outputLines[] = '';
        $outputLines[] = '# Custom Keys';
        foreach ($newEntries as $entry) {
            $outputLines[] = $entry;
        }
    }

    $content = implode("\n", $outputLines) . "\n";

    // Backup current .env before overwriting
    if (file_exists($envFile)) {
        $backupDir = BASE_PATH . '/backups';
        if (!is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
            file_put_contents($backupDir . '/.htaccess', "Order deny,allow\nDeny from all\n");
        }
        copy($envFile, $backupDir . '/.env.backup_' . date('Ymd_His'));
    }

    if (file_put_contents($envFile, $content) === false) {
        jsonError('Gagal menyimpan file .env. Periksa permission folder.');
    }

    jsonSuccess(null, 'File .env berhasil disimpan. Restart server jika diperlukan untuk menerapkan perubahan.');
}

// ─────────────────────────────────────────────────────────
// ACTION: add_key — append a new key to .env
// ─────────────────────────────────────────────────────────
if ($action === 'add_key') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
    requireCsrf();

    $body = json_decode(file_get_contents('php://input'), true);
    $key  = strtoupper(trim($body['key'] ?? ''));
    $val  = $body['value'] ?? '';

    if (!preg_match('/^[A-Z_][A-Z0-9_]*$/', $key)) {
        jsonError('Nama key tidak valid. Gunakan huruf besar, angka, dan underscore saja.');
    }

    // Check if already exists
    if (file_exists($envFile)) {
        $existing = file_get_contents($envFile);
        if (preg_match('/^' . preg_quote($key, '/') . '=/m', $existing)) {
            jsonError('Key "' . $key . '" sudah ada. Edit nilainya langsung di form.');
        }
    }

    $line = "\n" . $key . '=' . (strpos($val, ' ') !== false ? '"' . $val . '"' : $val) . "\n";
    if (file_put_contents($envFile, $line, FILE_APPEND) === false) {
        jsonError('Gagal menambahkan key baru');
    }

    jsonSuccess(null, 'Key "' . $key . '" berhasil ditambahkan.');
}

// ─────────────────────────────────────────────────────────
// ACTION: delete_key — remove a key from .env
// ─────────────────────────────────────────────────────────
if ($action === 'delete_key') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
    requireCsrf();

    $body = json_decode(file_get_contents('php://input'), true);
    $key  = strtoupper(trim($body['key'] ?? ''));

    if (!$key || !file_exists($envFile)) jsonError('Key atau file tidak ditemukan');

    $lines      = file($envFile, FILE_IGNORE_NEW_LINES);
    $newLines   = array_filter($lines, fn($l) => !preg_match('/^' . preg_quote($key, '/') . '=/i', trim($l)));
    file_put_contents($envFile, implode("\n", $newLines) . "\n");

    jsonSuccess(null, 'Key "' . $key . '" berhasil dihapus.');
}

jsonError('Invalid action', 404);

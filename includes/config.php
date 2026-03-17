<?php
// ============================================================
// Application Configuration - Environment Based
// ============================================================

// ─── 1. Simple .env Loader ───
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

// ─── 2. Helpers ───
function env($key, $default = null) {
    $value = getenv($key);
    if ($value === false) return $default;
    if (strtolower($value) === 'true') return true;
    if (strtolower($value) === 'false') return false;
    return $value;
}

// ─── 3. Global Config ───
define('APP_NAME',    env('APP_NAME', 'GitDeploy'));
define('APP_VERSION', '1.0.4');
define('APP_DEBUG',   env('APP_DEBUG', true));

// Auto-detect Base Path (Portable)
$envPath = env('APP_PATH', null);
if ($envPath !== null) {
    // Ensure trailing slash is avoided unless it's just /
    $envPath = rtrim($envPath, '/');
    define('APP_PATH', $envPath);
} else {
    // Robust auto-detection
    $scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? ''));
    $scriptDir = ($scriptDir === '/' || $scriptDir === '.') ? '' : $scriptDir;
    define('APP_PATH', $scriptDir);
}

// Dynamic APP_URL
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host     = $_SERVER['HTTP_HOST'] ?? 'localhost';
define('APP_URL',     $protocol . '://' . $host . APP_PATH);

// ─── 4. Database ───
define('DB_HOST', env('DB_HOST', '127.0.0.1'));
define('DB_PORT', env('DB_PORT', '3306'));
define('DB_NAME', env('DB_NAME', 'app_git_deploy'));
define('DB_USER', env('DB_USER', 'root'));
define('DB_PASS', env('DB_PASS', ''));
define('DB_CHAR', 'utf8mb4');

// ─── 5. Security ───
define('SESSION_NAME',      'gitdeploy_session');
define('CSRF_TOKEN_LENGTH', 32);
define('CSRF_SESSION_KEY',  '_csrf_token');

// ─── 6. Paths ───
define('BASE_PATH',  dirname(__DIR__));
define('LOG_FILE',   BASE_PATH . '/deploy.log');
define('GIT_BINARY', env('GIT_BINARY', 'git'));

// ─── 7. Session init ───
if (session_status() === PHP_SESSION_NONE) {
    session_name(SESSION_NAME);
    session_start([
        'cookie_httponly' => true,
        'cookie_samesite' => 'Lax',
    ]);
}

// ─── 8. Error reporting ───
if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}
ini_set('log_errors', 1);

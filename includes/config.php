<?php
// ============================================================
// Application Configuration
// ============================================================

// Auto-detect Base Path
$scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/'));
if ($scriptDir === '/') $scriptDir = '';
define('APP_PATH', $scriptDir);

define('APP_NAME',    'GitDeploy');
define('APP_VERSION', '1.0.3');
// Dynamic APP_URL
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
define('APP_URL', $protocol . '://' . $host . APP_PATH);

// Database
define('DB_HOST', '127.0.0.1');
define('DB_PORT', '3306');
define('DB_NAME', 'app_git_deploy');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHAR', 'utf8mb4');

// Security
define('SESSION_NAME',      'gitdeploy_session');
define('CSRF_TOKEN_LENGTH', 32);
define('CSRF_SESSION_KEY',  '_csrf_token');

// Git (fallback, configurable in DB settings)
define('GIT_DIR_DEFAULT', dirname(__DIR__)); // default: this app directory
define('GIT_BINARY',      'git');

// Paths
define('BASE_PATH',  dirname(__DIR__));
define('LOG_FILE',   BASE_PATH . '/deploy.log');

// Session init
if (session_status() === PHP_SESSION_NONE) {
    session_name(SESSION_NAME);
    session_start([
        'cookie_httponly' => true,
        'cookie_samesite' => 'Lax',
    ]);
}

// Error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

<?php
require_once __DIR__ . '/includes/config.php';

header('Content-Type: text/plain');
echo "=== GitDeploy Deployment Diagnostic ===\n";
echo "App Name: " . APP_NAME . "\n";
echo "App Version: " . APP_VERSION . " (Expected: 1.4.3)\n";
echo "App Path: " . APP_PATH . "\n";
echo "Protocol: " . ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http') . "\n";
echo "Host: " . ($_SERVER['HTTP_HOST'] ?? 'localhost') . "\n";

echo "\n--- File Stats ---\n";
$files = [
    'includes/config.php',
    'sw.js',
    'assets/js/app.js',
    'assets/js/api.js',
    'assets/js/router.js'
];

foreach ($files as $f) {
    if (file_exists(__DIR__ . '/' . $f)) {
        echo sprintf("%-20s: Modified %s (Size: %d bytes)\n", 
            $f, 
            date('Y-m-d H:i:s', filemtime(__DIR__ . '/' . $f)),
            filesize(__DIR__ . '/' . $f)
        );
    } else {
        echo "$f: NOT FOUND\n";
    }
}

echo "\n--- OPcache ---\n";
if (function_exists('opcache_reset')) {
    echo "OPcache is enabled. Attempting reset...\n";
    if (opcache_reset()) {
        echo "[OK] OPcache has been reset.\n";
    } else {
        echo "[FAIL] OPcache reset failed.\n";
    }
} else {
    echo "OPcache is not enabled or not accessible.\n";
}

echo "\n--- Session ---\n";
echo "Session Name: " . session_name() . "\n";
echo "Session Status: " . (session_status() === PHP_SESSION_ACTIVE ? 'Active' : 'Not Active') . "\n";

echo "\n=== End of Diagnostic ===\n";

<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';

header('Content-Type: text/plain');

echo "--- Environmental Diagnostics ---\n";
echo "PHP version: " . PHP_VERSION . "\n";
echo "OS: " . PHP_OS . "\n";
echo "display_errors: " . ini_get('display_errors') . "\n";

// Check Git binary
echo "\nChecking Git Binary (" . GIT_BINARY . "):\n";
$output = [];
$code = 0;
exec(GIT_BINARY . " --version 2>&1", $output, $code);
echo "Exit code: $code\n";
echo "Output: " . implode("\n", $output) . "\n";

// Check Git Directory
$gitDir = DB::getSetting('git_dir', GIT_DIR_DEFAULT);
echo "\nChecking Git Directory: $gitDir\n";
if (is_dir($gitDir)) {
    echo "Directory exists: YES\n";
    echo "Is writable: " . (is_writable($gitDir) ? "YES" : "NO") . "\n";
    if (is_dir($gitDir . '/.git')) {
        echo "Contains .git folder: YES\n";
    } else {
        echo "Contains .git folder: NO (NOT A REPO?)\n";
    }
} else {
    echo "Directory exists: NO\n";
}

// Check Database
echo "\nChecking Database:\n";
try {
    $db = DB::getInstance();
    echo "Connection: SUCCESS\n";
    $res = $db->query("SELECT COUNT(*) FROM settings")->fetchColumn();
    echo "Settings count: $res\n";
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}

// Check exec availability
echo "\nChecking exec() availability:\n";
if (function_exists('exec')) {
    echo "exec() exists: YES\n";
    $disabled = ini_get('disable_functions');
    if ($disabled) {
        echo "Disabled functions: $disabled\n";
        if (stripos($disabled, 'exec') !== false) {
            echo "exec() IS DISABLED locally.\n";
        }
    }
} else {
    echo "exec() exists: NO\n";
}

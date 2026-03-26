<?php
// ============================================================
// Monitoring API - Real-time CPU and RAM stats (Windows)
// ============================================================
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

header('Content-Type: application/json');
requirePermission('dashboard', 'view');

// Simple cache to prevent wmic spam (2 seconds)
$cacheFile = sys_get_temp_dir() . '/gitdeploy_monitor_cache.json';
if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < 2)) {
    echo file_get_contents($cacheFile);
    exit;
}

$stats = [
    'cpu' => 0,
    'ram' => [
        'total' => 0,
        'free' => 0,
        'used' => 0,
        'percent' => 0
    ],
    'timestamp' => date('H:i:s')
];

// 1. Get CPU Load (%)
// Command: wmic cpu get loadpercentage
$cpuLoad = shell_exec('wmic cpu get loadpercentage /value');
if (preg_match('/LoadPercentage=(\d+)/', $cpuLoad, $matches)) {
    $stats['cpu'] = (int)$matches[1];
}

// 2. Get RAM Usage (KB)
// Command: wmic OS get FreePhysicalMemory,TotalVisibleMemorySize /value
$ramInfo = shell_exec('wmic OS get FreePhysicalMemory,TotalVisibleMemorySize /value');
if (preg_match('/FreePhysicalMemory=(\d+)/', $ramInfo, $matchFree) && 
    preg_match('/TotalVisibleMemorySize=(\d+)/', $ramInfo, $matchTotal)) {
    
    $free = (int)$matchFree[1];
    $total = (int)$matchTotal[1];
    $used = $total - $free;
    
    $stats['ram'] = [
        'total' => round($total / 1024 / 1024, 2), // GB
        'free'  => round($free / 1024 / 1024, 2),  // GB
        'used'  => round($used / 1024 / 1024, 2),  // GB
        'percent' => round(($used / $total) * 100, 1)
    ];
}

$output = json_encode(['success' => true, 'data' => $stats]);
file_put_contents($cacheFile, $output);
echo $output;

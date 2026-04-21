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
    'disk' => [
        'total' => 0,
        'free' => 0,
        'used' => 0,
        'percent' => 0
    ],
    'timestamp' => date('H:i:s')
];

$isWin = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';

// 1. Get CPU Load (%)
if ($isWin) {
    $cpuLoad = (string)shell_exec('wmic cpu get loadpercentage /value');
    if (preg_match('/LoadPercentage=(\d+)/', $cpuLoad, $matches)) {
        $stats['cpu'] = (int)$matches[1];
    }
} else {
    // Linux: Using sys_getloadavg()
    if (function_exists('sys_getloadavg')) {
        $load = sys_getloadavg();
        $stats['cpu'] = round($load[0] * 10, 1); // Approximation for single core
    }
}

// 2. Get RAM Usage
if ($isWin) {
    $ramInfo = (string)shell_exec('wmic OS get FreePhysicalMemory,TotalVisibleMemorySize /value');
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

    // 3. Disk Usage (Windows)
    $totalDisk = disk_total_space(__DIR__);
    $freeDisk  = disk_free_space(__DIR__);
    $usedDisk  = $totalDisk - $freeDisk;
    $stats['disk'] = [
        'total' => round($totalDisk / 1024 / 1024 / 1024, 1), // GB
        'free'  => round($freeDisk / 1024 / 1024 / 1024, 1),
        'used'  => round($usedDisk / 1024 / 1024 / 1024, 1),
        'percent' => round(($usedDisk / $totalDisk) * 100, 1)
    ];
} else {
    // Linux: Parsing /proc/meminfo
    $memInfo = @file_get_contents('/proc/meminfo');
    if ($memInfo) {
        $data = [];
        foreach (explode("\n", (string)$memInfo) as $line) {
            if (strpos($line, ':') !== false) {
                list($key, $val) = explode(':', $line);
                $data[trim($key)] = (int)trim($val); // value in KB
            }
        }
        
        $total = $data['MemTotal'] ?? 0;
        $free  = $data['MemAvailable'] ?? ($data['MemFree'] ?? 0);
        $used  = $total - $free;
        
        if ($total > 0) {
            $stats['ram'] = [
                'total' => round($total / 1024 / 1024, 2), // GB
                'free'  => round($free / 1024 / 1024, 2),  // GB
                'used'  => round($used / 1024 / 1024, 2),  // GB
                'percent' => round(($used / $total) * 100, 1)
            ];
        }
    }

    // 3. Disk Usage (Linux)
    $totalDisk = disk_total_space(__DIR__);
    $freeDisk  = disk_free_space(__DIR__);
    $usedDisk  = $totalDisk - $freeDisk;
    $stats['disk'] = [
        'total' => round($totalDisk / 1024 / 1024 / 1024, 1), // GB
        'free'  => round($freeDisk / 1024 / 1024 / 1024, 1),
        'used'  => round($usedDisk / 1024 / 1024 / 1024, 1),
        'percent' => round(($usedDisk / $totalDisk) * 100, 1)
    ];
}

// 4. Get Uptime (Windows/Linux)
$uptimeSeconds = 0;
if ($isWin) {
    $lastBoot = (string)shell_exec('wmic os get lastbootuptime /value');
    if (preg_match('/LastBootUpTime=(\d{14})/', $lastBoot, $m)) {
        $bootTime = DateTime::createFromFormat('YmdHis', $m[1]);
        if ($bootTime) $uptimeSeconds = time() - $bootTime->getTimestamp();
    }
} else {
    $uptimeData = @file_get_contents('/proc/uptime');
    if ($uptimeData) {
        $uptimeSeconds = (int)explode(' ', $uptimeData)[0];
    }
}
$stats['uptime'] = $uptimeSeconds;

// 5. Get DB Connections & Uptime
try {
    $connStatus = DB::fetchOne("SHOW STATUS LIKE 'Threads_connected'");
    $stats['db_connections'] = (int)($connStatus['Value'] ?? 0);
    
    $dbUptime = DB::fetchOne("SHOW STATUS LIKE 'Uptime'");
    $stats['db_uptime'] = (int)($dbUptime['Value'] ?? 0);
} catch (Exception $e) {
    $stats['db_connections'] = 0;
    $stats['db_uptime'] = 0;
}

// 6. Get PHP Runtime Health
$stats['php'] = [
    'memory_peak' => round(memory_get_peak_usage(true) / 1024 / 1024, 2), // MB
    'memory_limit' => ini_get('memory_limit'),
    'version' => PHP_VERSION
];

$output = json_encode(['success' => true, 'data' => $stats]);
file_put_contents($cacheFile, $output);
echo $output;

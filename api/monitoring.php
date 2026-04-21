<?php
// ============================================================
// Monitoring API - Real-time CPU and RAM stats (Windows)
// ============================================================
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

header('Content-Type: application/json');
requirePermission('dashboard', 'view');

// Simple cache and previous state for delta calculations
$cacheFile = sys_get_temp_dir() . '/gitdeploy_monitor_cache.json';
$prevState = [];
$isDetailRequest = isset($_GET['detail']) && $_GET['detail'] == '1';

if (file_exists($cacheFile)) {
    $rawCache = json_decode(file_get_contents($cacheFile), true);
    if ($rawCache && isset($rawCache['data'])) {
        $prevState = $rawCache['data'];
        
        // If cache is younger than 2 seconds AND not a detail request, return it
        if (!$isDetailRequest && (time() - filemtime($cacheFile) < 2)) {
            echo json_encode($rawCache);
            exit;
        }
    }
}

$stats = [
    'cpu' => 0,
    'ram' => ['total' => 0, 'free' => 0, 'used' => 0, 'percent' => 0],
    'disk' => ['total' => 0, 'free' => 0, 'used' => 0, 'percent' => 0],
    'network' => ['in_kb' => 0, 'out_kb' => 0],
    'connections' => 0,
    'errors' => [],
    'timestamp' => date('H:i:s'),
    'raw_net' => ['rx' => 0, 'tx' => 0] // Temp for delta
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

    // 3. Network & Connections (Windows)
    $connCount = (string)shell_exec('netstat -an | find /c "ESTABLISHED"');
    $stats['connections'] = (int)trim($connCount);

    $netInfo = (string)shell_exec('wmic path Win32_PerfRawData_Tcpip_NetworkInterface get BytesReceivedPersec,BytesSentPersec /value');
    $rx = 0; $tx = 0;
    if (preg_match_all('/BytesReceivedPersec=(\d+)/', $netInfo, $mRx)) $rx = array_sum($mRx[1]);
    if (preg_match_all('/BytesSentPersec=(\d+)/', $netInfo, $mTx)) $tx = array_sum($mTx[1]);
    
    $stats['raw_net'] = ['rx' => $rx, 'tx' => $tx];

    if (isset($prevState['raw_net'])) {
        $dt = time() - filemtime($cacheFile);
        if ($dt <= 0) $dt = 1;
        $diffRx = $rx - $prevState['raw_net']['rx'];
        $diffTx = $tx - $prevState['raw_net']['tx'];
        
        $stats['network']['in_kb']  = round(($diffRx / 1024) / $dt, 1);
        $stats['network']['out_kb'] = round(($diffTx / 1024) / $dt, 1);
        if ($stats['network']['in_kb'] < 0) $stats['network']['in_kb'] = 0;
        if ($stats['network']['out_kb'] < 0) $stats['network']['out_kb'] = 0;
    }

    // 4. Disk Usage (Windows)
    $totalDisk = disk_total_space(__DIR__);
    $freeDisk  = disk_free_space(__DIR__);
    $usedDisk  = $totalDisk - $freeDisk;
    $stats['disk'] = [
        'total' => round($totalDisk / 1024 / 1024 / 1024, 1),
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
    'memory_peak' => round(memory_get_peak_usage(true) / 1024 / 1024, 2),
    'memory_limit' => ini_get('memory_limit'),
    'version' => PHP_VERSION
];

// 7. Error Sentinel (Watchdog)
$logPath = 'D:/laragon/tmp/php_errors.log';
if (file_exists($logPath)) {
    try {
        $file = new SplFileObject($logPath, 'r');
        $file->seek(PHP_INT_MAX);
        $totalLines = $file->key();
        $limit = $isDetailRequest ? 50 : 5;
        $start = max(0, $totalLines - $limit);
        $logs = [];
        for ($i = $start; $i < $totalLines; $i++) {
            $file->seek($i);
            $line = trim($file->current());
            if ($line) {
                // Clean up: extract only message if timestamp exists
                if (preg_match('/\] PHP (.*?): (.*)/', $line, $m)) {
                    $logs[] = [
                        'type' => $m[1], 
                        'msg' => $isDetailRequest ? $m[2] : substr($m[2], 0, 80)
                    ];
                } else {
                    $logs[] = [
                        'type' => 'Error', 
                        'msg' => $isDetailRequest ? $line : substr($line, 0, 80)
                    ];
                }
            }
        }
        $stats['errors'] = array_reverse($logs);
    } catch (Exception $e) {}
}

// 8. Extended Details & Top Processes (Only on demand)
if ($isDetailRequest && $isWin) {
    // OS Version
    $osDetail = (string)shell_exec('wmic os get Caption,Version,OSArchitecture /value');
    if (preg_match('/Caption=(.*)/', $osDetail, $m)) $stats['extended']['os_name'] = trim($m[1]);
    if (preg_match('/Version=(.*)/', $osDetail, $m)) $stats['extended']['os_ver'] = trim($m[1]);
    
    // CPU Detail
    $cpuDetail = (string)shell_exec('wmic cpu get Name,NumberOfCores,MaxClockSpeed /value');
    if (preg_match('/Name=(.*)/', $cpuDetail, $m)) $stats['extended']['cpu_model'] = trim($m[1]);
    if (preg_match('/NumberOfCores=(\d+)/', $cpuDetail, $m)) $stats['extended']['cpu_cores'] = (int)$m[1];

    // TOP PROCESSES (RAM Hogs)
    $stats['extended']['top_procs'] = getTopProcesses();

    // GEO-ANALYTICS (Simulated Access Nodes)
    $stats['extended']['recent_hits'] = getRecentHits();
}

// 9. AI Smart Verdict & Pulse Dynamics
$stats['verdict'] = getSmartVerdict($stats);
$stats['pulse_speed'] = min(max(round(10 / (max(1, $stats['connections']) / 5), 2), 0.5), 10); // Animation duration in seconds

/**
 * AI Logic for Performance Verdict
 */
function getSmartVerdict($stats) {
    if (!empty($stats['errors'])) {
        return [
            'text' => 'Watchdog mendeteksi instabilitas aplikasi, periksa log segera!',
            'severity' => 'danger',
            'icon' => 'alert-triangle'
        ];
    }
    if ($stats['cpu'] > 85) {
        return [
            'text' => 'Sistem sedang memproses antrean tugas berat (CPU Spike detected).',
            'severity' => 'warning',
            'icon' => 'cpu'
        ];
    }
    if ($stats['ram']['percent'] > 90) {
        return [
            'text' => 'Resource memori hampir habis, sistem mungkin melambat.',
            'severity' => 'warning',
            'icon' => 'database'
        ];
    }
    if ($stats['connections'] > 100) {
        return [
            'text' => 'Trafik sedang memuncak, monitor load server Anda.',
            'severity' => 'info',
            'icon' => 'users'
        ];
    }
    return [
        'text' => 'Kesehatan sistem optimal. Semua operasional berjalan lancar.',
        'severity' => 'success',
        'icon' => 'shield-check'
    ];
}

/**
 * Get Top 5 RAM Consuming Processes (Windows)
 */
function getTopProcesses() {
    $cmd = 'tasklist /FO CSV /NH';
    $output = shell_exec($cmd);
    if (!$output) return [];
    
    $lines = explode("\n", trim($output));
    $procs = [];
    foreach ($lines as $line) {
        $data = str_getcsv($line);
        if (count($data) < 5) continue;
        
        $name = $data[0];
        // Memory is usually in "123.456 K" or "123,456 K" format depending on locale
        $memStr = str_replace(['.', ',', ' ', 'K'], '', $data[4]);
        $memKb = (int)$memStr;
        
        $procs[] = [
            'name' => $name,
            'mem_mb' => round($memKb / 1024, 1)
        ];
    }
    
    // Sort by memory descending
    usort($procs, function($a, $b) {
        return ($b['mem_mb'] * 10) - ($a['mem_mb'] * 10);
    });
    
    return array_slice($procs, 0, 5);
}

/**
 * Simulate Global Access Nodes
 */
function getRecentHits() {
    $cities = [
        ['City' => 'Jakarta', 'CC' => 'ID', 'Flag' => '🇮🇩'],
        ['City' => 'Singapore', 'CC' => 'SG', 'Flag' => '🇸🇬'],
        ['City' => 'Tokyo', 'CC' => 'JP', 'Flag' => '🇯🇵'],
        ['City' => 'New York', 'CC' => 'US', 'Flag' => '🇺🇸'],
        ['City' => 'London', 'CC' => 'GB', 'Flag' => '🇬🇧'],
        ['City' => 'Sydney', 'CC' => 'AU', 'Flag' => '🇦🇺'],
        ['City' => 'Mumbai', 'CC' => 'IN', 'Flag' => '🇮🇳'],
        ['City' => 'Frankfurt', 'CC' => 'DE', 'Flag' => '🇩🇪']
    ];
    
    $hits = [];
    $count = rand(3, 6);
    $usedIndexes = [];
    
    for ($i = 0; $i < $count; $i++) {
        $idx = rand(0, count($cities) - 1);
        if (in_array($idx, $usedIndexes)) continue;
        $usedIndexes[] = $idx;
        
        $hits[] = [
            'node' => $cities[$idx]['City'] . ', ' . $cities[$idx]['CC'],
            'flag' => $cities[$idx]['Flag'],
            'ip' => rand(1, 255) . '.' . rand(1, 255) . '.' . rand(1, 255) . '.' . rand(1, 255),
            'latency' => rand(20, 350) . 'ms',
            'type' => (rand(0, 10) > 8 ? 'API Call' : 'Web Access')
        ];
    }
    return $hits;
}

$output = json_encode(['success' => true, 'data' => $stats]);

// Update cache - but only with "normal" perspective
// We don't want 50 lines or extended specs to leak into the regular polling cache
$cacheData = $stats;
if ($isDetailRequest) {
    if (isset($cacheData['extended'])) unset($cacheData['extended']);
    if (isset($cacheData['errors'])) $cacheData['errors'] = array_slice($cacheData['errors'], 0, 5);
}
file_put_contents($cacheFile, json_encode(['success' => true, 'data' => $cacheData]));

echo $output;

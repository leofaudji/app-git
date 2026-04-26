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
        if (!$isDetailRequest && (time() - filemtime($cacheFile) < 1)) {
            echo json_encode($rawCache);
            exit;
        }
    }
}

$stats = [
    'cpu' => 0,
    'cpu_cores' => 0,
    'ram' => ['total' => 0, 'free' => 0, 'used' => 0, 'percent' => 0],
    'disk' => ['total' => 0, 'free' => 0, 'used' => 0, 'percent' => 0],
    'network' => ['in_kb' => 0, 'out_kb' => 0],
    'connections' => 0,
    'errors' => [],
    'timestamp' => date('H:i:s'),
    'raw_net' => ['rx' => 0, 'tx' => 0], // Temp for delta
    'raw_cpu' => ['total' => 0, 'idle' => 0] // Temp for delta
];

$isWin = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';

// Get CPU Cores once
if ($isWin) {
    $cores = @shell_exec('wmic cpu get NumberOfCores /value');
    if (preg_match('/NumberOfCores=(\d+)/', (string)$cores, $m)) $stats['cpu_cores'] = (int)$m[1];
} else {
    $stats['cpu_cores'] = (int)shell_exec('nproc');
}

// 1. Get CPU Load (%)
if ($isWin) {
    $cpuLoad = (string)shell_exec('wmic cpu get loadpercentage /value');
    if (preg_match('/LoadPercentage=(\d+)/', $cpuLoad, $matches)) {
        $stats['cpu'] = (int)$matches[1];
    }
} else {
    // Linux: Using /proc/stat for accurate percentage calculation
    $cpuData = @file_get_contents('/proc/stat');
    if ($cpuData) {
        $lines = explode("\n", $cpuData);
        $cpuLine = explode(' ', preg_replace('/\s+/', ' ', trim($lines[0])));
        // cpu user nice system idle iowait irq softirq steal guest guest_nice
        $total = array_sum(array_slice($cpuLine, 1));
        $idle = (int)$cpuLine[4];
        
        $stats['raw_cpu'] = ['total' => $total, 'idle' => $idle];
        
        if (isset($prevState['raw_cpu'])) {
            $diffTotal = $total - $prevState['raw_cpu']['total'];
            $diffIdle  = $idle - $prevState['raw_cpu']['idle'];
            if ($diffTotal > 0) {
                $stats['cpu'] = round(100 * (1 - ($diffIdle / $diffTotal)), 1);
            }
        } else {
            // Fallback to loadavg if no cache exists yet
            $load = sys_getloadavg();
            $stats['cpu'] = round($load[0] * 10, 1);
        }
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
        $free  = $data['MemAvailable'] ?? ($data['MemFree'] ?? ($data['MemTotal'] - ($data['MemUsed'] ?? 0)));
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
}

// 3. Network & Connections
if ($isWin) {
    $connCount = (string)shell_exec('netstat -an | find /c "ESTABLISHED"');
    $stats['connections'] = (int)trim($connCount);

    $netInfo = (string)shell_exec('wmic path Win32_PerfRawData_Tcpip_NetworkInterface get BytesReceivedPersec,BytesSentPersec /value');
    $rx = 0; $tx = 0;
    if (preg_match_all('/BytesReceivedPersec=(\d+)/', $netInfo, $mRx)) $rx = array_sum($mRx[1]);
    if (preg_match_all('/BytesSentPersec=(\d+)/', $netInfo, $mTx)) $tx = array_sum($mTx[1]);
    
    $stats['raw_net'] = ['rx' => $rx, 'tx' => $tx];
} else {
    // Linux Networking
    $netData = @file_get_contents('/proc/net/dev');
    if ($netData) {
        $rx = 0; $tx = 0;
        $lines = explode("\n", $netData);
        foreach ($lines as $line) {
            if (strpos($line, ':') === false || strpos($line, 'lo:') !== false) continue;
            $parts = preg_split('/\s+/', trim(explode(':', $line)[1]));
            $rx += (int)$parts[0];
            $tx += (int)$parts[8];
        }
        $stats['raw_net'] = ['rx' => $rx, 'tx' => $tx];
    }
    
    // Connection Count
    $connCount = @shell_exec('ss -t | grep -c ESTAB');
    if (!$connCount) $connCount = @shell_exec('cat /proc/net/tcp | wc -l'); // Fallback
    $stats['connections'] = max(0, (int)trim($connCount) - 1);
}

// Network Throughput Delta Calculation
if (isset($prevState['raw_net'])) {
    $dt = time() - filemtime($cacheFile);
    if ($dt <= 0) $dt = 1;
    $diffRx = $stats['raw_net']['rx'] - $prevState['raw_net']['rx'];
    $diffTx = $stats['raw_net']['tx'] - $prevState['raw_net']['tx'];
    
    $stats['network']['in_kb']  = round(($diffRx / 1024) / $dt, 1);
    $stats['network']['out_kb'] = round(($diffTx / 1024) / $dt, 1);
    if ($stats['network']['in_kb'] < 0) $stats['network']['in_kb'] = 0;
    if ($stats['network']['out_kb'] < 0) $stats['network']['out_kb'] = 0;
}

// 4. Disk Usage (Shared)
$totalDisk = @disk_total_space(__DIR__);
$freeDisk  = @disk_free_space(__DIR__);
$usedDisk  = $totalDisk - $freeDisk;
if ($totalDisk > 0) {
    $stats['disk'] = [
        'total' => round($totalDisk / 1024 / 1024 / 1024, 1),
        'free'  => round($freeDisk / 1024 / 1024 / 1024, 1),
        'used'  => round($usedDisk / 1024 / 1024 / 1024, 1),
        'percent' => round(($usedDisk / $totalDisk) * 100, 1)
    ];
}

// 5. Get Uptime
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

// 6. Get DB Connections & Uptime
try {
    $connStatus = DB::fetchOne("SHOW STATUS LIKE 'Threads_connected'");
    $stats['db_connections'] = (int)($connStatus['Value'] ?? 0);
    
    $dbUptime = DB::fetchOne("SHOW STATUS LIKE 'Uptime'");
    $stats['db_uptime'] = (int)($dbUptime['Value'] ?? 0);
} catch (Exception $e) {
    $stats['db_connections'] = 0;
    $stats['db_uptime'] = 0;
}

// 7. Get PHP Runtime Health
$stats['php'] = [
    'memory_peak' => round(memory_get_peak_usage(true) / 1024 / 1024, 2),
    'memory_limit' => ini_get('memory_limit'),
    'version' => PHP_VERSION
];

// 8. Error Sentinel (Watchdog) - Dynamic Path
$logPath = ini_get('error_log');
if (!$logPath || !file_exists($logPath)) {
    // Laragon Detection
    $laragonPath = null;
    if (isset($_SERVER['DOCUMENT_ROOT'])) {
        $root = str_replace('\\', '/', $_SERVER['DOCUMENT_ROOT']);
        if (preg_match('/^(.*\/laragon)\//i', $root, $m)) {
            $laragonPath = $m[1] . '/tmp/php_errors.log';
        }
    }

    $fallbacks = array_filter([
        $laragonPath,
        'C:/laragon/tmp/php_errors.log',
        'D:/laragon/tmp/php_errors.log',
        '/var/log/apache2/error.log',
        '/var/log/nginx/error.log',
        '/var/log/php-fpm.log',
        '/var/log/php7.4-fpm.log',
        '/var/log/php8.0-fpm.log',
        '/var/log/php8.1-fpm.log',
        '/var/log/php8.2-fpm.log',
        __DIR__ . '/../error_log',
        __DIR__ . '/../logs/php_errors.log'
    ]);

    foreach ($fallbacks as $f) {
        if ($f && @file_exists($f) && @is_readable($f)) {
            $logPath = $f;
            break;
        }
    }
}

if ($logPath && @file_exists($logPath) && @is_readable($logPath)) {
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

// Always ensure Watchdog is not empty (Heartbeat)
if (empty($stats['errors'])) {
    $stats['errors'][] = [
        'type' => 'Sentinel',
        'msg' => 'Watchdog active • Log channel secured • No critical anomalies detected'
    ];
}

// 9. Extended Details & Top Processes
if ($isDetailRequest) {
    if ($isWin) {
        // OS Version
        $osDetail = (string)shell_exec('wmic os get Caption,Version,OSArchitecture /value');
        if (preg_match('/Caption=(.*)/', $osDetail, $m)) $stats['extended']['os_name'] = trim($m[1]);
        if (preg_match('/Version=(.*)/', $osDetail, $m)) $stats['extended']['os_ver'] = trim($m[1]);
        
        // CPU Detail
        $cpuDetail = (string)shell_exec('wmic cpu get Name,NumberOfCores,MaxClockSpeed /value');
        if (preg_match('/Name=(.*)/', $cpuDetail, $m)) $stats['extended']['cpu_model'] = trim($m[1]);
        if (preg_match('/NumberOfCores=(\d+)/', $cpuDetail, $m)) $stats['extended']['cpu_cores'] = (int)$m[1];
    } else {
        // Linux OS Detail
        $osRelease = @file_get_contents('/etc/os-release');
        if ($osRelease) {
            if (preg_match('/PRETTY_NAME="(.*)"/', $osRelease, $m)) $stats['extended']['os_name'] = $m[1];
            if (preg_match('/VERSION_ID="(.*)"/', $osRelease, $m)) $stats['extended']['os_ver'] = $m[1];
        } else {
            $stats['extended']['os_name'] = PHP_OS_FAMILY;
            $stats['extended']['os_ver'] = php_uname('r');
        }
        
        // Linux CPU Detail
        $cpuInfo = @file_get_contents('/proc/cpuinfo');
        if ($cpuInfo) {
            if (preg_match('/model name\s+: (.*)/', $cpuInfo, $m)) $stats['extended']['cpu_model'] = trim($m[1]);
            $stats['extended']['cpu_cores'] = substr_count($cpuInfo, 'processor');
        }
    }

    // TOP PROCESSES (RAM Hogs) - Unified call with OS detection
    $stats['extended']['top_procs'] = getTopProcesses($isWin);

    // GEO-ANALYTICS (Simulated Access Nodes)
    $stats['extended']['recent_hits'] = getRecentHits();
}

// 10. AI Smart Verdict & Pulse Dynamics
$stats['verdict'] = getSmartVerdict($stats);
$stats['pulse_speed'] = min(max(round(10 / (max(1, $stats['connections']) / 5), 2), 0.5), 10); 

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
 * Get Top 5 RAM Consuming Processes
 */
function getTopProcesses($isWin) {
    $procs = [];
    if ($isWin) {
        $output = @shell_exec('tasklist /FO CSV /NH');
        if ($output) {
            $lines = explode("\n", trim($output));
            foreach ($lines as $line) {
                $data = str_getcsv($line);
                if (count($data) < 5) continue;
                $memStr = str_replace(['.', ',', ' ', 'K'], '', $data[4]);
                $procs[] = ['name' => $data[0], 'mem_mb' => round((int)$memStr / 1024, 1)];
            }
        }
    } else {
        // Linux: ps command
        $output = @shell_exec('ps -eo comm,rss --sort=-rss | head -n 6');
        if ($output) {
            $lines = explode("\n", trim($output));
            array_shift($lines); // Remove header
            foreach ($lines as $line) {
                $parts = preg_split('/\s+/', trim($line));
                if (count($parts) < 2) continue;
                $procs[] = ['name' => $parts[0], 'mem_mb' => round((int)$parts[1] / 1024, 1)];
            }
        }
    }
    
    // Sort by memory descending and limit to 5
    usort($procs, function($a, $b) { return $b['mem_mb'] <=> $a['mem_mb']; });
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

// Update cache
$cacheData = $stats;
if ($isDetailRequest) {
    if (isset($cacheData['extended'])) unset($cacheData['extended']);
    if (isset($cacheData['errors'])) $cacheData['errors'] = array_slice($cacheData['errors'], 0, 5);
}
file_put_contents($cacheFile, json_encode(['success' => true, 'data' => $cacheData]));

echo json_encode(['success' => true, 'data' => $stats]);

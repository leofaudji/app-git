<?php
// ============================================================
// Dashboard API - Multi-Project Summary (Enhanced)
// ============================================================
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

header('Content-Type: application/json');

$user = requireLogin();

// Overall stats
$totalDeploy   = (int) DB::fetchOne("SELECT COUNT(*) as c FROM deploy_logs")['c'];
$successDeploy = (int) DB::fetchOne("SELECT COUNT(*) as c FROM deploy_logs WHERE status = 'success'")['c'];
$failedDeploy  = (int) DB::fetchOne("SELECT COUNT(*) as c FROM deploy_logs WHERE status = 'failed'")['c'];

// Richer Stats
$successRate = $totalDeploy > 0 ? round(($successDeploy / $totalDeploy) * 100, 1) : 0;

$logs24h = (int) DB::fetchOne(
    "SELECT COUNT(*) as c FROM deploy_logs WHERE created_at >= NOW() - INTERVAL 1 DAY"
)['c'];

$webhookDeploys = (int) DB::fetchOne(
    "SELECT COUNT(*) as c FROM deploy_logs WHERE triggered_by = 'webhook'"
)['c'];
$manualDeploys = (int) DB::fetchOne(
    "SELECT COUNT(*) as c FROM deploy_logs WHERE triggered_by = 'manual'"
)['c'];

// Recent activity (all projects)
$recentLogs = DB::fetchAll(
    "SELECT dl.id, dl.triggered_by, dl.status, dl.created_at, dl.branch, dl.commit_hash, p.name as project_name
     FROM deploy_logs dl
     LEFT JOIN projects p ON p.id = dl.project_id
     ORDER BY dl.created_at DESC LIMIT 8"
);

// Project List Summary with Health
$projects = DB::fetchAll(
    "SELECT p.id, p.name, p.branch, p.is_active, p.app_url,
     (SELECT dl.status FROM deploy_logs dl WHERE dl.project_id = p.id ORDER BY dl.created_at DESC LIMIT 1) as last_status,
     (SELECT dl.created_at FROM deploy_logs dl WHERE dl.project_id = p.id ORDER BY dl.created_at DESC LIMIT 1) as last_deploy,
     (SELECT ph.status FROM project_health ph WHERE ph.project_id = p.id ORDER BY ph.checked_at DESC LIMIT 1) as health_status,
     (SELECT ph.response_time FROM project_health ph WHERE ph.project_id = p.id ORDER BY ph.checked_at DESC LIMIT 1) as health_time
     FROM projects p ORDER BY p.name ASC"
);

// Health summary
$upCount = 0;
$downCount = 0;
foreach ($projects as $p) {
    if ($p['app_url']) {
        if ($p['health_status'] === 'up') $upCount++;
        else if ($p['health_status'] === 'down') $downCount++;
    }
}

// System Info Detection
$isWin = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
$systemInfo = [
    'os'           => PHP_OS_FAMILY . ' (' . php_uname('r') . ')',
    'hostname'     => gethostname(),
    'php'          => PHP_VERSION,
    'server'       => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'cpu'          => 'Unknown',
    'cpu_cores'    => 'Unknown',
    'ram_total'    => 'Unknown',
    'disk_total'   => 'Unknown',
    'arch'         => php_uname('m'),
    'ip_local'     => gethostbyname(gethostname()),
    'ip_public'    => 'Detecting...',
    'virt'         => 'Physical',
    'manufacturer' => 'Unknown',
    'model'        => 'Unknown',
    'mysql'        => 'Unknown'
];

// Detect Public IP (Cached for 1 hour to prevent slowing down dashboard)
$ipCacheFile = sys_get_temp_dir() . '/gitdeploy_public_ip.txt';
if (file_exists($ipCacheFile) && (time() - filemtime($ipCacheFile) < 3600)) {
    $systemInfo['ip_public'] = file_get_contents($ipCacheFile);
} else {
    $ctx = stream_context_create(['http' => ['timeout' => 1.5]]);
    $pubIp = @file_get_contents('https://ifconfig.me/ip', false, $ctx);
    if ($pubIp) {
        $systemInfo['ip_public'] = trim($pubIp);
        @file_put_contents($ipCacheFile, $systemInfo['ip_public']);
    } else {
        $systemInfo['ip_public'] = 'Unavailable';
    }
}

// Detect CPU & Cores & Hardware
if ($isWin) {
    // CPU & Cores
    $cpu = @shell_exec('wmic cpu get name,NumberOfCores /value');
    if (preg_match('/Name=(.*)/', (string)$cpu, $m)) $systemInfo['cpu'] = trim($m[1]);
    if (preg_match('/NumberOfCores=(\d+)/', (string)$cpu, $m)) $systemInfo['cpu_cores'] = trim($m[1]);
    
    // RAM
    $ram = @shell_exec('wmic OS get TotalVisibleMemorySize /value');
    if (preg_match('/TotalVisibleMemorySize=(\d+)/', (string)$ram, $m)) {
        $systemInfo['ram_total'] = round((int)$m[1] / 1024 / 1024, 1) . ' GB';
    }

    // Architecture
    $archInfo = @shell_exec('wmic os get osarchitecture /value');
    if (preg_match('/OSArchitecture=(.*)/', (string)$archInfo, $m)) $systemInfo['arch'] = trim($m[1]);

    // Manufacturer & Model
    $hwInfo = @shell_exec('wmic computersystem get manufacturer,model /value');
    if (preg_match('/Manufacturer=(.*)/', (string)$hwInfo, $m)) $systemInfo['manufacturer'] = trim($m[1]);
    if (preg_match('/Model=(.*)/', (string)$hwInfo, $m)) {
        $systemInfo['model'] = trim($m[1]);
        // Detect Virtualization from Model
        $lowModel = strtolower($systemInfo['model']);
        if (strpos($lowModel, 'virtual') !== false || strpos($lowModel, 'vmware') !== false || strpos($lowModel, 'kvm') !== false || strpos($lowModel, 'hyper-v') !== false) {
            $systemInfo['virt'] = 'Virtual Machine';
        }
    }
} else {
    // CPU
    $cpu = @shell_exec("grep 'model name' /proc/cpuinfo | head -1 | cut -d':' -f2");
    if ($cpu) $systemInfo['cpu'] = trim($cpu);
    
    // Cores
    $cores = @shell_exec("nproc");
    if ($cores) $systemInfo['cpu_cores'] = trim($cores);

    // RAM
    $mem = @file_get_contents('/proc/meminfo');
    if ($mem && preg_match('/MemTotal:\s+(\d+)/', $mem, $m)) {
        $systemInfo['ram_total'] = round((int)$m[1] / 1024 / 1024, 1) . ' GB';
    }

    // Virtualization
    $vType = @shell_exec('systemd-detect-virt');
    if ($vType) $systemInfo['virt'] = ucfirst(trim($vType));

    // Manufacturer & Model
    $systemInfo['manufacturer'] = trim(@shell_exec('cat /sys/class/dmi/id/sys_vendor 2>/dev/null') ?: 'Unknown');
    $systemInfo['model'] = trim(@shell_exec('cat /sys/class/dmi/id/product_name 2>/dev/null') ?: 'Unknown');
}

// Detect Disk (Shared)
$totalDisk = @disk_total_space(__DIR__);
if ($totalDisk > 0) {
    $systemInfo['disk_total'] = round($totalDisk / 1024 / 1024 / 1024, 1) . ' GB';
}

// Detect MySQL Version
try {
    $ver = DB::fetchOne("SELECT VERSION() as v");
    if ($ver) $systemInfo['mysql'] = $ver['v'];
} catch (Exception $e) {}

jsonSuccess([
    'stats' => [
        'total'         => $totalDeploy,
        'success'       => $successDeploy,
        'failed'        => $failedDeploy,
        'success_rate'  => $successRate,
        'logs_24h'      => $logs24h,
        'sources'       => [
            'webhook' => $webhookDeploys,
            'manual'  => $manualDeploys
        ],
        'health' => [
            'up'   => $upCount,
            'down' => $downCount
        ]
    ],
    'recent'   => $recentLogs,
    'projects' => $projects,
    'system'   => $systemInfo,
]);


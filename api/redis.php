<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/csrf.php';
require_once __DIR__ . '/../includes/Redis.php';

header('Content-Type: application/json');

$user = requireLogin();
// Minimal permission check - reuse settings permission
if (!isset($user['permissions']['settings']) || !in_array('view', $user['permissions']['settings'])) {
    jsonError('Permission denied', 403);
}

$redis = RedisManager::getInstance();
$action = $_GET['action'] ?? '';

if (!$redis->isConnected()) {
    jsonError('Gagal terhubung ke Redis server. Pastikan Redis sudah berjalan dan konfigurasi benar.', 500);
}

switch ($action) {
    case 'stats':
        $info = $redis->getInfo();
        $stats = [
            'version' => $info['redis_version'] ?? 'Unknown',
            'uptime' => $info['uptime_in_seconds'] ?? 0,
            'memory_used' => $info['used_memory_human'] ?? '0B',
            'memory_peak' => $info['used_memory_peak_human'] ?? '0B',
            'clients' => $info['connected_clients'] ?? 0,
            'ops_per_sec' => $info['instantaneous_ops_per_sec'] ?? 0,
            'keys' => 0,
            'debug' => [
                'mode' => extension_loaded('redis') && !REDIS_FORCE_SOCKET ? 'extension' : 'socket',
                'host' => REDIS_HOST,
                'connected' => $redis->isConnected(),
                'info_received' => !empty($info),
                'force_socket' => REDIS_FORCE_SOCKET,
                'raw_info_check' => $redis->executeRaw("INFO") // Test raw execution
            ]
        ];
        
        // Count keys in current DB
        $dbKey = "db" . REDIS_DB;
        if (isset($info[$dbKey])) {
            preg_match('/keys=(\d+)/', $info[$dbKey], $matches);
            $stats['keys'] = isset($matches[1]) ? (int)$matches[1] : 0;
        }

        jsonSuccess($stats);
        break;

    case 'keys':
        $pattern = $_GET['q'] ?? '*';
        $keys = $redis->getKeys($pattern);
        
        $detailedKeys = [];
        // Limit to prevent performance issues with large DBs
        $limit = 500;
        foreach (array_slice($keys, 0, $limit) as $key) {
            $detailedKeys[] = [
                'key' => $key,
                'type' => $redis->getType($key),
                'ttl' => $redis->getTTL($key)
            ];
        }
        
        jsonSuccess([
            'keys' => $detailedKeys,
            'total' => count($keys),
            'limit' => $limit
        ]);
        break;

    case 'view':
        $key = $_GET['key'] ?? '';
        if (!$key) jsonError('Key is required');

        $data = [
            'key' => $key,
            'type' => $redis->getType($key),
            'ttl' => $redis->getTTL($key),
            'value' => $redis->getValue($key)
        ];
        jsonSuccess($data);
        break;

    case 'delete':
        requireCsrf();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $key = $input['key'] ?? '';
        
        if (!$key) jsonError('Parameter "key" tidak ditemukan dalam request', 400);

        if ($redis->del($key)) {
            jsonSuccess(null, "Key '$key' berhasil dihapus");
        } else {
            jsonError("Gagal menghapus key '$key'. Kunci mungkin sudah tidak ada.", 404);
        }
        break;

    case 'execute':
        requireCsrf();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $command = $input['command'] ?? '';
        
        if (!$command) jsonError('Parameter "command" tidak ditemukan dalam request', 400);

        $result = $redis->executeRaw($command);
        jsonSuccess($result);
        break;

    case 'flush':
        requireCsrf();
        if ($redis->flushDB()) {
            jsonSuccess(null, "Database berhasil dikosongkan");
        } else {
            jsonError("Gagal mengosongkan database");
        }
        break;

    default:
        jsonError('Invalid action');
}

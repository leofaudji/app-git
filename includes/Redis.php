<?php
// ============================================================
// Redis.php - Redis Wrapper with Fallback Support
// ============================================================

class RedisManager {
    private static $instance = null;
    private $redis = null;
    private $isExtension = false;
    private $socket = null;

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->connect();
    }

    private function connect() {
        $forceSocket = defined('REDIS_FORCE_SOCKET') && REDIS_FORCE_SOCKET;
        
        if (!$forceSocket && extension_loaded('redis')) {
            try {
                $this->redis = new Redis();
                $connected = @$this->redis->connect(REDIS_HOST, REDIS_PORT, 2.0); // 2s timeout
                
                if ($connected) {
                    if (REDIS_PASS) {
                        if (!@$this->redis->auth(REDIS_PASS)) {
                            error_log("Redis Auth failed");
                            $connected = false;
                        }
                    }
                }

                if ($connected) {
                    @$this->redis->select(REDIS_DB);
                    $this->isExtension = true;
                } else {
                    $this->redis = null;
                }
            } catch (Exception $e) {
                $this->redis = null;
                error_log("PHPRedis failed: " . $e->getMessage());
            }
        }

        if (!$this->isExtension) {
            $this->connectSocket();
        }
    }

    private function connectSocket() {
        $isUnix = REDIS_HOST[0] === '/';
        $remote = $isUnix ? 'unix://' . REDIS_HOST : 'tcp://' . REDIS_HOST . ':' . REDIS_PORT;
        
        $this->socket = @stream_socket_client($remote, $errno, $errstr, 2);
        
        if (!$this->socket) {
            error_log("Redis Socket connection failed: $errstr ($errno)");
            return;
        }

        if (REDIS_PASS) {
            $res = $this->executeRaw("AUTH " . REDIS_PASS);
            if (strpos($res, 'Error:') === 0) {
                error_log("Redis Socket Auth failed: " . $res);
                fclose($this->socket);
                $this->socket = null;
                return;
            }
        }
        $this->executeRaw("SELECT " . REDIS_DB);
    }

    public function executeRaw($command) {
        if ($this->isExtension) {
            $args = explode(' ', $command);
            $cmd = array_shift($args);
            try {
                return call_user_func_array([$this->redis, $cmd], $args);
            } catch (Exception $e) {
                return "Error: " . $e->getMessage();
            }
        }

        if (!$this->socket) return "Error: Not connected";

        fwrite($this->socket, $command . "\r\n");
        $response = fgets($this->socket);
        if (!$response) return null;

        $type = $response[0];
        $payload = substr($response, 1);

        switch ($type) {
            case '+': // Status reply
            case ':': // Integer reply
                return trim($payload);
            case '-': // Error reply
                return "Error: " . trim($payload);
            case '$': // Bulk string
                $len = (int)$payload;
                if ($len === -1) return null;
                $data = '';
                $read = 0;
                while ($read < $len) {
                    $chunk = fread($this->socket, min($len - $read, 8192));
                    if ($chunk === false) break;
                    $data .= $chunk;
                    $read += strlen($chunk);
                }
                fgets($this->socket); // Consume trailing \r\n
                return $data;
            case '*': // Multi-bulk
                $count = (int)$payload;
                if ($count === -1) return null;
                $results = [];
                for ($i = 0; $i < $count; $i++) {
                    // This is recursive but simplified for single-level arrays like KEYS
                    $line = fgets($this->socket);
                    if ($line[0] === '$') {
                        $l = (int)substr($line, 1);
                        $d = fread($this->socket, $l);
                        fgets($this->socket); // consume \r\n
                        $results[] = $d;
                    }
                }
                return $results;
            default:
                return trim($response);
        }
    }

    public function getInfo($section = '') {
        if ($this->isExtension) {
            return $this->redis->info($section ?: null);
        }

        $raw = $this->executeRaw("INFO " . $section);
        if (!$raw || is_array($raw) || strpos($raw, 'Error:') === 0) {
            if (strpos($raw, 'Error:') === 0) error_log("Redis INFO error: " . $raw);
            return [];
        }

        $info = [];
        $lines = explode("\r\n", $raw);
        foreach ($lines as $line) {
            if (empty($line) || $line[0] === '#') continue;
            $parts = explode(':', $line, 2);
            if (count($parts) === 2) {
                $info[$parts[0]] = $parts[1];
            }
        }
        return $info;
    }

    public function getKeys($pattern = '*') {
        if ($this->isExtension) {
            return $this->redis->keys($pattern);
        }
        $res = $this->executeRaw("KEYS " . $pattern);
        return is_array($res) ? $res : [];
    }

    public function getType($key) {
        if ($this->isExtension) {
            $types = [
                Redis::REDIS_NOT_FOUND => 'none',
                Redis::REDIS_STRING => 'string',
                Redis::REDIS_SET => 'set',
                Redis::REDIS_LIST => 'list',
                Redis::REDIS_ZSET => 'zset',
                Redis::REDIS_HASH => 'hash',
            ];
            return $types[$this->redis->type($key)] ?? 'unknown';
        }
        $type = $this->executeRaw("TYPE " . $key);
        return $type ?: 'unknown';
    }

    public function getTTL($key) {
        if ($this->isExtension) return $this->redis->ttl($key);
        $ttl = $this->executeRaw("TTL " . $key);
        return is_numeric($ttl) ? (int)$ttl : -1;
    }

    public function getValue($key) {
        $type = $this->getType($key);
        
        if ($this->isExtension) {
            switch ($type) {
                case 'string': return $this->redis->get($key);
                case 'hash':   return $this->redis->hGetAll($key);
                case 'list':   return $this->redis->lRange($key, 0, -1);
                case 'set':    return $this->redis->sMembers($key);
                case 'zset':   return $this->redis->zRange($key, 0, -1, true);
                default:       return null;
            }
        }

        // Socket Implementation
        switch ($type) {
            case 'string':
                return $this->executeRaw("GET " . $key);
            case 'hash':
                $raw = $this->executeRaw("HGETALL " . $key);
                if (!is_array($raw)) return [];
                $hash = [];
                for ($i = 0; $i < count($raw); $i += 2) {
                    if (isset($raw[$i+1])) $hash[$raw[$i]] = $raw[$i+1];
                }
                return $hash;
            case 'list':
                return $this->executeRaw("LRANGE $key 0 -1");
            case 'set':
                return $this->executeRaw("SMEMBERS " . $key);
            case 'zset':
                return $this->executeRaw("ZRANGE $key 0 -1 WITHSCORES");
            default:
                return null;
        }
    }

    public function del($key) {
        if ($this->isExtension) return $this->redis->del($key);
        $res = $this->executeRaw("DEL " . $key);
        return (int)$res > 0;
    }

    public function flushDB() {
        if ($this->isExtension) return $this->redis->flushDB();
        $res = $this->executeRaw("FLUSHDB");
        return $res === "OK" || strpos($res, "+OK") === 0;
    }

    public function set($key, $value, $ttl = null) {
        $serialized = is_array($value) || is_object($value) ? json_encode($value) : $value;
        if ($this->isExtension) {
            return $ttl ? $this->redis->setex($key, $ttl, $serialized) : $this->redis->set($key, $serialized);
        }
        
        $res = $this->executeRaw("SET " . $key . " \"" . addslashes($serialized) . "\"");
        if ($ttl) $this->expire($key, $ttl);
        return $res === "OK" || strpos($res, "+OK") === 0;
    }

    public function expire($key, $ttl) {
        if ($this->isExtension) return $this->redis->expire($key, $ttl);
        return $this->executeRaw("EXPIRE $key $ttl");
    }

    public function incr($key) {
        if ($this->isExtension) return $this->redis->incr($key);
        return (int)$this->executeRaw("INCR " . $key);
    }

    /**
     * Cache Helper: Ambil data dari Redis, jika tidak ada jalankan callback dan simpan hasilnya.
     */
    public function remember($key, $ttl, $callback) {
        $value = $this->getValue($key);
        if ($value !== null) {
            // Cek apakah data json
            $decoded = json_decode($value, true);
            return (json_last_error() == JSON_ERROR_NONE) ? $decoded : $value;
        }

        $freshData = $callback();
        $this->set($key, $freshData, $ttl);
        return $freshData;
    }

    public function isConnected() {
        if ($this->isExtension && $this->redis) {
            try {
                return $this->redis->ping() ? true : false;
            } catch (Exception $e) {
                return false;
            }
        }
        return $this->socket !== null;
    }
}

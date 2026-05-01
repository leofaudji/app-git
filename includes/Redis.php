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
        if (extension_loaded('redis')) {
            try {
                $this->redis = new Redis();
                $this->redis->connect(REDIS_HOST, REDIS_PORT);
                if (REDIS_PASS) {
                    $this->redis->auth(REDIS_PASS);
                }
                $this->redis->select(REDIS_DB);
                $this->isExtension = true;
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
        $address = REDIS_HOST . ':' . REDIS_PORT;
        $this->socket = @fsockopen(REDIS_HOST, REDIS_PORT, $errno, $errstr, 2);
        if (!$this->socket) {
            error_log("Redis Socket connection failed: $errstr ($errno)");
            return;
        }

        if (REDIS_PASS) {
            $this->executeRaw("AUTH " . REDIS_PASS);
        }
        $this->executeRaw("SELECT " . REDIS_DB);
    }

    public function executeRaw($command) {
        if ($this->isExtension) {
            // Simplified execution for extension
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
        return trim($response);
    }

    public function getInfo($section = 'default') {
        if ($this->isExtension) {
            return $this->redis->info($section);
        }

        $raw = $this->executeRaw("INFO " . $section);
        // Simple parsing for socket response (this is naive, usually INFO returns multi-bulk)
        return $raw; 
    }

    public function getKeys($pattern = '*') {
        if ($this->isExtension) {
            return $this->redis->keys($pattern);
        }
        // Minimal socket implementation for KEYS
        return ["Socket fallback: limited functionality"];
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
        return 'unknown';
    }

    public function getTTL($key) {
        if ($this->isExtension) return $this->redis->ttl($key);
        return -1;
    }

    public function getValue($key) {
        if ($this->isExtension) {
            $type = $this->getType($key);
            switch ($type) {
                case 'string': return $this->redis->get($key);
                case 'hash':   return $this->redis->hGetAll($key);
                case 'list':   return $this->redis->lRange($key, 0, -1);
                case 'set':    return $this->redis->sMembers($key);
                case 'zset':   return $this->redis->zRange($key, 0, -1, true);
                default:       return null;
            }
        }
        return null;
    }

    public function del($key) {
        if ($this->isExtension) return $this->redis->del($key);
        return false;
    }

    public function flushDB() {
        if ($this->isExtension) return $this->redis->flushDB();
        return false;
    }

    public function isConnected() {
        return $this->isExtension ? ($this->redis !== null) : ($this->socket !== null);
    }
}

<?php
/**
 * AuditLog helper class
 * Records user activities to the audit_logs table
 */
class AuditLog {
    public static function record(string $module, string $action, ?int $targetId = null, ?string $description = null): bool {
        try {
            require_once __DIR__ . '/db.php';
            
            $userId = null;
            if (isset($GLOBALS['CurrentUser'])) {
                $userId = $GLOBALS['CurrentUser']['id'];
            } elseif (isset($_SESSION['user_id'])) {
                $userId = $_SESSION['user_id'];
            }
            
            $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
            $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
            
            DB::execute(
                "INSERT INTO audit_logs (user_id, module, action, target_id, description, ip_address, user_agent) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)",
                [$userId, $module, $action, $targetId, $description, $ip, $ua]
            );
            
            return true;
        } catch (Exception $e) {
            // Silently fail to not block main operations
            error_log("[AuditLog Error] " . $e->getMessage());
            return false;
        }
    }
}

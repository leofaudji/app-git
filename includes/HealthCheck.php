<?php
/**
 * HealthCheck helper class
 * Performs HTTP pings and records metrics
 */
require_once __DIR__ . '/db.php';

class HealthCheck {
    
    /**
     * Check application health
     * @param int $projectId
     * @param string $url
     * @return array Result of the check
     */
    public static function check(int $projectId, string $url): array {
        if (empty($url)) {
            return ['success' => false, 'message' => 'URL is empty'];
        }

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_USERAGENT, 'GitDeploy HealthBot/1.0');

        $startTime = microtime(true);
        $response = curl_exec($ch);
        $endTime = microtime(true);
        
        $responseTime = round($endTime - $startTime, 4);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        $status = ($httpCode >= 200 && $httpCode < 400) ? 'up' : 'down';
        $errorMessage = $error ?: ($status === 'down' ? "HTTP Error: $httpCode" : null);

        // Record to DB
        DB::execute(
            "INSERT INTO project_health (project_id, status, response_code, response_time, error_message) 
             VALUES (?, ?, ?, ?, ?)",
            [$projectId, $status, $httpCode, $responseTime, $errorMessage]
        );

        return [
            'status' => $status,
            'code' => $httpCode,
            'time' => $responseTime,
            'error' => $errorMessage
        ];
    }

    /**
     * Get latest health status for all projects
     */
    public static function getAllLatest(): array {
        return DB::fetchAll("SELECT ph1.* 
            FROM project_health ph1
            INNER JOIN (
                SELECT project_id, MAX(checked_at) as last_check
                FROM project_health
                GROUP BY project_id
            ) ph2 ON ph1.project_id = ph2.project_id AND ph1.checked_at = ph2.last_check");
    }
}

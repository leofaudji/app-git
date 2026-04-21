<?php
// ============================================================
// Analytics API - Deployment Trends & Stability
// ============================================================
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

header('Content-Type: application/json');

$user = requireLogin();
$action = $_GET['action'] ?? 'summary';

switch ($action) {
    case 'summary':
        // 1. Deployment Stability (Last 30 Days)
        $stability = DB::fetchAll("
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
            FROM deploy_logs
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        ");

        // 2. Deploy Frequency (By Project - Last 7 Days)
        $frequency = DB::fetchAll("
            SELECT 
                p.name as project_name,
                COUNT(dl.id) as deploy_count
            FROM projects p
            LEFT JOIN deploy_logs dl ON dl.project_id = p.id AND dl.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY p.id
            ORDER BY deploy_count DESC
        ");

        // 3. User Activity (Top Deployers)
        $topUsers = DB::fetchAll("
            SELECT 
                u.full_name,
                COUNT(dl.id) as deploy_count
            FROM users u
            JOIN deploy_logs dl ON dl.user_id = u.id
            GROUP BY u.id
            ORDER BY deploy_count DESC
            LIMIT 5
        ");

        jsonSuccess([
            'stability' => $stability,
            'frequency' => $frequency,
            'top_users' => $topUsers,
            'period' => '30_days'
        ]);
        break;




    case 'contributions':
        $year = $_GET['year'] ?? 'last_year';
        $where = "created_at >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)";

        if ($year !== 'last_year' && is_numeric($year)) {
            $where = "YEAR(created_at) = " . (int) $year;
        }

        $contributions = DB::fetchAll("
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
            FROM deploy_logs
            WHERE $where
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        ");

        $result = [];
        foreach ($contributions as $c) {
            $result[$c['date']] = (int) $c['count'];
        }

        // Get available years for filtering
        $availableYears = DB::fetchAll("
            SELECT DISTINCT YEAR(created_at) as year 
            FROM deploy_logs 
            ORDER BY year DESC
        ");

        jsonSuccess([
            'contributions' => $result,
            'daily_total' => array_sum($result),
            'year' => $year,
            'available_years' => array_column($availableYears, 'year')
        ]);
        break;

    default:
        jsonError('Action tidak ditemukan', 404);
}

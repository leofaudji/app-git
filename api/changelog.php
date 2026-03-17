<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/csrf.php';

header('Content-Type: application/json');

$user = requireLogin();
$action = $_GET['action'] ?? 'list';

if ($action === 'list') {
    // Fetch global changelog (cross-project)
    $sql = "SELECT c.*, p.name as project_name, p.repo_name 
            FROM project_changelogs c
            JOIN projects p ON c.project_id = p.id
            ORDER BY c.created_at DESC 
            LIMIT 50";
    $logs = DB::fetchAll($sql);
    
    jsonSuccess($logs);
}

elseif ($action === 'system') {
    require_once __DIR__ . '/../includes/changelog_parser.php';
    $file = __DIR__ . '/../changelog.md';
    
    if (!file_exists($file)) {
        jsonError("System changelog file not found.");
    }

    $content = file_get_contents($file);
    
    // Parse all versions for the timeline
    // Pattern: ## [version] - date
    $pattern = '/##\s*\[([0-9a-zA-Z\.\-]+)\]\s*-\s*(\d{4}-\d{2}-\d{2})/i';
    preg_match_all($pattern, $content, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);
    
    $logs = [];
    foreach ($matches as $i => $match) {
        $version = $match[1][0];
        $date = $match[2][0];
        $start = $match[0][1] + strlen($match[0][0]);
        $end = isset($matches[$i+1]) ? $matches[$i+1][0][1] : strlen($content);
        
        $rawContent = substr($content, $start, $end - $start);
        
        // Split content into categories (Added, Fixed, Changed, etc.)
        $changes = [];
        if (preg_match_all('/###\s*(.*?)\n(.*?)(?=###|\n##|$)/s', $rawContent, $catMatches, PREG_SET_ORDER)) {
            foreach ($catMatches as $cm) {
                $category = trim($cm[1]);
                $items = array_filter(array_map('trim', explode("\n", $cm[2])), function($line) {
                    return strpos($line, '-') === 0 || strpos($line, '*') === 0;
                });
                if ($items) {
                    $changes[] = [
                        'category' => $category,
                        'items' => array_map(function($li) { return ltrim($li, '-* '); }, $items)
                    ];
                }
            }
        } else {
            // Fallback for simple list
            $items = array_filter(array_map('trim', explode("\n", $rawContent)), function($line) {
                return strpos($line, '-') === 0 || strpos($line, '*') === 0;
            });
            if ($items) {
                $changes[] = [
                    'category' => 'Changes',
                    'items' => array_map(function($li) { return ltrim($li, '-* '); }, $items)
                ];
            }
        }

        $logs[] = [
            'version' => $version,
            'date' => $date,
            'title' => "Release v$version",
            'changes_categorized' => $changes
        ];
    }
    
    jsonSuccess($logs);
}

elseif ($action === 'latest_version') {
    require_once __DIR__ . '/../includes/changelog_parser.php';
    $file = __DIR__ . '/../changelog.md';
    $parsed = ChangelogParser::parse($file);
    jsonSuccess(['version' => $parsed ? $parsed['version'] : '1.0.0']);
}

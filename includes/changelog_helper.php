<?php
/**
 * Helper to sync project changelogs from project files to database
 */
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/changelog_parser.php';

class ChangelogHelper {
    public static function syncProject(array $project, string $projectPath, ?int $userId = null) {
        $changelogFile = null;
        $possibleNames = ['changelog.md', 'CHANGELOG.md', 'Changelog.md'];
        
        foreach ($possibleNames as $name) {
            $path = rtrim($projectPath, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $name;
            if (file_exists($path)) {
                $changelogFile = $path;
                break;
            }
        }

        if (!$changelogFile) return false;

        $parsed = ChangelogParser::parse($changelogFile);
        if (!$parsed || empty($parsed['version'])) return false;

        $newVersion = $parsed['version'];
        $content = $parsed['content'];

        // 1. Update project current_version if different
        if ($newVersion !== $project['current_version']) {
            DB::execute("UPDATE projects SET current_version = ? WHERE id = ?", [$newVersion, $project['id']]);
        }

        // 2. Add to project_changelogs if this version doesn't exist for this project
        $exists = DB::fetchOne("SELECT id FROM project_changelogs WHERE project_id = ? AND version = ?", [$project['id'], $newVersion]);
        if (!$exists) {
            DB::execute(
                "INSERT INTO project_changelogs (project_id, version, changelog, user_id) VALUES (?, ?, ?, ?)",
                [$project['id'], $newVersion, $content, $userId]
            );
            return true;
        }

        return false;
    }
}

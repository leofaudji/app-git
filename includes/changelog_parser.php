<?php
/**
 * Utility to parse changelog.md files
 * Expects format: ## [version] - YYYY-MM-DD
 */
class ChangelogParser {
    public static function parse(string $filePath): ?array {
        if (!file_exists($filePath)) {
            return null;
        }

        $content = file_get_contents($filePath);
        if (!$content) {
            return null;
        }

        // Search for the first version header: ## [1.1.0] - 2024-03-20
        // Group 1: Version
        // Group 2: Full header line (to find end of section)
        $pattern = '/##\s*\[([0-9a-zA-Z\.\-]+)\]\s*-\s*\d{4}-\d{2}-\d{2}/i';
        
        if (preg_match($pattern, $content, $matches, PREG_OFFSET_CAPTURE)) {
            $version = $matches[1][0];
            $headerPos = $matches[0][1];
            
            // Find start of content (after header line)
            $contentStart = $headerPos + strlen($matches[0][0]);
            
            // Find end of section (next ## header or end of file)
            $nextHeaderPos = false;
            if (preg_match('/^##\s*\[/m', $content, $nextMatches, PREG_OFFSET_CAPTURE, $contentStart)) {
                $nextHeaderPos = $nextMatches[0][1];
            }
            
            $rawContent = $nextHeaderPos 
                ? substr($content, $contentStart, $nextHeaderPos - $contentStart)
                : substr($content, $contentStart);
                
            return [
                'version' => $version,
                'content' => trim($rawContent)
            ];
        }

        return null;
    }
}

<?php
// ============================================================
// Resources API - Disk Usage and Log Explorer
// ============================================================
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/csrf.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? 'disk';
$projectId = (int) ($_GET['project_id'] ?? $_POST['project_id'] ?? 0);

if ($projectId <= 0) jsonError('Project ID wajib diisi');

// Find project
$project = DB::fetchOne("SELECT * FROM projects WHERE id = ?", [$projectId]);
if (!$project) jsonError('Project tidak ditemukan', 404);

// Get absolute path
$baseDir    = DB::getSetting('git_base_dir', '');
$projFolder = $project['folder_name'];
$path = is_dir($projFolder) ? $projFolder : rtrim($baseDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $projFolder;

if (!is_dir($path)) jsonError('Project folder tidak ditemukan: ' . $path);

switch ($action) {
    case 'disk':
        requirePermission('projects', 'view');
        $size = getDirectorySize($path);
        
        jsonSuccess([
            'path' => $path,
            'size' => $size,
            'size_human' => formatBytes($size)
        ]);
        break;

    case 'logs_list':
        requirePermission('projects', 'view');
        $logFiles = findLogFiles($path);
        jsonSuccess($logFiles);
        break;

    case 'logs_read':
        requirePermission('projects', 'view');
        $filename = $_GET['file'] ?? '';
        if (!$filename) jsonError('Nama file log wajib diisi');
        
        // Security: Ensure path is within project directory
        $filePath = realpath($path . DIRECTORY_SEPARATOR . $filename);
        if (!$filePath || strpos($filePath, realpath($path)) !== 0) {
            jsonError('Akses log ditolak atau file tidak ditemukan');
        }

        if (!is_file($filePath)) jsonError('File log tidak ditemukan');
        
        $limit = (int)($_GET['limit'] ?? 500); // Lines from end
        $logs = readLastLines($filePath, $limit);
        
        jsonSuccess([
            'file' => $filename,
            'content' => $logs,
            'size' => filesize($filePath),
            'size_human' => formatBytes(filesize($filePath))
        ]);
        break;

    default:
        jsonError('Action tidak ditemukan', 404);
}

// ─── Helpers ───

function getDirectorySize($path) {
    $size = 0;
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path, RecursiveDirectoryIterator::SKIP_DOTS)) as $file) {
        $size += $file->getSize();
    }
    return $size;
}

function formatBytes($bytes, $precision = 2) {
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    $bytes /= pow(1024, $pow);
    return round($bytes, $precision) . ' ' . $units[$pow];
}

function findLogFiles($path) {
    $found = [];
    $iter = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($path, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );
    $iter->setMaxDepth(3); // Limit depth for performance

    $logExtensions = ['log', 'txt', 'bak'];
    $logFolders = ['storage/logs', 'logs', 'var/log', 'temp', 'tmp'];

    foreach ($iter as $file) {
        if ($file->isFile()) {
            $ext = strtolower($file->getExtension());
            $relPath = str_replace(realpath($path) . DIRECTORY_SEPARATOR, '', $file->getRealPath());
            
            // Check extension or known log paths
            $isLog = in_array($ext, $logExtensions);
            if (!$isLog) {
                foreach ($logFolders as $f) {
                    if (strpos($relPath, $f) !== false) {
                        $isLog = true;
                        break;
                    }
                }
            }

            if ($isLog && $file->getSize() > 0) {
                $found[] = [
                    'name' => $relPath,
                    'size' => $file->getSize(),
                    'size_human' => formatBytes($file->getSize()),
                    'mtime' => date('Y-m-d H:i:s', $file->getMTime())
                ];
            }
        }
    }
    
    // Sort by mtime dec
    usort($found, fn($a, $b) => strcmp($b['mtime'], $a['mtime']));
    return $found;
}

function readLastLines($file, $lines) {
    $handle = fopen($file, "r");
    if (!$handle) return "";

    $linecount = 0;
    $pos = -2;
    $beginning = false;
    $toret = "";

    while ($linecount < $lines) {
        if (fseek($handle, $pos, SEEK_END) == -1) {
            $beginning = true;
            break;
        }
        $tpc = fgetc($handle);
        if ($tpc == "\n") {
            $linecount++;
        }
        $pos--;
    }

    if ($beginning) {
        rewind($handle);
    }

    while (!feof($handle)) {
        $toret .= fgets($handle);
    }

    fclose($handle);
    return $toret;
}

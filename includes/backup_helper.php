<?php
/**
 * Backup Helper - Core logic for generating SQL dumps and project backups
 * This file contains no authentication checks and can be used by Cron scripts.
 */

// ─── Helper: Parse .env file ──────────────────────────────
if (!function_exists('parseEnvFile')) {
    function parseEnvFile(string $path): array {
        $env = [];
        if (!file_exists($path)) return $env;
        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $trimmed = trim($line);
            if ($trimmed === '' || strpos($trimmed, '#') === 0) continue;
            if (strpos($line, '=') !== false) {
                [$key, $val] = explode('=', $line, 2);
                $key = trim($key);
                $val = trim($val);
                if (preg_match('/^"([^"]*)"/', $val, $m) || preg_match("/^'([^']*)'/", $val, $m)) {
                    $val = $m[1];
                } else {
                    $val = trim(preg_replace('/#.*$/', '', $val)); // Strip inline comments
                }
                $env[$key] = $val;
            }
        }
        return $env;
    }
}

// ─── Helper: generate SQL dump (Dynamic) ──────────────────
if (!function_exists('generateSqlDump')) {
    function generateSqlDump(?PDO $targetPdo = null, string $dbName = ''): string {
        $pdo = $targetPdo ?? DB::getInstance();
        $name = $dbName ?: 'Main Database';

        $output  = "-- Database Backup\n";
        $output .= "-- Generated: " . date('Y-m-d H:i:s') . "\n";
        $output .= "-- DB: " . $name . "\n";
        $output .= "-- --------------------------------------------------------\n\n";
        $output .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

        try {
            $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
        } catch (Exception $e) {
            return "-- Error fetching tables: " . $e->getMessage() . "\n";
        }

        foreach ($tables as $table) {
            try {
                $output .= "-- Table: `$table`\n";
                $output .= "DROP TABLE IF EXISTS `$table`;\n";

                $res = $pdo->query("SHOW CREATE TABLE `$table`")->fetch(PDO::FETCH_NUM);
                $output .= $res[1] . ";\n\n";

                $stmt = $pdo->query("SELECT * FROM `$table`");
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                if (!empty($rows)) {
                    $output .= "INSERT INTO `$table` VALUES \n";
                    $valStrings = [];
                    foreach ($rows as $row) {
                        $vals = array_map(function($v) use ($pdo) {
                            return $v === null ? 'NULL' : $pdo->quote($v);
                        }, array_values($row));
                        $valStrings[] = "(" . implode(", ", $vals) . ")";
                    }
                    $output .= implode(",\n", $valStrings) . ";\n\n";
                }
            } catch (Exception $e) {
                $output .= "-- Skipped table `$table`: " . $e->getMessage() . "\n\n";
            }
        }

        $output .= "SET FOREIGN_KEY_CHECKS=1;\n";
        return $output;
    }
}

// ─── Helper: Perform backup for a single project ──────────
if (!function_exists('performProjectBackup')) {
    function performProjectBackup(int $id, string $projectBackupBase): array {
        $project = DB::fetchOne("SELECT * FROM projects WHERE id = ?", [$id]);
        if (!$project) throw new Exception('Project tidak ditemukan');

        $gitBase = DB::getSetting('git_base_dir', '');
        $projPath = rtrim($gitBase, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $project['folder_name'];
        $envPath = $projPath . DIRECTORY_SEPARATOR . '.env';

        if (!file_exists($envPath)) throw new Exception('File .env project tidak ditemukan di ' . $projPath);

        $env = parseEnvFile($envPath);
        $dbHost = $env['DB_HOST'] ?? '127.0.0.1';
        $dbName = $env['DB_DATABASE'] ?? $env['DB_NAME'] ?? '';
        $dbUser = $env['DB_USERNAME'] ?? $env['DB_USER'] ?? '';
        $dbPass = $env['DB_PASSWORD'] ?? $env['DB_PASS'] ?? '';
        $dbPort = $env['DB_PORT'] ?? '3306';

        if (!$dbName) throw new Exception('Nama database tidak ditemukan dalam .env project');

        $dsn = "mysql:host=$dbHost;port=$dbPort;dbname=$dbName;charset=utf8mb4";
        $projPdo = new PDO($dsn, $dbUser, $dbPass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        
        $sql = generateSqlDump($projPdo, $dbName);
        
        $projDir = $projectBackupBase . DIRECTORY_SEPARATOR . $project['folder_name'];
        if (!is_dir($projDir)) mkdir($projDir, 0755, true);
        
        $filename = $project['folder_name'] . '_backup_' . date('Ymd_His') . '.sql';
        $filepath = $projDir . DIRECTORY_SEPARATOR . $filename;
        
        if (file_put_contents($filepath, $sql) === false) throw new Exception('Gagal menulis file backup ke disk');
        
        $size = filesize($filepath);
        $size_fmt = $size > 1048576 ? round($size/1048576, 2).' MB' : round($size/1024, 1).' KB';
        return ['filename' => $filename, 'project_name' => $project['name'], 'size_fmt' => $size_fmt, 'filepath' => $filepath, 'size_bytes' => $size];
    }
}

// ─── Helper: Perform the entire Backup Chain (Projects + System + Email) ──
if (!function_exists('performFullBackupChain')) {
    function performFullBackupChain(): array {
        $results = [];
        $errors = [];
        $currentDate = date('Y-m-d');
        $projectBackupBase = DB::getSetting('backup_base_dir', BASE_PATH . '/../backups_projects');

        // 1. Project Backups
        $projects = DB::fetchAll("SELECT id, name FROM projects WHERE is_active = 1");
        foreach ($projects as $p) {
            try {
                $results[] = performProjectBackup($p['id'], $projectBackupBase);
            } catch (Exception $e) {
                $errors[] = "[{$p['name']}] " . $e->getMessage();
            }
        }

        // 2. System Backup
        try {
            $backupDir = BASE_PATH . '/backups';
            if (!is_dir($backupDir)) mkdir($backupDir, 0755, true);
            $sysFile = 'gitdeploy_auto_backup_' . date('Ymd_His') . '.sql';
            $sysPath = $backupDir . '/' . $sysFile;
            file_put_contents($sysPath, generateSqlDump());
            $size = filesize($sysPath);
            $size_fmt = $size > 1048576 ? round($size/1048576, 2).' MB' : round($size/1024, 1).' KB';
            $results[] = [
                'filename'     => $sysFile, 
                'project_name' => 'System', 
                'size_fmt'     => $size_fmt,
                'filepath'     => $sysPath,
                'size_bytes'   => $size
            ];
        } catch (Exception $e) {
            $errors[] = "[System] " . $e->getMessage();
        }

        // 3. Update Last Run
        DB::execute("UPDATE settings SET `value` = ? WHERE `key` = 'backup_last_run'", [$currentDate]);

        // 4. Send Email Notification
        $notified = false;
        if (DB::getSetting('backup_notify_enable') === '1') {
            require_once __DIR__ . '/mailer.php';
            $notifyEmail = DB::getSetting('notify_email');
            if ($notifyEmail) {
                $smtpConfig = [
                    'host'       => DB::getSetting('smtp_host'),
                    'port'       => DB::getSetting('smtp_port'),
                    'user'       => DB::getSetting('smtp_user'),
                    'pass'       => DB::getSetting('smtp_pass'),
                    'encryption' => DB::getSetting('smtp_encryption'),
                    'from_name'  => APP_NAME . ' Backup'
                ];
                $mailer = new Mailer($smtpConfig);
                $successCount = count($results);
                $errorCount = count($errors);

                // Attachments logic (Limit 20MB)
                $totalBytes = 0;
                $limit = 20 * 1024 * 1024;
                $isAttached = false;
                foreach ($results as $res) {
                    if (isset($res['filepath']) && file_exists($res['filepath'])) {
                        $totalBytes += ($res['size_bytes'] ?? 0);
                    }
                }

                if ($totalBytes > 0 && $totalBytes <= $limit) {
                    foreach ($results as $res) {
                        if (isset($res['filepath']) && file_exists($res['filepath'])) {
                            $mailer->addAttachment($res['filepath']);
                        }
                    }
                    $isAttached = true;
                }

                $statusColor = ($errorCount === 0) ? '#16a34a' : '#dc2626';
                $statusLabel = ($errorCount === 0) ? 'SUCCESS' : 'WARNING';
                $statusIcon = ($errorCount === 0) ? '✅' : '⚠️';
                $subject = "$statusIcon Backup Report: " . date('Y-m-d H:i');
                
                // CID Embedding for maximum compatibility
                $faviconPath = __DIR__ . '/../assets/favicon.png';
                $mailer->addInlineImage($faviconPath, 'logo');
                
                // Modern HTML Email Template
                $body = "
                <div style='font-family: \"Inter\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; padding: 40px 20px; color: #1f2937;'>
                    <div style='max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border-top: 6px solid " . ($errorCount === 0 ? '#f6821f' : '#dc2626') . ";'>
                        
                        <!-- Header -->
                        <div style='padding: 30px; text-align: center; background: #f9fafb; border-bottom: 1px solid #e5e7eb;'>
                            <div style='display: block; margin-bottom: 15px;'>
                                <img src='cid:logo' alt='Logo' style='width: 40px; height: 40px; vertical-align: middle;'>
                                <span style='font-size: 22px; font-weight: 700; color: #111827; margin-left: 10px; vertical-align: middle;'>CRUDWorks GitDeploy</span>
                            </div>
                            <div style='font-size: 14px; color: #6b7280; font-weight: 500;'>Database Backup Report</div>
                        </div>

                        <!-- Status Bar -->
                        <div style='padding: 20px 30px; background: " . ($errorCount === 0 ? '#f0fdf4' : '#fef2f2') . "; border-bottom: 1px solid #e5e7eb; text-align: center;'>
                            <span style='display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: 800; letter-spacing: 0.05em; background: $statusColor; color: white;'>$statusLabel</span>
                            <div style='margin-top: 10px; font-size: 18px; font-weight: 700; color: #111827;'>
                                " . ($errorCount === 0 ? "Semua Project Berhasil Dicadangkan" : "Backup Selesai dengan $errorCount Kendala") . "
                            </div>
                            " . ($isAttached ? "<div style='font-size: 11px; color: #16a34a; margin-top: 5px; font-weight: 600;'>📎 File backup telah dilampirkan dalam email ini.</div>" : "") . "
                        </div>

                        <!-- Content -->
                        <div style='padding: 30px;'>
                            <p style='font-size: 14px; color: #4b5563; margin-bottom: 25px;'>Halo Admin, proses pencadangan database rutin telah selesai dijalankan pada <strong>" . date('d F Y, H:i') . "</strong>. Berikut adalah rinciannya:</p>
                            
                            <!-- Success List -->
                            <div style='margin-bottom: 30px;'>
                                <h3 style='font-size: 12px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 15px; border-bottom: 1px solid #f3f4f6; padding-bottom: 5px;'>✅ Berhasil Dicadangkan ($successCount)</h3>
                                <table style='width: 100%; border-collapse: collapse;'>
                ";

                foreach ($results as $res) {
                    $body .= "
                                    <tr>
                                        <td style='padding: 10px 0; border-bottom: 1px solid #f9fafb;'>
                                            <div style='font-size: 14px; font-weight: 600; color: #111827;'>{$res['project_name']}</div>
                                            <div style='font-size: 11px; color: #9ca3af; font-family: monospace;'>{$res['filename']}</div>
                                        </td>
                                        <td style='padding: 10px 0; text-align: right; border-bottom: 1px solid #f9fafb;'>
                                            <div style='color: #16a34a; font-size: 12px; font-weight: 600;'>OK</div>
                                            <div style='font-size: 10px; color: #9ca3af;'>{$res['size_fmt']}</div>
                                        </td>
                                    </tr>";
                }

                $body .= "
                                </table>
                            </div>
                ";

                if ($errorCount > 0) {
                    $body .= "
                            <!-- Error List -->
                            <div style='margin-bottom: 30px;'>
                                <h3 style='font-size: 12px; font-weight: 800; color: #f87171; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 15px; border-bottom: 1px solid #fee2e2; padding-bottom: 5px;'>⚠️ Kendala Terdeteksi ($errorCount)</h3>
                                <div style='background: #fff1f2; border-radius: 8px; padding: 15px; border: 1px solid #fecaca;'>
                                    <ul style='margin: 0; padding-left: 20px; font-size: 13px; color: #991b1b; line-height: 1.6;'>
                    ";
                    foreach ($errors as $err) {
                        $body .= "<li>$err</li>";
                    }
                    $body .= "
                                    </ul>
                                </div>
                            </div>
                    ";
                }

                $body .= "
                            <div style='text-align: center; margin-top: 40px;'>
                                <a href='" . APP_URL . "/' style='display: inline-block; background: #f6821f; color: white; padding: 12px 25px; border-radius: 8px; font-weight: 700; font-size: 14px; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(246, 130, 31, 0.4);'>Lihat Manager Backup</a>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div style='padding: 25px 30px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;'>
                            <p style='font-size: 11px; color: #9ca3af; margin: 0;'>Pesan ini dikirim secara otomatis oleh sistem <strong>" . APP_NAME . "</strong>.</p>
                            <p style='font-size: 10px; color: #d1d5db; margin-top: 5px;'>&copy; " . date('Y') . " CRUDWorks Platform • Host: " . $_SERVER['HTTP_HOST'] . "</p>
                        </div>
                    </div>
                    <div style='text-align: center; margin-top: 20px; font-size: 10px; color: #9ca3af;'>
                        Gunakan App Password untuk keamanan SMTP maksimal.
                    </div>
                </div>
                ";
                
                $notified = $mailer->send($notifyEmail, $subject, $body);
            }
        }

        return [
            'success'   => true,
            'results'   => $results,
            'errors'    => $errors,
            'notified'  => $notified,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
}

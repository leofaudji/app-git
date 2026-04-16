<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/csrf.php';

header('Content-Type: application/json');

requirePermission('settings', 'view');
$action = $_GET['action'] ?? $_POST['action'] ?? 'get';

switch ($action) {

    case 'get':
        $settings = DB::fetchAll("SELECT `key`, `value`, `label`, `type` FROM settings ORDER BY `key`");
        // Mask password fields
        foreach ($settings as &$s) {
            if ($s['type'] === 'password' || $s['key'] === 'webhook_secret_default' || $s['key'] === 'smtp_pass') {
                $s['value'] = ''; // Don't leak
            }
        }
        jsonSuccess($settings);

    case 'save':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
        requirePermission('settings', 'edit');
        requireCsrf();

        $data = $_POST['settings'] ?? [];
        if (!is_array($data)) jsonError('Format data tidak valid');

        // Metadata for auto-creation if keys are missing
        $meta = [
            'smtp_host'            => ['label' => 'SMTP Host', 'type' => 'text', 'default' => 'smtp.gmail.com'],
            'smtp_port'            => ['label' => 'SMTP Port', 'type' => 'text', 'default' => '587'],
            'smtp_user'            => ['label' => 'SMTP Username', 'type' => 'text', 'default' => ''],
            'smtp_pass'            => ['label' => 'SMTP Password', 'type' => 'password', 'default' => ''],
            'smtp_encryption'      => ['label' => 'SMTP Encryption', 'type' => 'text', 'default' => 'tls'],
            'backup_notify_enable' => ['label' => 'Backup Email Notification', 'type' => 'boolean', 'default' => '0'],
            'notify_email'         => ['label' => 'Notification Email', 'type' => 'text', 'default' => ''],
            'backup_cron_secret'   => ['label' => 'Cron Secret Token', 'type' => 'password', 'default' => bin2hex(random_bytes(16))],
        ];

        $allowed = [
            'app_name', 'git_base_dir', 'webhook_secret_default', 'notify_email', 'auto_deploy',
            'backup_base_dir', 'backup_auto_enable', 'backup_schedule_time', 'backup_schedule_days', 'backup_cron_secret',
            'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_encryption', 'backup_notify_enable'
        ];

        foreach ($data as $key => $value) {
            if (!in_array($key, $allowed)) continue;
            
            // Password protection logic
            if (($key === 'webhook_secret_default' || $key === 'smtp_pass') && empty($value)) continue;

            // Ensure key exists (Auto-Migration on Save)
            $exists = DB::fetchOne("SELECT `key` FROM settings WHERE `key` = ?", [$key]);
            if (!$exists && isset($meta[$key])) {
                DB::execute(
                    "INSERT INTO settings (`key`, `label`, `type`, `value`) VALUES (?, ?, ?, ?)",
                    [$key, $meta[$key]['label'], $meta[$key]['type'], $meta[$key]['default']]
                );
            }

            DB::execute(
                "UPDATE settings SET `value` = ? WHERE `key` = ?",
                [trim($value), $key]
            );
        }

        jsonSuccess(null, 'Settings berhasil disimpan');

    case 'get_raw':
        // For internal use (webhook.php)
        requirePermission('settings', 'edit');
        $key = $_GET['key'] ?? '';
        if (!$key) jsonError('Key tidak ada');
        $val = DB::getSetting($key);
        jsonSuccess(['key' => $key, 'value' => $val]);

    case 'test_email':
        requirePermission('settings', 'edit');
        require_once __DIR__ . '/../includes/mailer.php';
        
        $notifyEmail = DB::getSetting('notify_email');
        if (!$notifyEmail) jsonError('Notification Email belum diisi di Global Configuration');

        $smtpConfig = [
            'host'       => $_POST['smtp_host'] ?? DB::getSetting('smtp_host'),
            'port'       => $_POST['smtp_port'] ?? DB::getSetting('smtp_port'),
            'user'       => $_POST['smtp_user'] ?? DB::getSetting('smtp_user'),
            'pass'       => !empty($_POST['smtp_pass']) ? $_POST['smtp_pass'] : DB::getSetting('smtp_pass'),
            'encryption' => $_POST['smtp_encryption'] ?? DB::getSetting('smtp_encryption'),
        ];

        if (empty($smtpConfig['host']) || empty($smtpConfig['user'])) {
            jsonError('SMTP Host dan Username harus diisi untuk pengujian.');
        }

        $mailer = new Mailer($smtpConfig);
        $subject = "🧪 GitDeploy: Test Email";
        $body = "<h2>Konfigurasi SMTP Berhasil!</h2><p>Email ini dikirim untuk memverifikasi bahwa pengaturan SMTP Anda di GitDeploy sudah benar.</p><p>Waktu: " . date('Y-m-d H:i:s') . "</p>";
        
        if ($mailer->send($notifyEmail, $subject, $body)) {
            jsonSuccess(null, 'Email uji berhasil dikirim ke ' . $notifyEmail);
        } else {
            jsonError('Gagal mengirim email. Silakan cek error log server untuk detailnya.');
        }

    default:
        jsonError('Action tidak ditemukan', 404);
}

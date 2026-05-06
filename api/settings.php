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
            if ($s['type'] === 'password' || in_array($s['key'], ['webhook_secret_default', 'smtp_pass', 'r2_secret_key'])) {
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
            'backup_auto_enable'   => ['label' => 'Auto Backup Enable', 'type' => 'boolean', 'default' => '0'],
            'backup_schedule_time' => ['label' => 'Backup Schedule Time', 'type' => 'text', 'default' => '02:00'],
            'backup_schedule_days' => ['label' => 'Backup Schedule Days', 'type' => 'text', 'default' => 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
            'r2_enable'            => ['label' => 'R2 Storage Enable', 'type' => 'boolean', 'default' => '0'],
            'r2_account_id'        => ['label' => 'R2 Account ID', 'type' => 'text', 'default' => ''],
            'r2_access_key'        => ['label' => 'R2 Access Key', 'type' => 'text', 'default' => ''],
            'r2_secret_key'        => ['label' => 'R2 Secret Key', 'type' => 'password', 'default' => ''],
            'r2_bucket_name'       => ['label' => 'R2 Bucket Name', 'type' => 'text', 'default' => ''],
            'r2_retention_days'    => ['label' => 'R2 Retention Days', 'type' => 'number', 'default' => '30'],
        ];

        $allowed = [
            'app_name', 'git_base_dir', 'webhook_secret_default', 'notify_email', 'auto_deploy',
            'backup_base_dir', 'backup_auto_enable', 'backup_schedule_time', 'backup_schedule_days', 'backup_cron_secret',
            'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_encryption', 'backup_notify_enable',
            'r2_enable', 'r2_account_id', 'r2_access_key', 'r2_secret_key', 'r2_bucket_name', 'r2_retention_days'
        ];

        foreach ($data as $key => $value) {
            if (!in_array($key, $allowed)) continue;
            
            // Password protection logic
            if (in_array($key, ['webhook_secret_default', 'smtp_pass', 'r2_secret_key']) && empty($value)) continue;

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

    case 'test_r2':
        requirePermission('settings', 'edit');
        require_once __DIR__ . '/../includes/R2Client.php';

        $accountId  = $_POST['r2_account_id'] ?? DB::getSetting('r2_account_id');
        $accessKey  = $_POST['r2_access_key'] ?? DB::getSetting('r2_access_key');
        $secretKey  = !empty($_POST['r2_secret_key']) ? $_POST['r2_secret_key'] : DB::getSetting('r2_secret_key');
        $bucketName = $_POST['r2_bucket_name'] ?? DB::getSetting('r2_bucket_name');

        if (empty($accountId) || empty($accessKey) || empty($secretKey) || empty($bucketName)) {
            jsonError('Semua parameter R2 (Account ID, Access Key, Secret Key, Bucket) wajib diisi untuk pengujian.');
        }

        $r2 = new R2Client($accountId, $accessKey, $secretKey, $bucketName);
        if ($r2->testConnection()) {
            jsonSuccess(null, 'Koneksi Cloudflare R2 berhasil! Bucket dapat diakses.');
        } else {
            jsonError('Gagal terhubung ke Cloudflare R2. Pastikan Account ID dan Credentials Anda benar, serta bucket sudah dibuat.');
        }

    case 'list_r2_backups':
        requirePermission('settings', 'view');
        require_once __DIR__ . '/../includes/R2Client.php';
        
        $accountId  = DB::getSetting('r2_account_id');
        $accessKey  = DB::getSetting('r2_access_key');
        $secretKey  = DB::getSetting('r2_secret_key');
        $bucketName = DB::getSetting('r2_bucket_name');

        if (empty($accountId) || empty($accessKey) || empty($secretKey) || empty($bucketName)) {
            jsonError('Konfigurasi R2 belum lengkap.');
        }

        $r2 = new R2Client($accountId, $accessKey, $secretKey, $bucketName);
        $files = $r2->listObjects();
        jsonSuccess($files);

    case 'delete_r2_backup':
        requirePermission('settings', 'edit');
        require_once __DIR__ . '/../includes/R2Client.php';

        $key = $_POST['key'] ?? '';
        if (empty($key)) jsonError('Key file tidak valid.');

        $accountId  = DB::getSetting('r2_account_id');
        $accessKey  = DB::getSetting('r2_access_key');
        $secretKey  = DB::getSetting('r2_secret_key');
        $bucketName = DB::getSetting('r2_bucket_name');

        $r2 = new R2Client($accountId, $accessKey, $secretKey, $bucketName);
        if ($r2->deleteObject($key)) {
            jsonSuccess(null, 'File berhasil dihapus dari Cloud Storage.');
        } else {
            jsonError('Gagal menghapus file dari Cloud Storage.');
        }

    case 'download_r2_backup':
        requirePermission('settings', 'view');
        require_once __DIR__ . '/../includes/R2Client.php';

        $key = $_GET['key'] ?? '';
        if (empty($key)) jsonError('Key file tidak boleh kosong.');

        $r2 = new R2Client(
            DB::getSetting('r2_account_id'),
            DB::getSetting('r2_access_key'),
            DB::getSetting('r2_secret_key'),
            DB::getSetting('r2_bucket_name')
        );

        $content = $r2->downloadObject($key);
        if ($content === false) {
            header('HTTP/1.1 404 Not Found');
            die('File tidak ditemukan di cloud storage.');
        }

        // Set headers for download
        header('Content-Description: File Transfer');
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="' . basename($key) . '"');
        header('Expires: 0');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');
        header('Content-Length: ' . strlen($content));
        
        echo $content;
        exit;

    case 'get_storage_stats':
        requirePermission('settings', 'view');
        $stats = DB::fetchAll("SELECT stat_value as size, DATE(created_at) as date 
                               FROM system_stats 
                               WHERE stat_key = 'r2_storage_bytes' 
                               ORDER BY created_at ASC 
                               LIMIT 30");
        jsonSuccess($stats);
        break;


    default:
        jsonError('Action tidak ditemukan', 404);
}
?>

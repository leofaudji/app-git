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
            if ($s['type'] === 'password' || $s['key'] === 'webhook_secret_default') $s['value'] = ''; // Don't leak
        }
        jsonSuccess($settings);

    case 'save':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);
        requirePermission('settings', 'edit');
        requireCsrf();

        $data = $_POST['settings'] ?? [];
        if (!is_array($data)) jsonError('Format data tidak valid');

        // Allowed keys
        $allowed = ['app_name','git_base_dir','webhook_secret_default','notify_email','auto_deploy'];

        foreach ($data as $key => $value) {
            if (!in_array($key, $allowed)) continue;
            // For password fields, only update if a value is provided
            if ($key === 'webhook_secret_default' && empty($value)) continue;
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

    default:
        jsonError('Action tidak ditemukan', 404);
}

<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';

$repo = $_GET['repo'] ?? 'leofaudji/smkn5-toko';
$project = DB::fetchOne("SELECT * FROM projects WHERE (repo_name = ? OR folder_name = ?) AND is_active = 1", [$repo, $repo]);

$url = APP_URL;
if (strpos($url, 'localhost') !== false && strpos($url, '/app-git') === false) {
    $url .= '/app-git'; // Manual fix for CLI environment
}
$url .= "/api/webhook.php";
$url = str_replace('localhostapi', 'localhost/app-git', $url); // Fix specifically for the 'localhostapi' bug

$secret = ($project && $project['webhook_secret']) ? $project['webhook_secret'] : DB::getSetting('webhook_secret_default', '');

$payload = json_encode([
    'ref' => 'refs/heads/' . ($project['branch'] ?? 'main'),
    'repository' => [
        'full_name' => $repo,
        'name' => basename($repo)
    ],
    'pusher' => ['name' => 'tester']
]);

$signature = "sha256=" . hash_hmac('sha256', $payload, $secret);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "X-Hub-Signature-256: $signature"
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true); // Include headers in output

$response = curl_exec($ch);
$info = curl_getinfo($ch);
curl_close($ch);

header('Content-Type: text/plain');
echo "Simulating Webhook POST to $url\n";
echo "HTTP Status: " . $info['http_code'] . "\n\n";
echo "Response:\n";
echo $response;

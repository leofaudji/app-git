<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';

$url = "http://localhost/app-git/api/webhook";
$secret = DB::getSetting('webhook_secret', 'change_me_secret_key');
$payload = json_encode([
    'ref' => 'refs/heads/' . DB::getSetting('git_branch', 'main'),
    'repository' => ['name' => 'test-repo'],
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

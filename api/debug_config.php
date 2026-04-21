<?php
echo json_encode([
    'error_log' => ini_get('error_log'),
    'os' => PHP_OS,
    'sapi' => PHP_SAPI,
    'doc_root' => $_SERVER['DOCUMENT_ROOT'] ?? __DIR__
]);

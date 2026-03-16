<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

// CSRF token generation and validation utilities
// Can be included by other endpoints

function generateCsrfToken(): string {
    if (empty($_SESSION[CSRF_SESSION_KEY])) {
        $_SESSION[CSRF_SESSION_KEY] = bin2hex(random_bytes(CSRF_TOKEN_LENGTH));
    }
    return $_SESSION[CSRF_SESSION_KEY];
}

function validateCsrfToken(): bool {
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] 
           ?? $_POST['_csrf_token'] 
           ?? '';
    return hash_equals($_SESSION[CSRF_SESSION_KEY] ?? '', $token);
}

function requireCsrf(): void {
    if (!validateCsrfToken()) {
        jsonError('Invalid CSRF token', 403);
    }
}

function regenerateCsrfToken(): string {
    $_SESSION[CSRF_SESSION_KEY] = bin2hex(random_bytes(CSRF_TOKEN_LENGTH));
    return $_SESSION[CSRF_SESSION_KEY];
}

// GET /api/csrf.php → return token
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    jsonSuccess(['token' => generateCsrfToken()]);
}

jsonError('Method not allowed', 405);

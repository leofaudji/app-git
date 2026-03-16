<?php
// Shared CSRF helpers (included by other API files, not standalone)
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
    if (empty($_SESSION[CSRF_SESSION_KEY])) return false;
    return hash_equals($_SESSION[CSRF_SESSION_KEY], $token);
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

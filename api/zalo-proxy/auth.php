<?php
// OAuth Initiation Handler for toolbox.vn/api/zalo-proxy/auth
require_once '../../config.php';
setCorsHeaders();

// Get parameters from Replit app
$redirect_uri = $_GET['redirect_uri'] ?? '';
$app_domain = $_GET['app_domain'] ?? '';

// Validate required parameters
if (empty($redirect_uri) || empty($app_domain)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required parameters: redirect_uri and app_domain']);
    exit();
}

// Generate PKCE parameters for security
$codeVerifier = base64url_encode(random_bytes(32));
$codeChallenge = base64url_encode(hash('sha256', $codeVerifier, true));

// Start session and store data for callback
session_start();
$_SESSION['code_verifier'] = $codeVerifier;
$_SESSION['app_domain'] = $app_domain;
$_SESSION['original_redirect_uri'] = $redirect_uri;

// Generate random state for CSRF protection
$state = bin2hex(random_bytes(16));
$_SESSION['oauth_state'] = $state;

// Build Zalo OAuth authorization URL
$authUrl = 'https://oauth.zaloapp.com/v4/permission?' . http_build_query([
    'app_id' => ZALO_APP_ID,
    'redirect_uri' => ZALO_REDIRECT_URI,
    'code_challenge' => $codeChallenge,
    'state' => $state
]);

// Log the redirect for debugging
error_log("Zalo Proxy Auth: Redirecting to " . $authUrl);
error_log("App Domain: " . $app_domain);
error_log("Redirect URI: " . $redirect_uri);

// Redirect to Zalo OAuth
header('Location: ' . $authUrl);
exit();
?>
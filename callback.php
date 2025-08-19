<?php
// OAuth Callback Handler for toolbox.vn/api/auth/zalo/callback
require_once 'config.php';
setCorsHeaders();

// Start session to retrieve stored data
session_start();

// Get OAuth callback parameters
$code = $_GET['code'] ?? '';
$state = $_GET['state'] ?? '';
$error = $_GET['error'] ?? '';

// Handle OAuth error
if ($error) {
    $appDomain = $_SESSION['app_domain'] ?? 'https://11a56b9f-4269-48a7-b12d-cde3c89de60d-00-28s4cntgjrwsd.riker.replit.dev';
    $errorUrl = $appDomain . '/auth?zalo_error=' . urlencode($error);
    header('Location: ' . $errorUrl);
    exit();
}

// Validate required parameters
if (empty($code)) {
    http_response_code(400);
    echo json_encode(['error' => 'Authorization code not provided']);
    exit();
}

// Retrieve session data
$codeVerifier = $_SESSION['code_verifier'] ?? '';
$appDomain = $_SESSION['app_domain'] ?? '';

if (empty($codeVerifier) || empty($appDomain)) {
    http_response_code(400);
    echo json_encode(['error' => 'Session data not found']);
    exit();
}

// Exchange authorization code for access token
$tokenUrl = 'https://oauth.zaloapp.com/v4/access_token';
$tokenData = [
    'app_id' => ZALO_APP_ID,
    'app_secret' => ZALO_APP_SECRET,
    'code' => $code,
    'code_verifier' => $codeVerifier
];

$tokenResponse = makeRequest($tokenUrl, $tokenData);

if (!$tokenResponse || !isset($tokenResponse['access_token'])) {
    // Redirect back to app with error
    $errorUrl = $appDomain . '/auth?zalo_error=token_exchange_failed';
    header('Location: ' . $errorUrl);
    exit();
}

// Get user information
$userUrl = 'https://graph.zalo.me/v2.0/me?fields=id,name,picture&access_token=' . $tokenResponse['access_token'];
$userResponse = makeRequest($userUrl, null, 'GET');

// Prepare OAuth data
$oauthData = [
    'token' => $tokenResponse,
    'userInfo' => $userResponse,
    'timestamp' => time()
];

// Encode data for URL transmission
$encryptedData = base64_encode(json_encode($oauthData));

// Clear session data
session_destroy();

// Redirect back to app with OAuth success
$successUrl = $appDomain . '/auth?zalo_success=1&data=' . urlencode($encryptedData);
header('Location: ' . $successUrl);
exit();
?>
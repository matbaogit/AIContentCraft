<?php
// OAuth Callback Handler for toolbox.vn/api/auth/zalo/callback
require_once '../../../config.php';
setCorsHeaders();

// Start session to retrieve stored data
session_start();

// Get OAuth callback parameters
$code = $_GET['code'] ?? '';
$state = $_GET['state'] ?? '';
$error = $_GET['error'] ?? '';

// Handle OAuth error
if ($error) {
    $appDomain = $_SESSION['app_domain'] ?? 'https://toolbox.vn';
    $errorUrl = $appDomain . '/auth?zalo_error=' . urlencode($error);
    error_log("Zalo OAuth Error: " . $error);
    header('Location: ' . $errorUrl);
    exit();
}

// Validate required parameters
if (empty($code)) {
    error_log("Zalo Callback: Missing authorization code");
    http_response_code(400);
    echo json_encode(['error' => 'Authorization code not provided']);
    exit();
}

// Retrieve session data
$codeVerifier = $_SESSION['code_verifier'] ?? '';
$appDomain = $_SESSION['app_domain'] ?? '';
$sessionState = $_SESSION['oauth_state'] ?? '';

if (empty($codeVerifier) || empty($appDomain)) {
    error_log("Zalo Callback: Missing session data");
    http_response_code(400);
    echo json_encode(['error' => 'Session data not found']);
    exit();
}

// Verify state parameter for CSRF protection
if ($state !== $sessionState) {
    error_log("Zalo Callback: State mismatch");
    $errorUrl = $appDomain . '/auth?zalo_error=state_mismatch';
    header('Location: ' . $errorUrl);
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

error_log("Zalo Token Exchange: " . json_encode($tokenData));
$tokenResponse = makeRequest($tokenUrl, $tokenData);

if (!$tokenResponse || !isset($tokenResponse['access_token'])) {
    error_log("Zalo Token Exchange Failed: " . json_encode($tokenResponse));
    // Redirect back to app with error
    $errorUrl = $appDomain . '/auth?zalo_error=token_exchange_failed';
    header('Location: ' . $errorUrl);
    exit();
}

// Get user information
$userUrl = 'https://graph.zalo.me/v2.0/me?fields=id,name,picture&access_token=' . $tokenResponse['access_token'];
$userResponse = makeRequest($userUrl, null, 'GET');

error_log("Zalo User Info: " . json_encode($userResponse));

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
error_log("Zalo Success Redirect: " . $successUrl);
header('Location: ' . $successUrl);
exit();
?>
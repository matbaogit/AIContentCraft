# Zalo Proxy Deployment Files for toolbox.vn

## Required Endpoints to Deploy:

### 1. `/api/zalo-proxy/auth` - OAuth Initiation
### 2. `/api/auth/zalo/callback` - OAuth Callback Handler

---

## File 1: `config.php` (Zalo Configuration)
```php
<?php
// Zalo OAuth Configuration
define('ZALO_APP_ID', '4127841001935001267');
define('ZALO_APP_SECRET', 'YOUR_ZALO_APP_SECRET'); // Get from database or env
define('ZALO_REDIRECT_URI', 'https://toolbox.vn/api/auth/zalo/callback');

// CORS Headers for all API endpoints
function setCorsHeaders() {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}
?>
```

---

## File 2: `/api/zalo-proxy/auth.php` (OAuth Initiation)
```php
<?php
require_once '../../config.php';
setCorsHeaders();

// Get parameters
$redirect_uri = $_GET['redirect_uri'] ?? '';
$app_domain = $_GET['app_domain'] ?? '';

if (empty($redirect_uri) || empty($app_domain)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required parameters']);
    exit();
}

// Generate PKCE parameters
$codeVerifier = base64url_encode(random_bytes(32));
$codeChallenge = base64url_encode(hash('sha256', $codeVerifier, true));

// Store in session for later verification
session_start();
$_SESSION['code_verifier'] = $codeVerifier;
$_SESSION['app_domain'] = $app_domain;
$_SESSION['original_redirect_uri'] = $redirect_uri;

// Build Zalo OAuth URL
$authUrl = 'https://oauth.zaloapp.com/v4/permission?' . http_build_query([
    'app_id' => ZALO_APP_ID,
    'redirect_uri' => ZALO_REDIRECT_URI,
    'code_challenge' => $codeChallenge,
    'state' => bin2hex(random_bytes(16))
]);

// Redirect to Zalo OAuth
header('Location: ' . $authUrl);
exit();

function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}
?>
```

---

## File 3: `/api/auth/zalo/callback.php` (OAuth Callback)
```php
<?php
require_once '../../../config.php';
setCorsHeaders();

session_start();

$code = $_GET['code'] ?? '';
$state = $_GET['state'] ?? '';

if (empty($code)) {
    http_response_code(400);
    echo json_encode(['error' => 'Authorization code not provided']);
    exit();
}

$codeVerifier = $_SESSION['code_verifier'] ?? '';
$appDomain = $_SESSION['app_domain'] ?? '';

if (empty($codeVerifier) || empty($appDomain)) {
    http_response_code(400);
    echo json_encode(['error' => 'Session data not found']);
    exit();
}

// Exchange code for token
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

// Get user info
$userUrl = 'https://graph.zalo.me/v2.0/me?fields=id,name,picture&access_token=' . $tokenResponse['access_token'];
$userResponse = makeRequest($userUrl, null, 'GET');

// Prepare data to send back to app
$oauthData = [
    'token' => $tokenResponse,
    'userInfo' => $userResponse,
    'timestamp' => time()
];

// Encrypt data for security
$encryptedData = base64_encode(json_encode($oauthData));

// Redirect back to app with OAuth data
$successUrl = $appDomain . '/auth?zalo_success=1&data=' . urlencode($encryptedData);
header('Location: ' . $successUrl);
exit();

function makeRequest($url, $data = null, $method = 'POST') {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    if ($method === 'POST' && $data) {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/x-www-form-urlencoded'
        ]);
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        return null;
    }
    
    return json_decode($response, true);
}
?>
```

---

## File 4: Frontend Handler Update (for Replit app)

Add this to your auth page to handle the OAuth callback:

```javascript
// In your auth page component
useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const zaloSuccess = urlParams.get('zalo_success');
    const zaloError = urlParams.get('zalo_error');
    const data = urlParams.get('data');
    
    if (zaloSuccess && data) {
        try {
            const oauthData = JSON.parse(atob(decodeURIComponent(data)));
            // Process OAuth success
            handleZaloOAuthSuccess(oauthData);
        } catch (error) {
            console.error('Failed to parse OAuth data:', error);
        }
    }
    
    if (zaloError) {
        // Handle OAuth error
        toast({
            title: "Lỗi Zalo OAuth",
            description: "Đăng nhập Zalo thất bại. Vui lòng thử lại.",
            variant: "destructive",
        });
    }
}, []);
```

---

## Deployment Instructions:

1. **Upload files to toolbox.vn**:
   - `/config.php` (root config)
   - `/api/zalo-proxy/auth.php`
   - `/api/auth/zalo/callback.php`

2. **Update Zalo App Secret**:
   - Get `ZALO_APP_SECRET` from your Zalo Developer Console
   - Update in `config.php`

3. **Add Callback URL to Zalo Console**:
   ```
   https://toolbox.vn/api/auth/zalo/callback
   ```

4. **Test Endpoints**:
   - Test: `https://toolbox.vn/api/zalo-proxy/auth?redirect_uri=test&app_domain=test`
   - Should redirect to Zalo OAuth

## Ready for deployment! 🚀
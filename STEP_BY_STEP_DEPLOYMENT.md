# 📋 Step-by-Step Deployment Guide

## Current Issue:
Test cho thấy redirect URI sai: `/api/zalo-proxy/callback` thay vì `/api/auth/zalo/callback`

## 🔄 Re-deployment Steps:

### Step 1: Upload Files to toolbox.vn
```
toolbox.vn/
├── config.php                    ← REPLACE THIS
├── api/
│   ├── zalo-proxy/
│   │   └── auth.php              ← Already correct
│   └── auth/
│       └── zalo/
│           └── callback.php      ← Already correct
```

### Step 2: Update config.php Content
Replace `GET_FROM_ZALO_DEVELOPER_CONSOLE` with actual Zalo App Secret

### Step 3: Verify Zalo Developer Console
Ensure callback URL is set to:
```
https://toolbox.vn/api/auth/zalo/callback
```

### Step 4: Test Endpoints
```bash
# Test 1: OAuth initiation should redirect to Zalo
curl -I "https://toolbox.vn/api/zalo-proxy/auth?redirect_uri=test&app_domain=test"

# Expected: Location header contains redirect_uri=https%3A%2F%2Ftoolbox.vn%2Fapi%2Fauth%2Fzalo%2Fcallback
```

### Step 5: Test Full Flow
1. User clicks Zalo button on Replit app
2. Replit redirects to: `https://toolbox.vn/api/zalo-proxy/auth`
3. toolbox.vn redirects to: `https://oauth.zaloapp.com/v4/permission`
4. Zalo redirects back to: `https://toolbox.vn/api/auth/zalo/callback`
5. toolbox.vn processes and redirects back to Replit with OAuth data

## 🚨 Critical Check:
Make sure the uploaded config.php contains:
```php
define('ZALO_REDIRECT_URI', 'https://toolbox.vn/api/auth/zalo/callback');
```

NOT:
```php
define('ZALO_REDIRECT_URI', 'https://toolbox.vn/api/zalo-proxy/callback');
```

Deploy ngay! 🚀
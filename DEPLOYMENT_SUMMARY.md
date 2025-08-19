# 🚀 Zalo OAuth Proxy - Ready for Deployment

## Files to Upload to toolbox.vn:

### 1. **Root Files**:
- `config.php` (Zalo configuration & helper functions)
- `callback.php` (Alternative callback handler)

### 2. **API Directory Structure**:
```
toolbox.vn/
├── config.php
├── callback.php
└── api/
    ├── zalo-proxy/
    │   └── auth.php
    └── auth/
        └── zalo/
            └── callback.php
```

## Required URLs on toolbox.vn:

✅ **Primary Endpoints**:
- `https://toolbox.vn/api/zalo-proxy/auth` (OAuth initiation)
- `https://toolbox.vn/api/auth/zalo/callback` (OAuth callback)

## Before Deployment:

1. **Get Zalo App Secret**:
   - Login to Zalo Developer Console
   - Get `ZALO_APP_SECRET` for App ID: `4127841001935001267`
   - Replace `YOUR_ZALO_APP_SECRET` in `config.php`

2. **Add Callback URL to Zalo Console**:
   ```
   https://toolbox.vn/api/auth/zalo/callback
   ```

## Deployment Steps:

1. **Upload all PHP files** to toolbox.vn with correct directory structure
2. **Update ZALO_APP_SECRET** in config.php
3. **Test endpoints**:
   - `curl https://toolbox.vn/api/zalo-proxy/auth?redirect_uri=test&app_domain=test`
   - Should redirect to Zalo OAuth

## Flow After Deployment:

1. **User clicks Zalo button** → `/api/auth/zalo`
2. **Replit redirects to** → `https://toolbox.vn/api/zalo-proxy/auth`
3. **toolbox.vn redirects to** → `https://oauth.zaloapp.com/v4/permission`
4. **Zalo redirects back to** → `https://toolbox.vn/api/auth/zalo/callback`
5. **toolbox.vn processes & redirects to** → Replit domain with OAuth data

**All files ready for deployment! 🎯**
# Fix Zalo "Invalid redirect_uri" Error (-14003)

## Problem Analysis
Zalo OAuth returns error -14003 "Invalid redirect uri" because the callback URL used in OAuth request doesn't match the configured URL in Zalo Developer Console.

## Current Flow URLs:
1. **App** → `https://toolbox.vn/api/zalo-proxy/auth`
2. **Proxy** → `https://oauth.zaloapp.com/v4/permission?redirect_uri=https://toolbox.vn/api/zalo-proxy/callback`
3. **Zalo** should callback to → `https://toolbox.vn/api/zalo-proxy/callback`

## Required Fix in Zalo Developer Console:

### App Configuration:
- **App ID**: `4127841001935001267` (confirmed in database)
- **Callback URL to add**: `https://toolbox.vn/api/zalo-proxy/callback`

### Steps to Fix:
1. **Login to Zalo Developers**: https://developers.zalo.me/
2. **Select App ID**: `4127841001935001267`
3. **Go to OAuth Settings**
4. **Add Callback URL**: `https://toolbox.vn/api/zalo-proxy/callback`
5. **Save Configuration**

## Testing URLs:
- **Development OAuth Start**: `http://localhost:5000/api/auth/zalo`
- **Expected Zalo Callback**: `https://toolbox.vn/api/zalo-proxy/callback`
- **Final App Callback**: `[dev_domain]/api/auth/zalo/proxy-callback`

## Note:
Both `callback` and `callback-relay` endpoints are implemented in the proxy system, but Zalo must be configured to call the main `callback` endpoint first.
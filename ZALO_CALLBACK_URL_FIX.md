# Zalo Callback URL Fix

## ✅ Updated to Use toolbox.vn Callback

### Changes Made:

1. **Frontend Button**: Removed `?direct=true` parameter
   - Popup URL: `/api/auth/zalo` (back to proxy flow)
   - Fallback URL: `/api/auth/zalo` (back to proxy flow)

2. **Backend Proxy Logic**: Updated callback URL
   - Old: `${getProxyBaseUrl()}/api/zalo-proxy/callback-relay`
   - New: `${getProxyBaseUrl()}/api/auth/zalo/callback`
   - Result: `https://toolbox.vn/api/auth/zalo/callback`

3. **Flow Logic**: Force proxy unless `?direct=true`
   - Default flow: Always use toolbox.vn proxy
   - Direct flow: Only when explicitly requested with `?direct=true`

### Current Callback URL in Zalo Developer Console:
```
https://toolbox.vn/api/auth/zalo/callback
```

### Proxy System Requirements:
The following endpoints must be deployed on toolbox.vn:
- `/api/zalo-proxy/auth` - OAuth initiation
- `/api/auth/zalo/callback` - OAuth callback handler

### Test Flow:
1. User clicks Zalo button → `/api/auth/zalo`
2. Redirects to → `https://toolbox.vn/api/zalo-proxy/auth`
3. Zalo OAuth redirects to → `https://toolbox.vn/api/auth/zalo/callback`
4. Proxy relays back to → Replit domain with OAuth result

**Ready for deployment to toolbox.vn!**
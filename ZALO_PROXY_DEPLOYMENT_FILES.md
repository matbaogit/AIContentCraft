# Files to Deploy to toolbox.vn

## Required Files for Proxy Deployment

### 1. Main Proxy Routes File
Copy content from: `server/routes/zalo-proxy.ts`
Deploy to: `toolbox.vn/api/zalo-proxy/`

### 2. Encryption Utilities
Copy content from: `server/utils/encryption.ts` 
Deploy to: `toolbox.vn/utils/encryption.ts`

### 3. Environment Variables for toolbox.vn
```bash
# Required environment variables on toolbox.vn
ZALO_APP_ID=4127841001935001267
ZALO_APP_SECRET=[your_zalo_app_secret]
ENCRYPTION_SECRET=8f9e7d6c5b4a39281746e5d4c3b2a1908f7e6d5c4b3a2918e7d6c5b4a3928174
```

## Deployment Steps

1. **Copy encryption utilities** to toolbox.vn
2. **Copy zalo-proxy routes** to toolbox.vn  
3. **Set environment variables** on toolbox.vn
4. **Test endpoints**:
   - `GET /api/zalo-proxy/auth?redirect_uri=[callback_url]`
   - `GET /api/zalo-proxy/callback-relay?app_domain=[domain]`

## Callback Flow

1. **Development App** → `GET /api/auth/zalo`
2. **Redirects to** → `https://toolbox.vn/api/zalo-proxy/auth?redirect_uri=https://toolbox.vn/api/zalo-proxy/callback-relay?app_domain=[dev_domain]`
3. **Zalo OAuth** → Returns to `https://toolbox.vn/api/zalo-proxy/callback-relay`
4. **Proxy processes** → Encrypts data and redirects to `[dev_domain]/api/auth/zalo/proxy-callback`
5. **App receives** → Decrypts data and shows confirmation modal

## Security Notes
- Same encryption key must be configured on both app and toolbox.vn
- Data is encrypted during transfer between proxy and app
- Tokens expire after 10 minutes for security
# Zalo OAuth Quick Fix

## Immediate Solution for Testing

### Problem:
- Proxy endpoints not deployed to toolbox.vn yet
- Getting "Invalid redirect_uri" error (-14003)

### Quick Fix Steps:

1. **Add your Replit domain to Zalo Developer Console:**
   ```
   https://11a56b9f-4269-48a7-b12d-cde3c89de60d-00-28s4cntgjrwsd.riker.replit.dev/api/auth/zalo/callback
   ```

2. **Set environment variable temporarily:**
   - Go to Replit Secrets panel
   - Add key: `FORCE_DIRECT_OAUTH`
   - Add value: `true`

3. **Test OAuth flow:**
   - Click Zalo login button
   - Should now use direct OAuth instead of proxy

### Alternative: Manual Testing

If environment variable doesn't work immediately:
```bash
export FORCE_DIRECT_OAUTH=true
npm run dev
```

This will bypass the proxy system and use direct Zalo OAuth for development testing.

### Production Ready:
Once proxy is deployed to toolbox.vn, remove the `FORCE_DIRECT_OAUTH` variable to use the proxy system.
import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../../db';
import * as schema from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { isDevelopment, getCurrentDomain, getProxyBaseUrl } from '../utils/environment';
import { createEncryption } from '../utils/encryption';

const router = Router();

// GET /api/auth/zalo - Start Zalo OAuth
router.get('/', async (req, res) => {
  console.log('=== ZALO OAUTH START ===');
  console.log('Environment:', { isDev: isDevelopment(), currentDomain: getCurrentDomain() });
  console.log('Session:', req.session);
  console.log('Request URL:', req.url);
  console.log('Request headers:', req.headers);
  console.log('Request query:', req.query);
  
  try {
    // Always use toolbox.vn proxy unless explicitly requested direct OAuth
    if (!req.query.direct) {
      console.log('Using toolbox.vn proxy for OAuth...');
      
      // Redirect to toolbox.vn proxy with relay callback
      const proxyUrl = new URL(`${getProxyBaseUrl()}/api/zalo-proxy/auth`);
      proxyUrl.searchParams.set('redirect_uri', `${getProxyBaseUrl()}/api/auth/zalo/callback`);
      proxyUrl.searchParams.set('app_domain', getCurrentDomain());
      
      console.log('Redirecting to proxy:', proxyUrl.toString());
      return res.redirect(proxyUrl.toString());
    }

    // Production flow (or forced direct OAuth) - direct Zalo OAuth
    console.log('Using direct OAuth flow (direct=true parameter)...');
    
    // Fetch Zalo settings from database
    const zaloAppIdSetting = await db.select()
      .from(schema.systemSettings)
      .where(eq(schema.systemSettings.key, 'zaloAppId'))
      .limit(1);
    
    const zaloAppId = zaloAppIdSetting.length > 0 ? zaloAppIdSetting[0].value : null;
    
    if (!zaloAppId) {
      console.error('Zalo App ID not configured');
      return res.redirect('/?error=zalo_not_configured');
    }

    // Generate PKCE parameters
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    
    // Store code verifier in session
    req.session.codeVerifier = codeVerifier;
    
    // Build Zalo authorization URL
    const authUrl = new URL('https://oauth.zaloapp.com/v4/permission');
    authUrl.searchParams.set('app_id', zaloAppId);
    authUrl.searchParams.set('redirect_uri', `${getCurrentDomain()}/api/auth/zalo/callback`);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('state', crypto.randomBytes(16).toString('hex'));

    console.log('Redirecting to Zalo OAuth:', authUrl.toString());
    res.redirect(authUrl.toString());

  } catch (error) {
    console.error('Error starting Zalo OAuth:', error);
    res.redirect('/?error=zalo_oauth_error');
  }
});

// GET /api/auth/zalo/callback - Handle Zalo OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const codeVerifier = req.session.codeVerifier;

    if (!code || !codeVerifier) {
      console.error('Missing authorization code or code verifier');
      return res.redirect('/?error=zalo_callback_failed');
    }

    // Fetch Zalo settings from database
    const [zaloAppIdSetting, zaloAppSecretSetting] = await Promise.all([
      db.select()
        .from(schema.systemSettings)
        .where(eq(schema.systemSettings.key, 'zaloAppId'))
        .limit(1),
      db.select()
        .from(schema.systemSettings)
        .where(eq(schema.systemSettings.key, 'zaloAppSecret'))
        .limit(1)
    ]);
    
    const zaloAppId = zaloAppIdSetting.length > 0 ? zaloAppIdSetting[0].value : null;
    const zaloAppSecret = zaloAppSecretSetting.length > 0 ? zaloAppSecretSetting[0].value : null;

    if (!zaloAppId || !zaloAppSecret) {
      console.error('Zalo App ID or Secret not configured');
      return res.redirect('/?error=zalo_not_configured');
    }

    console.log('Exchanging code for token with Zalo...');
    
    // Exchange code for access token
    const tokenRequestBody = {
      app_id: zaloAppId,
      grant_type: 'authorization_code',
      code: code as string,
      code_verifier: codeVerifier
    };

    const tokenResponse = await fetch('https://oauth.zaloapp.com/v4/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'secret_key': zaloAppSecret
      },
      body: new URLSearchParams(tokenRequestBody)
    });

    const tokenData = await tokenResponse.json();
    console.log('=== ZALO TOKEN API RESPONSE ===');
    console.log('Status:', tokenResponse.status);
    console.log('Raw Token Response:', JSON.stringify(tokenData, null, 2));
    console.log('Available token fields:', Object.keys(tokenData || {}));
    console.log('=== END ZALO TOKEN RESPONSE ===');

    if (!tokenData.access_token) {
      console.error('Failed to get Zalo access token:', tokenData);
      return res.redirect('/?error=zalo_token_failed');
    }

    // Get user info from Zalo - request more fields
    const userResponse = await fetch('https://graph.zalo.me/v2.0/me?fields=id,name,picture,gender,birthday,locale', {
      headers: {
        'access_token': tokenData.access_token
      }
    });

    const zaloUser = await userResponse.json();
    console.log('=== ZALO USER API RESPONSE ===');
    console.log('Status:', userResponse.status);
    console.log('Headers:', Object.fromEntries(userResponse.headers.entries()));
    console.log('Raw Response:', JSON.stringify(zaloUser, null, 2));
    console.log('Available fields:', Object.keys(zaloUser || {}));
    console.log('=== END ZALO USER RESPONSE ===');

    // Store OAuth data in session for confirmation
    console.log('Storing Zalo OAuth data for user confirmation...');
    
    // Create session data with all available information
    const sessionData = {
      token: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        refresh_token_expires_in: tokenData.refresh_token_expires_in
      },
      userInfo: zaloUser,
      timestamp: Date.now()
    };

    // Store in session (will be read by frontend)
    (req.session as any).zalo_oauth_data = sessionData;
    
    console.log('Zalo OAuth data stored in session, redirecting to confirmation...');

    // Return HTML that will trigger the confirmation modal
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Xác nhận thông tin Zalo</title>
        <meta charset="utf-8">
        <script>
          // Store data in sessionStorage for frontend access
          sessionStorage.setItem('zalo_oauth_data', ${JSON.stringify(JSON.stringify(sessionData))});
          
          setTimeout(() => {
            if (window.opener) {
              window.opener.postMessage({
                type: 'ZALO_OAUTH_SUCCESS',
                needsConfirmation: true
              }, '*');
              window.close();
            } else {
              window.location.href = '/?zalo_confirm=true';
            }
          }, 100);
        </script>
      </head>
      <body>
        <p>Đã nhận thông tin từ Zalo. Đang chuyển đến trang xác nhận...</p>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Error in Zalo OAuth callback:', error);
    return res.redirect('/?error=zalo_oauth_failed');
  }
});

// GET /api/auth/zalo/proxy-callback - Handle callback from toolbox.vn proxy
router.get('/proxy-callback', async (req, res) => {
  console.log('=== ZALO PROXY CALLBACK ===');
  console.log('Query params:', req.query);

  try {
    const { zalo_proxy_token, success, zalo_proxy_error, error_details } = req.query;

    // Handle errors from proxy
    if (zalo_proxy_error) {
      console.error('Zalo proxy error:', zalo_proxy_error, error_details);
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Lỗi xác thực Zalo</title>
          <meta charset="utf-8">
          <script>
            setTimeout(() => {
              if (window.opener) {
                window.opener.postMessage({
                  type: 'ZALO_OAUTH_ERROR',
                  error: '${zalo_proxy_error}',
                  details: '${error_details || ''}'
                }, '*');
                window.close();
              } else {
                window.location.href = '/?error=zalo_proxy_failed';
              }
            }, 100);
          </script>
        </head>
        <body>
          <p>Có lỗi xảy ra trong quá trình xác thực Zalo: ${error_details || zalo_proxy_error}</p>
        </body>
        </html>
      `);
    }

    if (!success || !zalo_proxy_token) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Lỗi xác thức Zalo</title>
          <meta charset="utf-8">
          <script>
            setTimeout(() => {
              if (window.opener) {
                window.opener.postMessage({
                  type: 'ZALO_OAUTH_ERROR',
                  error: 'missing_token'
                }, '*');
                window.close();
              } else {
                window.location.href = '/?error=zalo_token_missing';
              }
            }, 100);
          </script>
        </head>
        <body>
          <p>Không nhận được dữ liệu xác thực từ Zalo.</p>
        </body>
        </html>
      `);
    }

    // Get encryption key from database
    const encryptionSettings = await db.select()
      .from(schema.systemSettings)
      .where(eq(schema.systemSettings.key, 'encryptionSecret'))
      .limit(1);
    
    const encryptionKey = encryptionSettings.length > 0 ? encryptionSettings[0].value : null;
    if (!encryptionKey) {
      console.error('Encryption key not configured');
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Lỗi cấu hình</title>
          <meta charset="utf-8">
          <script>
            setTimeout(() => {
              if (window.opener) {
                window.opener.postMessage({
                  type: 'ZALO_OAUTH_ERROR',
                  error: 'config_error'
                }, '*');
                window.close();
              } else {
                window.location.href = '/?error=zalo_config_error';
              }
            }, 100);
          </script>
        </head>
        <body>
          <p>Lỗi cấu hình hệ thống.</p>
        </body>
        </html>
      `);
    }

    // Decrypt proxy data
    const encryption = createEncryption(encryptionKey);
    const proxyData = encryption.verifyToken(zalo_proxy_token as string);

    console.log('Decrypted proxy data:', proxyData);

    // Store in session for confirmation modal
    (req.session as any).zalo_oauth_data = proxyData;

    // Return HTML that will trigger the confirmation modal
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Xác nhận thông tin Zalo</title>
        <meta charset="utf-8">
        <script>
          // Store data in sessionStorage for frontend access
          sessionStorage.setItem('zalo_oauth_data', ${JSON.stringify(JSON.stringify(proxyData))});
          
          setTimeout(() => {
            if (window.opener) {
              window.opener.postMessage({
                type: 'ZALO_OAUTH_SUCCESS',
                needsConfirmation: true,
                source: 'proxy'
              }, '*');
              window.close();
            } else {
              window.location.href = '/?zalo_confirm=true';
            }
          }, 100);
        </script>
      </head>
      <body>
        <p>Đã nhận thông tin từ Zalo qua proxy. Đang chuyển đến trang xác nhận...</p>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('Error in Zalo proxy callback:', error);
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Lỗi xử lý callback</title>
        <meta charset="utf-8">
        <script>
          setTimeout(() => {
            if (window.opener) {
              window.opener.postMessage({
                type: 'ZALO_OAUTH_ERROR',
                error: 'callback_error',
                details: '${error.message}'
              }, '*');
              window.close();
            } else {
              window.location.href = '/?error=zalo_callback_error';
            }
          }, 100);
        </script>
      </head>
      <body>
        <p>Có lỗi xảy ra khi xử lý callback: ${error.message}</p>
      </body>
      </html>
    `);
  }
});

export default router;
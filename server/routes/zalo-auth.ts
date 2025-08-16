import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../../db';

const router = Router();

// GET /api/auth/zalo - Start Zalo OAuth
router.get('/', async (req, res) => {
  try {
    // Fetch Zalo settings from database
    const settings = await db.query.adminSettings.findFirst();
    const zaloAppId = settings?.zaloAppId;
    
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
    authUrl.searchParams.set('redirect_uri', `${req.protocol}://${req.get('host')}/api/auth/zalo/callback`);
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
    const settings = await db.query.adminSettings.findFirst();
    const zaloAppId = settings?.zaloAppId;
    const zaloAppSecret = settings?.zaloAppSecret;

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

export default router;
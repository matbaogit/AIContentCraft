import { Router } from 'express';
import { nanoid } from 'nanoid';
import { createEncryption } from '../utils/encryption';
import { isDevelopment, getCurrentDomain, getProxyBaseUrl } from '../utils/environment';
import { db } from '../../db';
import * as schema from '../../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * Zalo OAuth Proxy Routes
 * These endpoints will be deployed on toolbox.vn to bypass IP restrictions
 */

// Initialize OAuth flow through proxy
router.get('/auth', async (req, res) => {
  try {
    console.log('=== ZALO PROXY AUTH START ===');
    console.log('Query params:', req.query);
    console.log('Headers:', req.headers);

    const { redirect_uri, state } = req.query;

    if (!redirect_uri) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing redirect_uri parameter' 
      });
    }

    // Get Zalo App settings
    const appSettings = await db.select()
      .from(schema.systemSettings)
      .where(eq(schema.systemSettings.key, 'zaloAppId'))
      .limit(1);
    const appId = appSettings.length > 0 ? appSettings[0].value : null;

    if (!appId) {
      return res.status(500).json({ 
        success: false, 
        error: 'Zalo App ID not configured' 
      });
    }

    // Generate state for security
    const proxyState = state || nanoid();
    
    // Store redirect info in session
    (req.session as any).zalo_proxy_redirect = redirect_uri;
    (req.session as any).zalo_proxy_state = proxyState;

    // Build Zalo OAuth URL
    const zaloAuthUrl = new URL('https://oauth.zaloapp.com/v4/permission');
    zaloAuthUrl.searchParams.set('app_id', appId);
    zaloAuthUrl.searchParams.set('redirect_uri', `${getProxyBaseUrl()}/api/zalo-proxy/callback`);
    zaloAuthUrl.searchParams.set('state', proxyState);

    console.log('Redirecting to Zalo OAuth:', zaloAuthUrl.toString());

    return res.redirect(zaloAuthUrl.toString());

  } catch (error) {
    console.error('Error in Zalo proxy auth:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Handle Zalo OAuth callback and fetch user data
router.get('/callback', async (req, res) => {
  try {
    console.log('=== ZALO PROXY CALLBACK ===');
    console.log('Query params:', req.query);

    const { code, state, error, error_description } = req.query;

    if (error) {
      console.error('Zalo OAuth error:', error, error_description);
      return res.status(400).json({
        success: false,
        error: 'Zalo OAuth failed',
        details: error_description
      });
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Missing authorization code'
      });
    }

    // Verify state
    const sessionState = (req.session as any).zalo_proxy_state;
    if (state !== sessionState) {
      return res.status(400).json({
        success: false,
        error: 'Invalid state parameter'
      });
    }

    const redirectUri = (req.session as any).zalo_proxy_redirect;
    if (!redirectUri) {
      return res.status(400).json({
        success: false,
        error: 'Missing redirect URI in session'
      });
    }

    // Get Zalo App settings
    const appSettings = await db.select()
      .from(schema.systemSettings)
      .where(eq(schema.systemSettings.key, 'zaloAppId'))
      .limit(1);
    const secretSettings = await db.select()
      .from(schema.systemSettings)
      .where(eq(schema.systemSettings.key, 'zaloAppSecret'))
      .limit(1);
    
    const appId = appSettings.length > 0 ? appSettings[0].value : null;
    const appSecret = secretSettings.length > 0 ? secretSettings[0].value : null;

    if (!appId || !appSecret) {
      return res.status(500).json({
        success: false,
        error: 'Zalo App credentials not configured'
      });
    }

    // Exchange code for access token
    console.log('Exchanging code for token...');
    const tokenUrl = 'https://oauth.zaloapp.com/v4/access_token';
    const tokenParams = new URLSearchParams({
      app_id: appId,
      app_secret: appSecret,
      code: code as string
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: tokenParams
    });

    const tokenData = await tokenResponse.json();
    console.log('Token response:', tokenData);

    if (tokenData.error) {
      return res.status(400).json({
        success: false,
        error: 'Token exchange failed',
        details: tokenData.error_description
      });
    }

    // Get user info from Zalo
    console.log('Fetching user info...');
    const userResponse = await fetch('https://graph.zalo.me/v2.0/me?fields=id,name,picture,gender,birthday,locale', {
      headers: {
        'access_token': tokenData.access_token
      }
    });

    const zaloUser = await userResponse.json();
    console.log('Zalo user response:', zaloUser);

    // Prepare data to send back
    const proxyData = {
      token: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        refresh_token_expires_in: tokenData.refresh_token_expires_in
      },
      userInfo: zaloUser,
      timestamp: Date.now(),
      source: 'toolbox_proxy'
    };

    // Encrypt data for secure transfer
    const encryptionSettings = await db.select()
      .from(schema.systemSettings)
      .where(eq(schema.systemSettings.key, 'encryptionSecret'))
      .limit(1);
    
    const encryptionKey = encryptionSettings.length > 0 ? encryptionSettings[0].value : null;
    if (!encryptionKey) {
      return res.status(500).json({
        success: false,
        error: 'Encryption key not configured'
      });
    }

    const encryption = createEncryption(encryptionKey);
    const token = encryption.createToken(proxyData, 10); // 10 minutes expiry

    // Build redirect URL with encrypted data
    const finalRedirectUrl = new URL(redirectUri as string);
    finalRedirectUrl.searchParams.set('zalo_proxy_token', token);
    finalRedirectUrl.searchParams.set('success', '1');

    console.log('Redirecting back to app:', finalRedirectUrl.toString());

    return res.redirect(finalRedirectUrl.toString());

  } catch (error) {
    console.error('Error in Zalo proxy callback:', error);
    
    // Try to redirect back with error
    const redirectUri = (req.session as any).zalo_proxy_redirect;
    if (redirectUri) {
      const errorUrl = new URL(redirectUri);
      errorUrl.searchParams.set('zalo_proxy_error', 'callback_failed');
      errorUrl.searchParams.set('error_details', error.message);
      return res.redirect(errorUrl.toString());
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// GET /api/zalo-proxy/callback-relay - Relay callback data to original app
router.get('/callback-relay', async (req, res) => {
  console.log('=== ZALO CALLBACK RELAY ===');
  console.log('Query params:', req.query);
  
  try {
    const { app_domain, code, state, error, error_description } = req.query;
    
    if (!app_domain) {
      return res.status(400).send('Missing app_domain parameter');
    }
    
    // Handle OAuth errors
    if (error) {
      console.error('Zalo OAuth error in relay:', error, error_description);
      const appCallbackUrl = `${app_domain}/api/auth/zalo/proxy-callback?zalo_proxy_error=${encodeURIComponent(error)}&error_details=${encodeURIComponent(error_description || '')}`;
      return res.redirect(appCallbackUrl);
    }
    
    if (!code) {
      const appCallbackUrl = `${app_domain}/api/auth/zalo/proxy-callback?zalo_proxy_error=missing_code`;
      return res.redirect(appCallbackUrl);
    }
    
    // Get Zalo app settings (these should be configured on toolbox.vn)
    const zaloAppId = process.env.ZALO_APP_ID || '4127841001935001267';
    const zaloAppSecret = process.env.ZALO_APP_SECRET;
    
    if (!zaloAppSecret) {
      console.error('Zalo App Secret not configured on proxy server');
      const appCallbackUrl = `${app_domain}/api/auth/zalo/proxy-callback?zalo_proxy_error=config_error&error_details=${encodeURIComponent('Proxy server configuration error')}`;
      return res.redirect(appCallbackUrl);
    }
    
    // Exchange code for access token
    const tokenUrl = 'https://oauth.zaloapp.com/v4/access_token';
    const tokenParams = new URLSearchParams({
      app_id: zaloAppId,
      app_secret: zaloAppSecret,
      code: code as string
    });
    
    console.log('Exchanging code for token...');
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: tokenParams.toString()
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }
    
    const tokenData = await tokenResponse.json();
    console.log('Token response:', tokenData);
    
    if (tokenData.error) {
      throw new Error(`Token error: ${tokenData.error} - ${tokenData.error_description}`);
    }
    
    // Fetch user info from Zalo
    const userInfoUrl = `https://graph.zalo.me/v2.0/me?fields=id,name,picture&access_token=${tokenData.access_token}`;
    console.log('Fetching user info from:', userInfoUrl);
    
    const userResponse = await fetch(userInfoUrl);
    
    if (!userResponse.ok) {
      throw new Error(`User info fetch failed: ${userResponse.status}`);
    }
    
    const zaloUser = await userResponse.json();
    console.log('Zalo user info:', zaloUser);
    
    if (zaloUser.error) {
      throw new Error(`User info error: ${zaloUser.error.message}`);
    }
    
    // Prepare data to send to app
    const sessionData = {
      tokenData: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        refresh_token_expires_in: tokenData.refresh_token_expires_in
      },
      userInfo: zaloUser,
      timestamp: Date.now()
    };
    
    // Get encryption settings from app domain (this needs to be configured)
    const encryptionKey = process.env.ENCRYPTION_SECRET || 'default-key-for-proxy';
    
    // Create encrypted token
    const encryption = createEncryption(encryptionKey);
    const encryptedToken = encryption.createToken(sessionData);
    
    console.log('Created encrypted token for relay');
    
    // Redirect to app with encrypted data
    const appCallbackUrl = `${app_domain}/api/auth/zalo/proxy-callback?success=true&zalo_proxy_token=${encodeURIComponent(encryptedToken)}`;
    console.log('Redirecting to app:', appCallbackUrl);
    
    return res.redirect(appCallbackUrl);
    
  } catch (error) {
    console.error('Error in callback relay:', error);
    const { app_domain } = req.query;
    if (app_domain) {
      const appCallbackUrl = `${app_domain}/api/auth/zalo/proxy-callback?zalo_proxy_error=relay_error&error_details=${encodeURIComponent(error.message)}`;
      return res.redirect(appCallbackUrl);
    } else {
      return res.status(500).send('Relay error: ' + error.message);
    }
  }
});

export default router;
import { Request, Response, Router } from 'express';
import { db } from '../../db';
import * as schema from '@shared/schema';
import { eq, or } from 'drizzle-orm';
import { storage } from '../storage';
import crypto from 'crypto';

const router = Router();

// Zalo OAuth login - redirect to Zalo
router.get('/login', async (req: Request, res: Response) => {
  try {
    // Get Zalo OAuth settings from database
    const zaloSettings = await storage.getSettingsByCategory('zalo_oauth');
    
    if (!zaloSettings.enableZaloOAuth || zaloSettings.enableZaloOAuth !== 'true') {
      return res.status(400).json({
        success: false,
        error: 'Zalo OAuth is not enabled'
      });
    }

    const zaloAppId = zaloSettings.zaloAppId;
    if (!zaloAppId) {
      return res.status(500).json({
        success: false,
        error: 'Zalo App ID not configured'
      });
    }

    // Build Zalo OAuth URL - use localhost for development, toolbox.vn for production
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://toolbox.vn' 
      : `${req.protocol}://${req.get('host')}`;
    const redirectUri = `${baseUrl}/api/auth/zalo/callback`;
    
    // Generate PKCE parameters
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    
    const state = Buffer.from(JSON.stringify({ 
      timestamp: Date.now(),
      source: 'zalo_login',
      codeVerifier // Store code_verifier in state for callback
    })).toString('base64');

    const zaloAuthUrl = `https://oauth.zaloapp.com/v4/permission` +
      `?app_id=${zaloAppId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&code_challenge=${codeChallenge}` +
      `&state=${state}`;

    console.log('Zalo OAuth Debug:', {
      appId: zaloAppId,
      appIdLength: zaloAppId?.length,
      redirectUri,
      encodedRedirectUri: encodeURIComponent(redirectUri),
      codeChallenge,
      fullUrl: zaloAuthUrl,
      state,
      allSettings: JSON.stringify(zaloSettings)
    });

    return res.redirect(zaloAuthUrl);
  } catch (error) {
    console.error('Error initiating Zalo OAuth:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to initiate Zalo OAuth'
    });
  }
});

// Zalo OAuth callback - handle response from Zalo
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      console.error('Zalo OAuth callback missing code:', req.query);
      return res.redirect('/?error=zalo_oauth_failed');
    }

    // Decode state to get code_verifier
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
    } catch (error) {
      console.error('Invalid state parameter:', error);
      return res.redirect('/?error=invalid_state');
    }

    // Get Zalo OAuth settings
    const zaloSettings = await storage.getSettingsByCategory('zalo_oauth');
    const zaloAppId = zaloSettings.zaloAppId;
    const zaloAppSecret = zaloSettings.zaloAppSecret;

    if (!zaloAppId || !zaloAppSecret) {
      console.error('Zalo OAuth settings not configured');
      return res.redirect('/?error=zalo_config_missing');
    }

    console.log('Processing Zalo OAuth callback:', {
      code: typeof code,
      state,
      appId: zaloAppId,
      codeVerifier: stateData.codeVerifier ? '[PROVIDED]' : '[MISSING]'
    });

    // Exchange code for access token with PKCE
    const tokenResponse = await fetch('https://oauth.zaloapp.com/v4/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'secret_key': zaloAppSecret
      },
      body: new URLSearchParams({
        app_id: zaloAppId,
        grant_type: 'authorization_code',
        code: code as string,
        code_verifier: stateData.codeVerifier
      })
    });

    const tokenData = await tokenResponse.json();
    console.log('Zalo token response:', tokenData);

    if (!tokenData.access_token) {
      console.error('Failed to get Zalo access token:', tokenData);
      return res.redirect('/?error=zalo_token_failed');
    }

    // Get user info from Zalo
    const userResponse = await fetch('https://graph.zalo.me/v2.0/me?fields=id,name,picture', {
      headers: {
        'access_token': tokenData.access_token
      }
    });

    const zaloUser = await userResponse.json();
    console.log('Zalo user info:', zaloUser);

    if (!zaloUser.id) {
      console.error('Failed to get Zalo user info:', zaloUser);
      return res.redirect('/?error=zalo_user_failed');
    }

    // Check if user exists with this Zalo ID
    let user = await db.select()
      .from(schema.users)
      .where(eq(schema.users.zaloId, zaloUser.id))
      .limit(1);

    if (user.length === 0) {
      // Create new user with Zalo info
      const username = `zalo_${zaloUser.id}`;
      const fullName = zaloUser.name || `Zalo User ${zaloUser.id}`;
      const avatar = zaloUser.picture?.data?.url || null;

      const [newUser] = await db.insert(schema.users).values({
        username,
        fullName,
        zaloId: zaloUser.id,
        avatar,
        email: null, // Zalo might not provide email
        role: 'user',
        credits: 50, // Default credits
        language: 'vi',
        isVerified: true, // Zalo users are pre-verified
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      user = [newUser];
      console.log('Created new Zalo user:', {
        id: newUser.id,
        username: newUser.username,
        zaloId: newUser.zaloId
      });
    } else {
      // Update existing user info from Zalo
      const existingUser = user[0];
      const updates: any = {
        updatedAt: new Date()
      };

      // Update name if changed
      if (zaloUser.name && zaloUser.name !== existingUser.fullName) {
        updates.fullName = zaloUser.name;
      }

      // Update avatar if available
      if (zaloUser.picture?.data?.url && zaloUser.picture.data.url !== existingUser.avatar) {
        updates.avatar = zaloUser.picture.data.url;
      }

      if (Object.keys(updates).length > 1) {
        await db.update(schema.users)
          .set(updates)
          .where(eq(schema.users.id, existingUser.id));
      }

      console.log('Updated existing Zalo user:', {
        id: existingUser.id,
        username: existingUser.username,
        zaloId: existingUser.zaloId
      });
    }

    // Set session and return success page
    req.login(user[0], (err) => {
      if (err) {
        console.error('Error setting user session after Zalo OAuth:', err);
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Lỗi đăng nhập</title>
            <meta charset="utf-8">
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
                color: white;
              }
              .container {
                text-align: center;
                padding: 2rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                backdrop-filter: blur(10px);
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div style="font-size: 4rem; margin-bottom: 1rem;">❌</div>
              <div style="font-size: 1.2rem;">Lỗi đăng nhập</div>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'ZALO_LOGIN_ERROR',
                  message: 'Lỗi tạo phiên đăng nhập'
                }, window.location.origin);
                window.close();
              }
            </script>
          </body>
          </html>
        `);
      }

      console.log('Zalo OAuth login successful:', {
        userId: user[0].id,
        username: user[0].username
      });

      // Return success page with postMessage
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Đăng nhập thành công</title>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 2rem;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 10px;
              backdrop-filter: blur(10px);
            }
            .success-icon {
              font-size: 4rem;
              margin-bottom: 1rem;
            }
            .message {
              font-size: 1.2rem;
              margin-bottom: 1rem;
            }
            .loading {
              font-size: 0.9rem;
              opacity: 0.8;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✅</div>
            <div class="message">Đăng nhập Zalo thành công!</div>
            <div class="loading">Đang chuyển hướng...</div>
          </div>
          <script>
            // Post success message to parent window
            if (window.opener) {
              window.opener.postMessage({
                type: 'ZALO_LOGIN_SUCCESS',
                user: {
                  id: ${user[0].id},
                  username: '${user[0].username}',
                  role: '${user[0].role}'
                }
              }, window.location.origin);
              window.close();
            } else {
              // Fallback if no opener
              setTimeout(() => {
                window.location.href = '/dashboard';
              }, 2000);
            }
          </script>
        </body>
        </html>
      `);
    });

  } catch (error) {
    console.error('Error in Zalo OAuth callback:', error);
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Lỗi đăng nhập</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
            color: white;
          }
          .container {
            text-align: center;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            backdrop-filter: blur(10px);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div style="font-size: 4rem; margin-bottom: 1rem;">❌</div>
          <div style="font-size: 1.2rem; margin-bottom: 1rem;">Lỗi đăng nhập Zalo</div>
          <div style="font-size: 0.9rem; opacity: 0.8;">Vui lòng thử lại sau</div>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'ZALO_LOGIN_ERROR',
              message: 'Lỗi xử lý OAuth callback'
            }, window.location.origin);
            window.close();
          } else {
            setTimeout(() => {
              window.location.href = '/auth?error=zalo_oauth_error';
            }, 3000);
          }
        </script>
      </body>
      </html>
    `);
  }
});

export default router;
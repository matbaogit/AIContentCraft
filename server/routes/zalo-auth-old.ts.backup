import { Request, Response, Router } from 'express';
import { db } from '../../db';
import * as schema from '@shared/schema';
import { eq, or } from 'drizzle-orm';
import { storage } from '../storage';
import crypto from 'crypto';

const router = Router();

// Simple test endpoint
router.get('/test', (req: Request, res: Response) => {
  console.log('=== ZALO AUTH TEST ENDPOINT HIT ===');
  res.json({ 
    success: true, 
    message: 'Zalo auth router is working!',
    timestamp: new Date().toISOString(),
    path: req.path,
    originalUrl: req.originalUrl
  });
});

// Zalo OAuth login - redirect to Zalo
router.get('/login', async (req: Request, res: Response) => {
  console.log('=== ZALO LOGIN START ===');
  console.log('Request headers:', req.headers);
  console.log('Request query:', req.query);
  console.log('Request host:', req.get('host'));
  
  try {
    // Get Zalo OAuth settings from database
    console.log('Fetching Zalo OAuth settings...');
    const zaloSettings = await storage.getSettingsByCategory('zalo_oauth');
    console.log('Zalo settings retrieved:', zaloSettings);
    
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

    // Build Zalo OAuth URL - detect correct base URL
    const host = req.get('host');
    const isReplit = host?.includes('replit.dev');
    
    console.log('Host detection:', { host, isReplit });
    
    // Auto-detect base URL based on current host
    let baseUrl;
    if (isReplit) {
      baseUrl = `https://${host}`;
      console.log('Using Replit URL:', baseUrl);
    } else {
      baseUrl = 'https://toolbox.vn';
      console.log('Using production URL:', baseUrl);
    }
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
      isReplit,
      requestHost: host,
      allSettings: JSON.stringify(zaloSettings)
    });

    return res.redirect(zaloAuthUrl);
  } catch (error) {
    console.error('=== ZALO LOGIN ERROR ===');
    console.error('Error details:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return res.status(500).json({
      success: false,
      error: 'Failed to initiate Zalo OAuth'
    });
  }
});

// Zalo OAuth callback - handle response from Zalo
router.get('/callback', async (req: Request, res: Response) => {
  console.log('=== Zalo OAuth Callback Received ===');
  console.log('Query params:', req.query);
  console.log('Headers:', req.headers);
  
  try {
    const { code, state } = req.query;

    if (!code) {
      console.error('Zalo OAuth callback missing code:', req.query);
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Lỗi OAuth</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin-top: 100px; }
            .error { color: red; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>❌ Lỗi OAuth</h2>
            <p>Thiếu mã xác thực từ Zalo</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'ZALO_LOGIN_ERROR',
                message: 'Thiếu mã xác thực từ Zalo'
              }, window.location.origin);
              window.close();
            }
          </script>
        </body>
        </html>
      `);
    }

    // Decode state to get code_verifier
    let stateData;
    try {
      console.log('Decoding state parameter:', state);
      stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
      console.log('Decoded state data:', stateData);
    } catch (error) {
      console.error('Invalid state parameter:', error, 'Raw state:', state);
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Lỗi State</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin-top: 100px; }
            .error { color: red; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>❌ Lỗi State Parameter</h2>
            <p>Tham số state không hợp lệ</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'ZALO_LOGIN_ERROR',
                message: 'Tham số state không hợp lệ'
              }, window.location.origin);
              window.close();
            }
          </script>
        </body>
        </html>
      `);
    }

    // Get Zalo OAuth settings
    console.log('Fetching Zalo settings for callback...');
    const zaloSettings = await storage.getSettingsByCategory('zalo_oauth');
    console.log('Callback settings retrieved:', { 
      hasAppId: !!zaloSettings.zaloAppId,
      hasAppSecret: !!zaloSettings.zaloAppSecret,
      enabled: zaloSettings.enableZaloOAuth 
    });
    const zaloAppId = zaloSettings.zaloAppId;
    const zaloAppSecret = zaloSettings.zaloAppSecret;

    if (!zaloAppId || !zaloAppSecret) {
      console.error('=== ZALO CONFIG MISSING ===');
      console.error('App ID present:', !!zaloAppId);
      console.error('App Secret present:', !!zaloAppSecret);
      console.error('Full settings object:', zaloSettings);
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Lỗi Config</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin-top: 100px; }
            .error { color: red; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>❌ Lỗi Config Zalo</h2>
            <p>App ID hoặc App Secret không được cấu hình</p>
            <p>App ID: ${zaloAppId ? 'OK' : 'MISSING'}</p>
            <p>App Secret: ${zaloAppSecret ? 'OK' : 'MISSING'}</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'ZALO_LOGIN_ERROR',
                message: 'Zalo OAuth chưa được cấu hình đầy đủ'
              }, window.location.origin);
              window.close();
            }
          </script>
        </body>
        </html>
      `);
    }

    console.log('Processing Zalo OAuth callback:', {
      code: typeof code,
      state,
      appId: zaloAppId,
      codeVerifier: stateData.codeVerifier ? '[PROVIDED]' : '[MISSING]'
    });

    // Exchange code for access token with PKCE
    console.log('Making token request to Zalo...');
    const tokenRequestBody = {
      app_id: zaloAppId,
      grant_type: 'authorization_code',
      code: code as string,
      code_verifier: stateData.codeVerifier
    };
    console.log('Token request body:', { ...tokenRequestBody, code_verifier: '[REDACTED]' });
    
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
        
        // Check if user already exists with this temp ID
        let user = await db.select()
          .from(schema.users)
          .where(eq(schema.users.zaloId, tempZaloId))
          .limit(1);

        if (user.length === 0) {
          // Create new user with minimal info
          const username = `zalo_${tempZaloId}`;
          const fullName = `Zalo User`;

          const [newUser] = await db.insert(schema.users).values({
            username,
            fullName,
            zaloId: tempZaloId,
            avatar: null,
            email: `${username}@zalo.temp`, // Temporary email for constraint
            password: `zalo_temp_${crypto.randomBytes(8).toString('hex')}`, // Temporary password
            role: 'user',
            credits: 50,
            language: 'vi',
            isVerified: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }).returning();

          user = [newUser];
          console.log('Created new temp Zalo user due to IP restriction:', {
            id: newUser.id,
            username: newUser.username,
            zaloId: newUser.zaloId
          });
        }

        // Set session and continue
        req.login(user[0], (err) => {
          if (err) {
            console.error('Error setting session for temp user:', err);
            return res.redirect('/?error=session_failed');
          }

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
                  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
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
                <h2>✅ Đăng nhập Zalo thành công!</h2>
                <p>Chào mừng <strong>${user[0].fullName}</strong> đến với hệ thống!</p>
                <p>Tài khoản: <code>${user[0].username}</code></p>
                <p>Credits: <strong>${user[0].credits}</strong></p>
                <p><small>⚠️ Lưu ý: Do IP server không ở Việt Nam, thông tin cá nhân từ Zalo bị hạn chế. Bạn có thể cập nhật thông tin cá nhân trong phần cài đặt tài khoản.</small></p>
              </div>
              <script>
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'ZALO_LOGIN_SUCCESS',
                    user: ${JSON.stringify({
                      id: user[0].id,
                      username: user[0].username,
                      fullName: user[0].fullName
                    })}
                  }, window.location.origin);
                  window.close();
                } else {
                  setTimeout(() => {
                    window.location.href = '/dashboard';
                  }, 2000);
                }
              </script>
            </body>
            </html>
          `);
        });
        return;
      }
      
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
        email: `${username}@zalo.user`, // Temporary email for normal Zalo users
        password: `zalo_user_${crypto.randomBytes(8).toString('hex')}`, // Temporary password
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
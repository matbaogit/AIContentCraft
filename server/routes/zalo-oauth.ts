import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import crypto from 'crypto';

const router = Router();

// Global session storage for OAuth states (in production, use Redis or database)
declare global {
  var zaloOAuthSessions: { [key: string]: { codeVerifier: string; timestamp: number } } | undefined;
}

// Test endpoint
router.get('/test', (req: Request, res: Response) => {
  console.log('=== ZALO OAUTH TEST ===');
  res.json({ 
    success: true, 
    message: 'Zalo OAuth router is working!',
    timestamp: new Date().toISOString()
  });
});

// Login endpoint - initiates OAuth flow
router.get('/login', async (req: Request, res: Response) => {
  console.log('=== ZALO OAUTH LOGIN START ===');
  
  try {
    // Get Zalo settings from admin panel
    const settings = await storage.getSettingsByCategory('zalo_oauth');
    
    console.log('Zalo OAuth settings check:', {
      hasAppId: !!settings.zaloAppId,
      hasSecret: !!settings.zaloAppSecret,
      enabled: settings.enableZaloOAuth
    });
    
    // Validate configuration
    if (!settings.zaloAppId || !settings.zaloAppSecret) {
      return res.status(400).json({
        success: false,
        error: 'Zalo OAuth chưa được cấu hình. Vui lòng liên hệ admin.'
      });
    }
    
    if (settings.enableZaloOAuth !== 'true') {
      return res.status(400).json({
        success: false,
        error: 'Tính năng đăng nhập Zalo hiện đang tạm khóa.'
      });
    }
    
    // Generate PKCE parameters for security
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    
    // Generate state parameter for CSRF protection
    const state = crypto.randomBytes(16).toString('hex');
    
    // Store session data temporarily
    global.zaloOAuthSessions = global.zaloOAuthSessions || {};
    global.zaloOAuthSessions[state] = {
      codeVerifier,
      timestamp: Date.now()
    };
    
    // Build redirect URI based on environment
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://toolbox.vn' 
      : 'http://localhost:5000';
    const redirectUri = `${baseUrl}/api/zalo-oauth/callback`;
    
    // Build Zalo authorization URL
    const authUrl = new URL('https://oauth.zaloapp.com/v4/permission');
    authUrl.searchParams.set('app_id', settings.zaloAppId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('state', state);
    
    console.log('Redirecting to Zalo OAuth:', authUrl.toString());
    console.log('Redirect URI:', redirectUri);
    
    // Redirect user to Zalo for authorization
    res.redirect(authUrl.toString());
    
  } catch (error) {
    console.error('Zalo OAuth login error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khởi tạo đăng nhập Zalo. Vui lòng thử lại.'
    });
  }
});

// Callback endpoint - handles OAuth response from Zalo
router.get('/callback', async (req: Request, res: Response) => {
  console.log('=== ZALO OAUTH CALLBACK ===');
  console.log('Query parameters:', req.query);
  
  try {
    const { code, state } = req.query;
    
    // Validate required parameters
    if (!code || !state) {
      console.log('Missing required parameters:', { 
        hasCode: !!code, 
        hasState: !!state 
      });
      
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Lỗi đăng nhập Zalo</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #e74c3c;">❌ Lỗi đăng nhập</h1>
          <p>Thiếu thông tin xác thực từ Zalo. Vui lòng thử lại.</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'ZALO_LOGIN_ERROR',
                message: 'Thiếu thông tin xác thực từ Zalo'
              }, '*');
              window.close();
            }
          </script>
        </body>
        </html>
      `);
    }
    
    // Verify state parameter (CSRF protection)
    const sessionData = global.zaloOAuthSessions?.[state as string];
    if (!sessionData) {
      console.log('Invalid or expired state parameter:', state);
      
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Lỗi bảo mật</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #e74c3c;">❌ Lỗi bảo mật</h1>
          <p>Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'ZALO_LOGIN_ERROR',
                message: 'Phiên đăng nhập không hợp lệ'
              }, '*');
              window.close();
            }
          </script>
        </body>
        </html>
      `);
    }
    
    // Clean up session data
    delete global.zaloOAuthSessions[state as string];
    
    // Get Zalo settings
    const settings = await storage.getSettingsByCategory('zalo_oauth');
    
    // Exchange authorization code for access token
    console.log('Exchanging authorization code for access token...');
    
    const tokenResponse = await fetch('https://oauth.zaloapp.com/v4/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'secret_key': settings.zaloAppSecret
      },
      body: new URLSearchParams({
        app_id: settings.zaloAppId,
        grant_type: 'authorization_code',
        code: code as string,
        code_verifier: sessionData.codeVerifier
      })
    });
    
    const tokenData = await tokenResponse.json();
    console.log('Token exchange response:', tokenData);
    
    if (!tokenData.access_token) {
      console.log('Failed to obtain access token:', tokenData);
      
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Lỗi xác thực</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #e74c3c;">❌ Lỗi xác thực</h1>
          <p>Không thể lấy thông tin xác thực từ Zalo. Vui lòng thử lại.</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'ZALO_LOGIN_ERROR',
                message: 'Không thể lấy thông tin xác thực từ Zalo'
              }, '*');
              window.close();
            }
          </script>
        </body>
        </html>
      `);
    }
    
    // Get user information from Zalo
    console.log('Fetching user information from Zalo...');
    
    const userResponse = await fetch('https://graph.zalo.me/v2.0/me?fields=id,name,picture', {
      headers: {
        'access_token': tokenData.access_token
      }
    });
    
    const zaloUser = await userResponse.json();
    console.log('Zalo user information:', zaloUser);
    
    if (!zaloUser.id) {
      console.log('Failed to fetch user information:', zaloUser);
      
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Lỗi thông tin</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #e74c3c;">❌ Lỗi thông tin</h1>
          <p>Không thể lấy thông tin người dùng từ Zalo. Vui lòng thử lại.</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'ZALO_LOGIN_ERROR',
                message: 'Không thể lấy thông tin người dùng từ Zalo'
              }, '*');
              window.close();
            }
          </script>
        </body>
        </html>
      `);
    }
    
    // SUCCESS: OAuth flow completed successfully
    console.log('Zalo OAuth completed successfully for user:', zaloUser.id);
    
    // TODO: In real implementation, you would:
    // 1. Check if user exists in database by zaloId
    // 2. Create new user or update existing user
    // 3. Create login session
    // 4. Generate authentication token
    
    // For now, return success page with user data
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Đăng nhập thành công</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container { background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; }
          h1 { margin-bottom: 20px; }
          .user-info { background: rgba(255,255,255,0.2); padding: 20px; border-radius: 10px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ Đăng nhập Zalo thành công!</h1>
          <div class="user-info">
            <p><strong>Zalo ID:</strong> ${zaloUser.id}</p>
            <p><strong>Tên:</strong> ${zaloUser.name || 'Chưa cung cấp'}</p>
            ${zaloUser.picture?.data?.url ? `<img src="${zaloUser.picture.data.url}" alt="Avatar" style="width: 80px; height: 80px; border-radius: 50%; margin: 10px;">` : ''}
          </div>
          <p style="opacity: 0.8;">Cửa sổ này sẽ tự động đóng...</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'ZALO_LOGIN_SUCCESS',
              user: {
                zaloId: '${zaloUser.id}',
                name: '${zaloUser.name || 'Zalo User'}',
                picture: '${zaloUser.picture?.data?.url || ''}'
              }
            }, '*');
            
            // Close window after 3 seconds
            setTimeout(() => {
              window.close();
            }, 3000);
          }
        </script>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Zalo OAuth callback error:', error);
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Lỗi hệ thống</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #e74c3c;">❌ Lỗi hệ thống</h1>
        <p>Có lỗi xảy ra trong quá trình xử lý đăng nhập. Vui lòng thử lại sau.</p>
        <script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'ZALO_LOGIN_ERROR',
              message: 'Lỗi hệ thống trong quá trình xử lý đăng nhập'
            }, '*');
            window.close();
          }
        </script>
      </body>
      </html>
    `);
  }
});

export default router;
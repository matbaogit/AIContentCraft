import { Router, Request, Response } from 'express';
import { db } from '../../db';
import * as schema from '@shared/schema';
import { eq } from 'drizzle-orm';
import { storage } from '../storage';
import crypto from 'crypto';

const router = Router();

// Test endpoint
router.get('/test', (req: Request, res: Response) => {
  console.log('=== ZALO AUTH TEST ENDPOINT ===');
  res.json({ 
    success: true, 
    message: 'Zalo auth router working!',
    timestamp: new Date().toISOString()
  });
});

// Login endpoint 
router.get('/login', async (req: Request, res: Response) => {
  console.log('=== ZALO LOGIN START ===');
  
  try {
    // Get Zalo settings
    const settings = await storage.getSettingsByCategory('zalo_oauth');
    console.log('Zalo settings:', { 
      hasAppId: !!settings.zaloAppId,
      hasSecret: !!settings.zaloAppSecret,
      enabled: settings.enableZaloOAuth 
    });
    
    if (!settings.zaloAppId || !settings.zaloAppSecret) {
      return res.status(400).json({
        success: false,
        error: 'Zalo OAuth chưa được cấu hình'
      });
    }
    
    if (settings.enableZaloOAuth !== 'true') {
      return res.status(400).json({
        success: false,
        error: 'Zalo OAuth đã bị tắt'
      });
    }
    
    // Generate PKCE parameters
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    
    // Generate state
    const state = crypto.randomBytes(16).toString('hex');
    
    // Store state and code verifier (simple in-memory storage for now)
    global.zaloOAuthSessions = global.zaloOAuthSessions || {};
    global.zaloOAuthSessions[state] = {
      codeVerifier,
      timestamp: Date.now()
    };
    
    // Build authorization URL
    const baseUrl = process.env.NODE_ENV === 'production' ? 'https://toolbox.vn' : 'http://localhost:5000';
    const redirectUri = `${baseUrl}/api/auth/zalo/callback`;
    
    const authUrl = new URL('https://oauth.zaloapp.com/v4/permission');
    authUrl.searchParams.set('app_id', settings.zaloAppId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('state', state);
    
    console.log('Redirecting to Zalo with URL:', authUrl.toString());
    
    res.redirect(authUrl.toString());
    
  } catch (error) {
    console.error('Zalo login error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khởi tạo Zalo OAuth'
    });
  }
});

// Callback endpoint
router.get('/callback', async (req: Request, res: Response) => {
  console.log('=== ZALO CALLBACK START ===');
  console.log('Query params:', req.query);
  
  try {
    const { code, state } = req.query;
    
    if (!code) {
      console.log('No code parameter in callback');
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Lỗi Zalo</title><meta charset="utf-8"></head>
        <body>
          <h1>❌ Thiếu mã xác thực từ Zalo</h1>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'ZALO_LOGIN_ERROR',
                message: 'Thiếu mã xác thực từ Zalo'
              }, '*');
              window.close();
            }
          </script>
        </body>
        </html>
      `);
    }
    
    if (!state) {
      console.log('No state parameter in callback');
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Lỗi Zalo</title><meta charset="utf-8"></head>
        <body>
          <h1>❌ Thiếu state parameter</h1>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'ZALO_LOGIN_ERROR',
                message: 'Thiếu state parameter'
              }, '*');
              window.close();
            }
          </script>
        </body>
        </html>
      `);
    }
    
    // Verify state and get code verifier
    const sessionData = global.zaloOAuthSessions?.[state as string];
    if (!sessionData) {
      console.log('Invalid state parameter:', state);
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Lỗi Zalo</title><meta charset="utf-8"></head>
        <body>
          <h1>❌ State parameter không hợp lệ</h1>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'ZALO_LOGIN_ERROR',
                message: 'State parameter không hợp lệ'
              }, '*');
              window.close();
            }
          </script>
        </body>
        </html>
      `);
    }
    
    // Clean up session
    delete global.zaloOAuthSessions[state as string];
    
    // Get Zalo settings
    const settings = await storage.getSettingsByCategory('zalo_oauth');
    
    // Exchange code for token
    console.log('Exchanging code for token...');
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
    console.log('Token response:', tokenData);
    
    if (!tokenData.access_token) {
      console.log('Failed to get access token:', tokenData);
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Lỗi Zalo</title><meta charset="utf-8"></head>
        <body>
          <h1>❌ Không lấy được access token</h1>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'ZALO_LOGIN_ERROR',
                message: 'Không lấy được access token từ Zalo'
              }, '*');
              window.close();
            }
          </script>
        </body>
        </html>
      `);
    }
    
    // Get user info
    console.log('Getting user info...');
    const userResponse = await fetch('https://graph.zalo.me/v2.0/me?fields=id,name,picture', {
      headers: {
        'access_token': tokenData.access_token
      }
    });
    
    const zaloUser = await userResponse.json();
    console.log('Zalo user info:', zaloUser);
    
    if (!zaloUser.id) {
      console.log('Failed to get user info:', zaloUser);
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Lỗi Zalo</title><meta charset="utf-8"></head>
        <body>
          <h1>❌ Không lấy được thông tin user</h1>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'ZALO_LOGIN_ERROR',
                message: 'Không lấy được thông tin user từ Zalo'
              }, '*');
              window.close();
            }
          </script>
        </body>
        </html>
      `);
    }
    
    // Success - for now just return success message
    console.log('Zalo OAuth success for user:', zaloUser.id);
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Đăng nhập thành công</title><meta charset="utf-8"></head>
      <body>
        <h1>✅ Đăng nhập Zalo thành công!</h1>
        <p>User ID: ${zaloUser.id}</p>
        <p>Tên: ${zaloUser.name || 'N/A'}</p>
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
            window.close();
          }
        </script>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Zalo callback error:', error);
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Lỗi Zalo</title><meta charset="utf-8"></head>
      <body>
        <h1>❌ Lỗi xử lý callback</h1>
        <script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'ZALO_LOGIN_ERROR',
              message: 'Lỗi xử lý OAuth callback'
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
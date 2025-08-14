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

    // Build Zalo OAuth URL - use the exact domain from request if available
    const baseUrl = process.env.APP_BASE_URL || 
                   (req.get('host') && req.get('host').includes('localhost') ? 
                    `${req.protocol}://${req.get('host')}` : 
                    'https://toolbox.vn');
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
      redirectUri,
      encodedRedirectUri: encodeURIComponent(redirectUri),
      codeChallenge,
      fullUrl: zaloAuthUrl,
      state
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

    // Set session and redirect
    req.login(user[0], (err) => {
      if (err) {
        console.error('Error setting user session after Zalo OAuth:', err);
        return res.redirect('/?error=session_failed');
      }

      console.log('Zalo OAuth login successful:', {
        userId: user[0].id,
        username: user[0].username
      });

      // Redirect to dashboard or intended page
      return res.redirect('/dashboard');
    });

  } catch (error) {
    console.error('Error in Zalo OAuth callback:', error);
    return res.redirect('/?error=zalo_oauth_error');
  }
});

export default router;
import type { Express, Request, Response } from "express";
import { db } from "../../db";
import { users, systemSettings } from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

// Extend session interface for Zalo auth
declare module 'express-session' {
  interface SessionData {
    zaloCodeVerifier?: string;
    zaloState?: string;
    userId?: number;
    isAuthenticated?: boolean;
  }
}

// Generate random string for PKCE
function generateRandomString(length: number = 64): string {
  return crypto.randomBytes(length / 2).toString('hex');
}

// Generate code challenge for PKCE
function generateCodeChallenge(codeVerifier: string): string {
  return crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Get Zalo settings from database
async function getZaloSettings() {
  const settings = await db.select().from(systemSettings).where(
    eq(systemSettings.key, 'zaloAppId')
  );
  
  const appIdSetting = settings.find(s => s.key === 'zaloAppId');
  const appSecretSetting = await db.select().from(systemSettings).where(
    eq(systemSettings.key, 'zaloAppSecret')
  ).then(res => res[0]);
  
  if (!appIdSetting?.value || !appSecretSetting?.value) {
    throw new Error('Zalo credentials not configured');
  }
  
  return {
    appId: appIdSetting.value,
    appSecret: appSecretSetting.value,
    redirectUri: 'https://toolbox.vn/auth/zalo/callback'
  };
}

// Generate username from Zalo ID
function generateUsernameFromZaloId(zaloId: string, name: string): string {
  // Create username from zaloId with fallback to user-{zaloId}
  const cleanName = name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  return cleanName ? `${cleanName}_${zaloId.slice(-4)}` : `user_${zaloId}`;
}

export function setupZaloAuth(app: Express) {
  // Zalo login redirect
  app.get('/auth/zalo', async (req: Request, res: Response) => {
    try {
      const { appId, redirectUri } = await getZaloSettings();
      
      // Generate PKCE parameters
      const codeVerifier = generateRandomString(64);
      const codeChallenge = generateCodeChallenge(codeVerifier);
      const state = generateRandomString(16);
      
      // Store in session
      req.session.zaloCodeVerifier = codeVerifier;
      req.session.zaloState = state;
      
      // Build Zalo OAuth URL
      const authUrl = new URL('https://oauth.zaloapp.com/v4/permission');
      authUrl.searchParams.set('app_id', appId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('state', state);
      
      console.log('Redirecting to Zalo OAuth:', authUrl.toString());
      res.redirect(authUrl.toString());
    } catch (error) {
      console.error('Zalo auth redirect error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to initiate Zalo authentication' 
      });
    }
  });

  // Zalo callback handler
  app.get('/auth/zalo/callback', async (req: Request, res: Response) => {
    try {
      const { code, state } = req.query;
      
      // Validate state parameter
      if (!code || !state || state !== req.session.zaloState) {
        throw new Error('Invalid state parameter or missing code');
      }
      
      const { appId, appSecret } = await getZaloSettings();
      const codeVerifier = req.session.zaloCodeVerifier;
      
      if (!codeVerifier) {
        throw new Error('Missing code verifier in session');
      }
      
      // Exchange code for access token
      const tokenResponse = await fetch('https://oauth.zaloapp.com/v4/access_token', {
        method: 'POST',
        headers: {
          'secret_key': appSecret,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          app_id: appId,
          grant_type: 'authorization_code',
          code: code as string,
          code_verifier: codeVerifier
        })
      });
      
      const tokenData = await tokenResponse.json();
      
      if (!tokenData.access_token) {
        console.error('Token exchange failed:', tokenData);
        throw new Error('Failed to get access token from Zalo');
      }
      
      // Get user info from Zalo
      const userResponse = await fetch('https://graph.zalo.me/v2.0/me?fields=id,name,picture', {
        headers: {
          'access_token': tokenData.access_token
        }
      });
      
      const zaloUser = await userResponse.json();
      
      if (!zaloUser.id) {
        console.error('Failed to get user info:', zaloUser);
        throw new Error('Failed to get user information from Zalo');
      }
      
      console.log('Zalo user data:', zaloUser);
      
      // Check if user already exists with this Zalo ID
      let user = await db.select().from(users).where(eq(users.zaloId, zaloUser.id)).then(res => res[0]);
      
      if (!user) {
        // Create new user with Zalo data
        const username = generateUsernameFromZaloId(zaloUser.id, zaloUser.name || '');
        const avatar = zaloUser.picture?.data?.url || null;
        
        // Get default credits from settings
        const defaultCredits = await db.select()
          .from(systemSettings)
          .where(eq(systemSettings.key, 'defaultUserCredits'))
          .then(res => parseInt(res[0]?.value || '50'));
        
        const [newUser] = await db.insert(users).values({
          username,
          email: null, // No email from Zalo
          password: null, // No password for Zalo users
          fullName: zaloUser.name || username,
          zaloId: zaloUser.id,
          avatar,
          credits: defaultCredits,
          isVerified: true, // Zalo users are auto-verified
          language: 'vi'
        }).returning();
        
        user = newUser;
        console.log('Created new Zalo user:', user.id);
      } else {
        // Update existing user's avatar if changed
        if (zaloUser.picture?.data?.url && zaloUser.picture.data.url !== user.avatar) {
          await db.update(users)
            .set({ 
              avatar: zaloUser.picture.data.url,
              updatedAt: new Date()
            })
            .where(eq(users.id, user.id));
        }
        console.log('Existing Zalo user logged in:', user.id);
      }
      
      // Set up session
      req.session.userId = user.id;
      req.session.isAuthenticated = true;
      
      // Clean up Zalo session data
      delete req.session.zaloCodeVerifier;
      delete req.session.zaloState;
      
      // Redirect to dashboard
      res.redirect('/dashboard');
      
    } catch (error) {
      console.error('Zalo callback error:', error);
      // Redirect to login with error
      res.redirect('/auth?error=zalo_auth_failed');
    }
  });
}
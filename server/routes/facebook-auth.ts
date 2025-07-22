import { Request, Response } from 'express';

// Facebook OAuth configuration
const FACEBOOK_APP_ID = '665827136508049';
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || '';
const FACEBOOK_REDIRECT_URI = process.env.REPLIT_DOMAINS ? 
  `https://${process.env.REPLIT_DOMAINS.split(',')[0]}/api/auth/facebook/callback` : 
  'http://localhost:5000/api/auth/facebook/callback';

export function setupFacebookAuth(app: any) {
  // Start Facebook OAuth flow
  app.get('/api/auth/facebook', (req: Request, res: Response) => {
    const state = req.query.redirect || 'social-connections';
    const scopes = 'public_profile,email';
    
    const facebookAuthUrl = `https://www.facebook.com/v21.0/dialog/oauth?` +
      `client_id=${FACEBOOK_APP_ID}&` +
      `redirect_uri=${encodeURIComponent(FACEBOOK_REDIRECT_URI)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `state=${encodeURIComponent(state as string)}&` +
      `response_type=code`;

    res.redirect(facebookAuthUrl);
  });

  // Handle Facebook OAuth callback
  app.get('/api/auth/facebook/callback', async (req: Request, res: Response) => {
    const { code, state, error } = req.query;

    if (error) {
      console.error('Facebook OAuth error:', error);
      return res.redirect(`/dashboard/social-connections?error=facebook_oauth_failed`);
    }

    if (!code) {
      return res.redirect(`/dashboard/social-connections?error=no_code_received`);
    }

    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://graph.facebook.com/v21.0/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: FACEBOOK_APP_ID,
          client_secret: FACEBOOK_APP_SECRET,
          redirect_uri: FACEBOOK_REDIRECT_URI,
          code: code as string,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenData.access_token) {
        console.error('No access token received:', tokenData);
        return res.redirect(`/dashboard/social-connections?error=no_access_token`);
      }

      // Get user info
      const userResponse = await fetch(`https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${tokenData.access_token}`);
      const userData = await userResponse.json();

      if (!userData.id) {
        console.error('No user data received:', userData);
        return res.redirect(`/dashboard/social-connections?error=no_user_data`);
      }

      // Get user's pages
      const pagesResponse = await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token&access_token=${tokenData.access_token}`);
      const pagesData = await pagesResponse.json();

      // For now, redirect with success - in a real implementation, you would save to database
      const redirectPath = state === 'social-connections' ? '/dashboard/social-connections' : `/${state}`;
      res.redirect(`${redirectPath}?success=facebook_connected&user_id=${userData.id}&user_name=${encodeURIComponent(userData.name)}&pages=${pagesData.data?.length || 0}`);

    } catch (error) {
      console.error('Facebook OAuth callback error:', error);
      res.redirect(`/dashboard/social-connections?error=oauth_callback_failed`);
    }
  });
}
import { Router } from 'express';

const router = Router();

// Alternative callback route for testing
router.get('/callback-redirect', async (req, res) => {
  console.log('=== ZALO ALTERNATIVE CALLBACK ===');
  console.log('Query params:', req.query);
  console.log('Full URL:', req.url);
  
  try {
    // Extract OAuth parameters from URL
    const { code, state, error } = req.query;
    
    if (error) {
      console.error('OAuth error received:', error);
      return res.redirect(`/?error=zalo_oauth_error&details=${encodeURIComponent(error as string)}`);
    }

    if (!code) {
      console.error('No authorization code received');
      return res.redirect('/?error=zalo_no_code');
    }

    // Redirect to main callback handler
    let redirectUrl = '/api/auth/zalo/callback?';
    if (code) redirectUrl += 'code=' + encodeURIComponent(code as string) + '&';
    if (state) redirectUrl += 'state=' + encodeURIComponent(state as string) + '&';
    
    // Remove trailing &
    redirectUrl = redirectUrl.replace(/&$/, '');
    
    console.log('Redirecting to main handler:', redirectUrl);
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('Error in alternative callback:', error);
    res.redirect('/?error=zalo_callback_error');
  }
});

export default router;
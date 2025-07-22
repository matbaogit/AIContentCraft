# Facebook Developer Setup Guide

## 1. Tạo Facebook App

### Bước 1: Truy cập Facebook Developers
- Vào https://developers.facebook.com/
- Đăng nhập bằng tài khoản Facebook

### Bước 2: Tạo App mới
```
1. Click "My Apps" → "Create App"
2. Chọn "Consumer" app type
3. Điền thông tin:
   - App Name: "SEO AI Writer"
   - App Contact Email: your-email@domain.com
   - Purpose: Business
```

### Bước 3: Cấu hình Basic Settings
```
Settings → Basic:
- App Domains: yourdomain.com
- Privacy Policy URL: https://yourdomain.com/privacy
- Terms of Service URL: https://yourdomain.com/terms
- App Icon: Upload logo (1024x1024px)
```

## 2. Setup Facebook Login

### Bước 1: Add Facebook Login Product
```
1. Dashboard → Add Product
2. Chọn "Facebook Login" → Set Up
3. Platform: Web
4. Site URL: https://yourdomain.com
```

### Bước 2: Cấu hình OAuth Settings
```
Facebook Login → Settings:

Valid OAuth Redirect URIs:
- https://yourdomain.com/api/auth/facebook/callback
- http://localhost:5000/api/auth/facebook/callback (for development)

Client OAuth Login: Yes
Web OAuth Login: Yes
Enforce HTTPS: Yes (for production)
```

## 3. Setup Pages API (for posting)

### Bước 1: Add Pages API
```
Dashboard → Add Product → "Pages API"
```

### Bước 2: Request Permissions
```
App Review → Permissions and Features:

Basic permissions (available without review):
- public_profile
- email

Advanced permissions (require App Review):
- pages_manage_posts
- pages_read_engagement  
- manage_pages
- pages_show_list
```

## 4. Environment Variables

### Development (.env)
```
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
REPLIT_DOMAINS=localhost:5000
```

### Production
```
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret  
REPLIT_DOMAINS=yourdomain.com
```

## 5. App Review Process

### Before Going Live:
```
1. Complete App Review:
   - Submit app for review
   - Provide use case documentation
   - Record demo video showing functionality

2. Business Verification:
   - Verify business (required for advanced permissions)
   - Provide business documents

3. Privacy Policy:
   - Must have comprehensive privacy policy
   - Explain data collection and usage
```

### Test Users (Development):
```
Roles → Test Users:
- Add test users for development
- Test users can use app without review
```

## 6. Compliance Requirements

### Data Usage Policy:
```
- Only request necessary permissions
- Explain clearly how user data is used
- Implement proper data deletion
- Follow Facebook Platform Terms
```

### Content Guidelines:
```
- No misleading content
- Respect user privacy
- Follow community standards
- Proper error handling
```

## 7. Testing Checklist

### OAuth Flow:
- [ ] Login redirects to Facebook
- [ ] User can authorize app
- [ ] Callback URL receives auth code
- [ ] Access token exchange works
- [ ] User info retrieval successful

### Pages Access:
- [ ] App can list user's pages
- [ ] Page-specific tokens work
- [ ] Posting to pages successful
- [ ] Error handling for failed posts

### Edge Cases:
- [ ] User denies permission
- [ ] Invalid/expired tokens
- [ ] Network timeouts
- [ ] Rate limiting

## 8. Common Issues & Solutions

### CORS Errors:
```javascript
// Server-side OAuth (implemented in project)
app.get('/api/auth/facebook', (req, res) => {
  const facebookAuthUrl = `https://www.facebook.com/v21.0/dialog/oauth?...`;
  res.redirect(facebookAuthUrl);
});
```

### Invalid Redirect URI:
```
- Ensure exact match in Facebook settings
- Include both http/https variants for development
- Check for trailing slashes
```

### Token Expiration:
```javascript
// Implement token refresh logic
if (tokenExpired) {
  const newToken = await refreshFacebookToken(refreshToken);
  // Update stored token
}
```

## 9. Production Deployment

### SSL Certificate:
- Required for OAuth in production
- Use Let's Encrypt or hosting provider SSL

### Domain Verification:
- Verify domain ownership in Facebook
- Add Meta domain verification tag

### Monitoring:
- Set up error logging for OAuth failures
- Monitor API rate limits
- Track successful/failed connections
# Step-by-Step Deployment Guide

## Bước 1: Chuẩn bị Code cho Deploy

### 1.1 Commit Changes hiện tại
```bash
# Check status
git status

# Add all changes  
git add -A

# Commit với message
git commit -m "feat: Complete Facebook OAuth integration

- Added FacebookConnectModal with 3 connection methods
- Implemented server-side OAuth flow  
- Enhanced social connections UX
- Added deployment guides and documentation"

# Push to GitHub
git push origin main
```

## Bước 2: Chọn Hosting Platform (Khuyến nghị: Vercel)

### Option A: Vercel Deployment (Easiest)

#### 2.A.1 Setup Vercel Account
1. Vào https://vercel.com/signup
2. Đăng nhập bằng GitHub account
3. Import repository từ GitHub

#### 2.A.2 Configure Build Settings
```javascript
// vercel.json (tạo file này)
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/client/dist/$1"
    }
  ]
}
```

#### 2.A.3 Environment Variables
```
DATABASE_URL=postgresql://user:password@host:port/database
SESSION_SECRET=your-random-secret-key-here
FACEBOOK_APP_SECRET=your-facebook-app-secret
REPLIT_DOMAINS=your-app-name.vercel.app
```

### Option B: Railway Deployment

#### 2.B.1 Setup Railway
```bash
npm install -g @railway/cli
railway login
railway init
railway add --database postgresql
```

#### 2.B.2 Configure Railway
```bash
# Set environment variables
railway variables set SESSION_SECRET=your-secret
railway variables set FACEBOOK_APP_SECRET=your-secret

# Deploy
railway up
```

## Bước 3: Database Setup

### 3.1 Neon Database (Free PostgreSQL)
1. Tạo account tại https://neon.tech
2. Tạo database mới: "seo-ai-writer"
3. Copy connection string
4. Set DATABASE_URL trong hosting platform

### 3.2 Run Database Migrations
```bash
# Trên hosting platform hoặc local
npm run db:push
npm run db:seed
```

## Bước 4: Facebook App Configuration

### 4.1 Update Facebook App Settings
```
App Settings → Basic:
- App Domains: your-domain.vercel.app
- Site URL: https://your-domain.vercel.app

Facebook Login → Settings:
- Valid OAuth Redirect URIs: 
  https://your-domain.vercel.app/api/auth/facebook/callback
```

### 4.2 Get Facebook App Secret
```
App Settings → Basic → App Secret
Copy và set trong environment variables
```

## Bước 5: Testing Production

### 5.1 Test Core Features
- [ ] User login/register
- [ ] Content creation 
- [ ] Image generation
- [ ] Credit system

### 5.2 Test Facebook Integration  
- [ ] Vào /dashboard/social-connections
- [ ] Tạo Facebook connection
- [ ] Test OAuth flow
- [ ] Verify token handling

## Bước 6: Domain Setup (Optional)

### 6.1 Custom Domain
```bash
# Trong Vercel dashboard
1. Settings → Domains
2. Add your-domain.com
3. Configure DNS records
```

### 6.2 Update Facebook App
```
App Domains: your-domain.com
Redirect URIs: https://your-domain.com/api/auth/facebook/callback
```

## Bước 7: Monitoring & Optimization

### 7.1 Error Monitoring
```javascript
// Add to production
if (process.env.NODE_ENV === 'production') {
  // Setup error tracking (Sentry, LogRocket, etc.)
}
```

### 7.2 Performance Monitoring
- Vercel Analytics tự động
- Monitor database performance
- Check Facebook API rate limits

## Troubleshooting Common Issues

### Build Errors:
```bash
# Check package.json scripts
npm run build  # locally first

# Check Node.js version compatibility
node --version  # Should be 18+ 
```

### Database Connection:
```bash
# Test connection string
psql $DATABASE_URL -c "SELECT version();"
```

### Facebook OAuth Errors:
- Verify redirect URIs match exactly
- Check App Secret is correct
- Ensure HTTPS in production

### Environment Variables:
```bash
# Verify all required vars are set
echo $DATABASE_URL
echo $SESSION_SECRET  
echo $FACEBOOK_APP_SECRET
```

## Quick Deploy Commands

### Vercel (sau khi setup)
```bash
vercel --prod
```

### Railway  
```bash
railway up
```

### Manual VPS
```bash
git pull origin main
npm install
npm run build
pm2 restart seo-app
```

## Success Checklist

- [ ] Code pushed to GitHub
- [ ] Hosting platform connected
- [ ] Database deployed và migrated
- [ ] Environment variables configured  
- [ ] Facebook App settings updated
- [ ] Custom domain setup (if applicable)
- [ ] All features tested in production
- [ ] Error monitoring active

Sau khi hoàn thành, app sẽ có thể truy cập tại URL của hosting platform và Facebook integration sẽ hoạt động hoàn toàn!
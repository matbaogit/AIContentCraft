# Deploy Instructions - Facebook Integration Update

## Current Status
✅ **Facebook Integration Complete** - FacebookConnectModal với 3 phương thức kết nối đã hoàn thành
✅ **Code Ready for Deployment** - Tất cả tính năng đã được test và hoạt động

## Để Push lên Git và Deploy:

### 1. Giải quyết Git Lock Issue
```bash
# Xóa git lock files
rm -f .git/index.lock
rm -f .git/refs/heads/*.lock

# Verify git status
git status
```

### 2. Add và Commit Changes
```bash
# Add all changes
git add -A

# Commit với message mô tả
git commit -m "feat: Complete Facebook OAuth integration with multiple connection methods

- Added FacebookConnectModal with 3 connection options (OAuth, manual, demo)
- Implemented server-side Facebook OAuth flow with callback handling  
- Enhanced social connections page with improved UX
- Fixed Facebook SDK CORS issues through server-side implementation
- Added comprehensive error handling and user guidance"
```

### 3. Push lên Repository
```bash
# Push lên main branch
git push origin main
```

### 4. Environment Variables cần thiết cho Deploy
Đảm bảo hosting environment có các env vars:
```
DATABASE_URL=<postgresql_connection_string>
SESSION_SECRET=<random_session_secret>
FACEBOOK_APP_SECRET=<facebook_app_secret>
REPLIT_DOMAINS=<your_domain.com>
```

### 5. Facebook App Configuration
Khi deploy lên hosting, cập nhật Facebook App Settings:
- **Valid OAuth Redirect URIs**: `https://yourdomain.com/api/auth/facebook/callback`
- **App Domains**: `yourdomain.com`

## Tính năng mới đã được thêm:

### Facebook Integration
- **FacebookConnectModal**: Modal chọn phương thức kết nối
- **OAuth Flow**: Server-side Facebook authentication  
- **Manual Token**: Cho users có sẵn Access Token
- **Demo Page**: Test page tại `/demo/facebook-connect`

### Files mới:
- `client/src/components/facebook/FacebookConnectModal.tsx`
- `server/routes/facebook-auth.ts`
- `client/src/pages/demo/facebook-connect.tsx`

### Files đã cập nhật:
- `client/src/pages/dashboard/social-connections.tsx`
- `server/routes.ts`
- `client/src/App.tsx`

## Test sau khi Deploy:
1. Vào `/dashboard/social-connections`
2. Tạo kết nối mới → chọn Facebook
3. Test các phương thức kết nối khác nhau
4. Verify Facebook OAuth callback hoạt động
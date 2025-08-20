# Zalo Callback URL Debug Guide

## 🔍 Current Issue:
- Error: -14003 "Invalid redirect uri"
- Zalo không nhận ra callback URL đã cấu hình

## 📋 Debugging Steps:

### 1. Kiểm tra URL accessibility:
```bash
curl -I https://toolbox.vn/zalo-callback
```

### 2. Kiểm tra Zalo Developer Console:
- Login: https://developers.zalo.me/
- Vào app: "SEO AI Writer" 
- Tab "Cấu hình" → "URL chuyển hướng"
- Phải có chính xác: `https://toolbox.vn/zalo-callback`

### 3. Common Issues:
- URL phải HTTPS (không HTTP)
- Không được có trailing slash: `/zalo-callback/` 
- Phải match chính xác với domain registered
- App phải ở trạng thái "Live" không phải "Development"

### 4. Alternative Debug Method:
Thử callback URL khác để test:
```
https://toolbox.vn/api/auth/zalo/callback-direct
```

## 🔧 Quick Fix Options:

### Option A: Verify Current Setup
1. Check if `https://toolbox.vn/zalo-callback` returns 200
2. Verify exact URL in Zalo Console matches

### Option B: Use API Route Callback
Change to API endpoint:
```
https://toolbox.vn/api/zalo/callback-redirect
```

### Option C: Test with Development Domain
Temporarily add development domain to test:
```
https://11a56b9f-4269-48a7-b12d-cde3c89de60d-00-28s4cntgjrwsd.riker.replit.dev/zalo-callback
```

## 📞 Next Steps:
1. First check if URL is accessible
2. Verify exact match in Zalo Console
3. Try alternative callback approach if needed
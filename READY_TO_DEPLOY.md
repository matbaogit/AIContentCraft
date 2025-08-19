# 🚨 DEPLOYMENT STATUS & FILE LOCATIONS

## Current Issue Analysis:
Vẫn còn lỗi "Invalid redirect_uri" (-14003) từ Zalo OAuth

## 📂 File Locations for Manual Edit:

### Files trong project (đã sửa):
```
./config.php                    ← Root config file
./api/zalo-proxy/auth.php       ← OAuth initiation endpoint  
./api/auth/zalo/callback.php    ← OAuth callback handler
```

### Files cần upload lên toolbox.vn:
```
toolbox.vn/config.php                    ← Upload file này
toolbox.vn/api/zalo-proxy/auth.php       ← Upload file này
toolbox.vn/api/auth/zalo/callback.php    ← Upload file này
```

## 🔍 Diagnosis Steps:

1. **Test current deployed endpoints**
2. **Check if config.php is correctly deployed**
3. **Verify redirect_uri in actual requests**

## ⚠️ Potential Issues:

1. **Config not uploaded**: toolbox.vn vẫn dùng config cũ
2. **Wrong callback URL in Zalo Console**: Phải là `https://toolbox.vn/api/auth/zalo/callback`
3. **Missing App Secret**: Cần thay `GET_FROM_ZALO_DEVELOPER_CONSOLE`

## 🛠️ Manual Fix Required:

1. **Download files from project**: 
   - config.php
   - api/zalo-proxy/auth.php  
   - api/auth/zalo/callback.php

2. **Upload to toolbox.vn** với đúng structure

3. **Edit config.php on toolbox.vn**:
   Replace `GET_FROM_ZALO_DEVELOPER_CONSOLE` với Zalo App Secret thật

4. **Verify Zalo Developer Console**:
   Callback URL = `https://toolbox.vn/api/auth/zalo/callback`

Ready for manual deployment!
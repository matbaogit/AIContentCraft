# Zalo OAuth Development Setup

## Vấn đề hiện tại
Zalo App ID `4127841001935001267` hiện chỉ được config để chấp nhận callback từ domain `https://toolbox.vn`. Khi test development trên localhost, Zalo sẽ reject callback request.

## Cách khắc phục

### Option 1: Config Zalo App để hỗ trợ localhost (Khuyến nghị)
1. Đăng nhập https://developers.zalo.me/
2. Vào Zalo App ID `4127841001935001267`
3. Thêm callback URL: `http://localhost:5000/api/auth/zalo/callback`
4. Hoặc thêm domain: `localhost:5000`

### Option 2: Test trên toolbox.vn
Hiện tại có thể test trực tiếp trên production domain `https://toolbox.vn`

### Option 3: Tạo Zalo App riêng cho development
1. Tạo Zalo App mới cho development
2. Config callback URL: `http://localhost:5000/api/auth/zalo/callback`
3. Cập nhật App ID/Secret trong admin panel khi development

## Lưu ý kỹ thuật
- Zalo OAuth yêu cầu HTTPS cho production
- Localhost HTTP được cho phép cho development nếu được config đúng
- PKCE (Proof Key for Code Exchange) đã được implement để bảo mật
- Popup approach thay vì redirect để UX tốt hơn

## Trạng thái hiện tại
- ✅ OAuth flow đã implement đầy đủ
- ✅ PKCE security đã có
- ✅ Popup approach đã có
- ✅ Error handling tốt
- ❌ Zalo App chưa config cho localhost

## Để test:
1. Cấu hình Zalo App theo Option 1 ở trên
2. Hoặc test trực tiếp trên https://toolbox.vn
#!/bin/bash

echo "=== Fix Git Secrets Script ==="
echo "Xử lý vấn đề secrets trong git repository..."

# Xóa file lock nếu tồn tại
if [ -f ".git/index.lock" ]; then
    echo "Xóa file lock cũ..."
    rm -f .git/index.lock
fi

# Kiểm tra các file có chứa secrets
echo "Kiểm tra các file có thể chứa secrets..."

# Tạo .gitignore để loại trừ các file nhạy cảm
echo "Cập nhật .gitignore..."
cat >> .gitignore << 'EOF'

# Environment files
.env
.env.local
.env.development
.env.test
.env.production

# API Keys and secrets
*.key
*.pem
secrets/
config/secrets.json
EOF

# Xóa .env khỏi git tracking nếu có
echo "Xóa .env khỏi git tracking..."
git rm --cached .env 2>/dev/null || echo ".env không có trong git tracking"

# Xóa các file khác có thể chứa secrets
git rm --cached cookies.txt 2>/dev/null || echo "cookies.txt không có trong git tracking"

# Thêm tất cả thay đổi (trừ những file đã loại trừ)
echo "Thêm thay đổi vào staging..."
git add .

# Commit
echo "Commit thay đổi với .gitignore updated..."
git commit -m "Update .gitignore to exclude sensitive files and remove secrets from tracking"

# Kiểm tra xem có secrets nào còn trong staging không
echo "Kiểm tra secrets trong staging area..."
git diff --cached --name-only

echo "=== Hoàn tất chuẩn bị ==="
echo "Bây giờ bạn có thể thử push lại với: git push origin main"
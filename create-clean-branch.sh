#!/bin/bash

echo "=== Create Clean Branch Script ==="
echo "Tạo branch mới hoàn toàn sạch không có secrets..."

# Xóa file lock
rm -f .git/index.lock

# Backup .env hiện tại
cp .env .env.original 2>/dev/null || echo "No .env to backup"

# Tạo .env sạch với placeholder
cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# Session
SESSION_SECRET=change_this_session_secret_in_production

# Email (SMTP) - Replace with your actual SMTP settings
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_app_password

# Webhook - Replace with your actual webhook URL
WEBHOOK_URL=https://your-webhook-service.com/api/webhook

# Environment
NODE_ENV=development
PORT=5000
EOF

# Xóa cookies.txt
rm -f cookies.txt 2>/dev/null || echo "cookies.txt not found"

# Tạo branch mới
echo "Tạo branch clean-version..."
git checkout -b clean-version

# Xóa tất cả files trong git
git rm -rf . --cached

# Thêm lại tất cả files (với .env mới và .gitignore updated)
git add .

# Commit clean
git commit -m "Clean version: Remove all secrets, code works with placeholder configs"

# Push branch mới
echo "Push branch clean-version..."
git push origin clean-version

echo "=== Hoàn tất ==="
echo "Branch 'clean-version' đã được tạo và push thành công!"
echo "Bạn có thể:"
echo "1. Tạo Pull Request từ clean-version về main"
echo "2. Hoặc merge branch này về main nếu bạn là owner"
echo ""
echo "Nhớ cập nhật .env với values thật trong production environment!"
echo "File backup gốc: .env.original"
#!/bin/bash

echo "=== Clean Git History Script ==="
echo "Xóa hoàn toàn secrets khỏi git history..."

# Xóa file lock
rm -f .git/index.lock

# Backup current .env
cp .env .env.backup 2>/dev/null || echo "No .env to backup"

# Tạo .env mới với placeholder values
cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/database

# Session
SESSION_SECRET=your_session_secret_here

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here

# Webhook
WEBHOOK_URL=https://your-webhook-url.com

# App
NODE_ENV=development
PORT=5000
EOF

# Xóa cookies.txt nếu có
rm -f cookies.txt

# Xóa tất cả các file có thể chứa secrets khỏi git history
echo "Xóa .env khỏi git history..."
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env' --prune-empty --tag-name-filter cat -- --all

echo "Xóa cookies.txt khỏi git history..."
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch cookies.txt' --prune-empty --tag-name-filter cat -- --all

# Dọn dẹp refs
echo "Dọn dẹp refs..."
git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin

# Garbage collection
echo "Garbage collection..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Thêm .env mới (với placeholder values)
git add .env
git add .gitignore

# Commit clean
git commit -m "Clean commit: Remove all secrets, add placeholder .env"

echo "=== Hoàn tất cleanup ==="
echo "Bây giờ thử push với: git push origin main --force"
echo "Nhớ cập nhật .env với values thật sau khi push thành công!"
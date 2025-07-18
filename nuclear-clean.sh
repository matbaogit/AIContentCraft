#!/bin/bash

echo "=== NUCLEAR CLEAN: Tạo repository hoàn toàn mới ==="
echo "CẢNH BÁO: Script này sẽ xóa toàn bộ git history!"
echo "Nhấn Enter để tiếp tục hoặc Ctrl+C để hủy..."
read -r

# Backup .env hiện tại
cp .env .env.backup 2>/dev/null || echo "No .env to backup"

# Xóa hoàn toàn .git folder
echo "Xóa toàn bộ git history..."
rm -rf .git

# Tạo .env sạch
echo "Tạo .env sạch..."
cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://username:password@host:5432/database_name

# Session Secret
SESSION_SECRET=your_session_secret_key_here

# SMTP Configuration  
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here

# Webhook URL
WEBHOOK_URL=https://your-webhook-service.com/api/endpoint

# Application Settings
NODE_ENV=development
PORT=5000
REPLIT_DOMAINS=your-repl-domain.replit.app
EOF

# Xóa các file có thể chứa secrets
rm -f cookies.txt
rm -f .env.backup

# Khởi tạo git mới
echo "Khởi tạo git repository mới..."
git init

# Cấu hình git
git config user.name "Developer"
git config user.email "developer@example.com"

# Thêm tất cả files
echo "Thêm tất cả files vào git..."
git add .

# Commit đầu tiên
echo "Tạo commit đầu tiên..."
git commit -m "Initial commit: SEO AI Writer application with clean configuration"

echo "=== HOÀN TẤT ==="
echo "Git repository đã được tạo lại hoàn toàn sạch!"
echo ""
echo "Bước tiếp theo:"
echo "1. Thêm remote origin: git remote add origin https://github.com/username/repo.git"
echo "2. Push lên GitHub: git push -u origin main"
echo ""
echo "Sau khi push thành công, nhớ cập nhật .env với values thật!"
echo "File backup: .env.backup (nếu có)"
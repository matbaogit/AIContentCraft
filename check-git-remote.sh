#!/bin/bash

echo "=== Kiểm tra Git Remote ==="
echo "Remote URLs hiện tại:"
git remote -v

echo ""
echo "Branch hiện tại:"
git branch

echo ""
echo "Commit gần nhất:"
git log --oneline -n 5

echo ""
echo "=== Hướng dẫn push an toàn ==="
echo "Nếu bạn muốn tạo repository mới hoàn toàn:"
echo "1. Chạy: ./nuclear-clean.sh"
echo "2. Thêm remote mới: git remote add origin https://github.com/username/new-repo.git"
echo "3. Push: git push -u origin main"
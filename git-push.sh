#!/bin/bash

echo "=== Git Push Script ==="
echo "Bắt đầu đẩy code lên git repository..."

# Xóa file lock nếu tồn tại
if [ -f ".git/index.lock" ]; then
    echo "Xóa file lock cũ..."
    rm -f .git/index.lock
fi

# Kiểm tra trạng thái git
echo "Kiểm tra trạng thái git..."
git status

# Thêm tất cả file thay đổi
echo "Thêm tất cả thay đổi vào staging..."
git add .

# Commit với message
echo "Commit thay đổi..."
git commit -m "Fixed credit history 0 rendering issues and enhanced JSX conditional rendering - Applied Boolean conversion to prevent React from rendering falsy number values (0) directly in JSX expressions"

# Đẩy lên repository
echo "Đẩy code lên repository..."
git push origin main

echo "=== Hoàn tất ==="
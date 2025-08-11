#!/usr/bin/env node

// Debug script để kiểm tra admin access
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';

async function checkAdminAccess() {
  console.log('=== Debug Admin Access ===\n');
  
  try {
    // 1. Kiểm tra API user hiện tại
    console.log('1. Kiểm tra authentication status...');
    const userResponse = await fetch(`${BASE_URL}/api/user`, {
      credentials: 'include'
    });
    const userData = await userResponse.json();
    
    if (userResponse.status === 401) {
      console.log('❌ User chưa đăng nhập');
      console.log('Giải pháp: Cần đăng nhập tại /auth');
      return;
    }
    
    if (userData.success) {
      console.log('✅ User đã đăng nhập:', userData.data.email);
      console.log('👤 Role:', userData.data.role);
      console.log('🆔 User ID:', userData.data.id);
      
      if (userData.data.role !== 'admin') {
        console.log('❌ User không có quyền admin');
        console.log('Giải pháp: Cần account với role "admin"');
        return;
      }
      
      console.log('✅ User có quyền admin');
    }
    
    // 2. Test admin API
    console.log('\n2. Kiểm tra admin API access...');
    const adminResponse = await fetch(`${BASE_URL}/api/admin/settings`, {
      credentials: 'include'
    });
    const adminData = await adminResponse.json();
    
    if (adminResponse.status === 401) {
      console.log('❌ Admin API trả về 401 - Authentication required');
    } else if (adminResponse.status === 403) {
      console.log('❌ Admin API trả về 403 - Admin access required');
    } else if (adminResponse.status === 200) {
      console.log('✅ Admin API hoạt động bình thường');
    } else {
      console.log(`❓ Admin API trả về status: ${adminResponse.status}`);
    }
    
    console.log('Response:', adminData);
    
  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra:', error.message);
  }
}

// Chạy debug
checkAdminAccess();
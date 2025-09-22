import { Router } from 'express';
import { db } from '../../db';
import * as schema from '../../shared/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

const router = Router();

// POST /api/auth/zalo/confirm - Create user after confirmation
router.post('/confirm', async (req, res) => {
  try {
    const { zaloData, userInfo } = req.body;

    // Validate session and data
    if (!zaloData || !userInfo) {
      return res.status(400).json({
        success: false,
        error: 'Thiếu dữ liệu xác nhận'
      });
    }

    // Check if session data is still valid (15 minutes)
    const sessionAge = Date.now() - zaloData.timestamp;
    if (sessionAge > 15 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
      });
    }

    // Validate required fields
    if (!userInfo.fullName || userInfo.fullName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Tên phải có ít nhất 2 ký tự'
      });
    }

    // Validate email if provided
    if (userInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userInfo.email)) {
      return res.status(400).json({
        success: false,
        error: 'Email không hợp lệ'
      });
    }

    console.log('Creating Zalo user with confirmation data...');

    // Determine user data based on available Zalo information
    let userData: any = {
      role: 'user',
      credits: 50,
      language: 'vi',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Handle user creation based on Zalo data availability
    if (zaloData.userInfo.id) {
      // Full Zalo info available (production Vietnam IP)
      console.log('Creating user with full Zalo info');
      
      // Use Zalo name as fullName, or fallback to user input
      const zaloName = zaloData.userInfo.name || userInfo.fullName.trim();
      
      userData = {
        ...userData,
        username: zaloData.userInfo.id, // Use Zalo ID directly as username
        fullName: zaloName,
        firstName: zaloName.split(' ')[0] || null,
        lastName: zaloName.split(' ').slice(1).join(' ') || null,
        email: userInfo.email || null, // Leave email empty if not provided by user
        zaloId: zaloData.userInfo.id,
        avatar: zaloData.userInfo.picture?.data?.url || null,
        profileImageUrl: zaloData.userInfo.picture?.data?.url || null,
        password: null // OAuth users don't need password
      };
    } else {
      // Limited info due to IP restriction
      console.log('Creating user with limited Zalo info due to IP restriction');
      
      const tempId = `temp_${zaloData.token.access_token.substring(0, 10)}`;
      userData = {
        ...userData,
        username: `zalo_${tempId}`,
        fullName: userInfo.fullName.trim(),
        firstName: userInfo.fullName.trim().split(' ')[0] || null,
        lastName: userInfo.fullName.trim().split(' ').slice(1).join(' ') || null,
        email: userInfo.email || `zalo_${tempId}@zalo.temp`,
        zaloId: tempId,
        avatar: null,
        profileImageUrl: null,
        password: `zalo_temp_${crypto.randomBytes(8).toString('hex')}` // Temporary password for constraint
      };
    }

    // Extended check for existing users - same logic as zalo-auth.ts
    console.log('🔍 Searching for existing user with multiple patterns...');
    console.log('Zalo ID to search:', userData.zaloId);
    
    // Pattern 1: Check by zaloId directly 
    let existingUser = await db.select()
      .from(schema.users)
      .where(eq(schema.users.zaloId, userData.zaloId))
      .limit(1);
    console.log('Pattern 1 - By zaloId:', existingUser.length > 0 ? 'FOUND' : 'NOT FOUND');
    
    // Pattern 2: Check by username = zaloId 
    if (existingUser.length === 0) {
      console.log('Pattern 2 - Checking by username = zaloId...');
      existingUser = await db.select()
        .from(schema.users)
        .where(eq(schema.users.username, userData.zaloId))
        .limit(1);
      console.log('Pattern 2 - By username = zaloId:', existingUser.length > 0 ? 'FOUND' : 'NOT FOUND');
      
      // If found by username, update their zaloId field for future consistency
      if (existingUser.length > 0) {
        console.log('Updating zaloId field for consistency...');
        await db.update(schema.users)
          .set({ zaloId: userData.zaloId, updatedAt: new Date() })
          .where(eq(schema.users.id, existingUser[0].id));
      }
    }
    
    // Pattern 3: Check by username = "zalo_" + zaloId
    if (existingUser.length === 0) {
      const zaloUsername = `zalo_${userData.zaloId}`;
      console.log('Pattern 3 - Checking by username = zalo_ + zaloId:', zaloUsername);
      existingUser = await db.select()
        .from(schema.users)
        .where(eq(schema.users.username, zaloUsername))
        .limit(1);
      console.log('Pattern 3 - By zalo_username:', existingUser.length > 0 ? 'FOUND' : 'NOT FOUND');
      
      // If found, update their zaloId field
      if (existingUser.length > 0) {
        console.log('Found user with zalo_ prefix, updating zaloId field...');
        await db.update(schema.users)
          .set({ zaloId: userData.zaloId, updatedAt: new Date() })
          .where(eq(schema.users.id, existingUser[0].id));
      }
    }
    
    // Final result
    console.log('🎯 Final search result:', existingUser.length > 0 ? 'USER FOUND' : 'NO USER FOUND');

    if (existingUser.length > 0) {
      console.log('✅ User already exists, logging in existing user:', {
        userId: existingUser[0].id,
        username: existingUser[0].username,
        zaloId: existingUser[0].zaloId,
        fullName: existingUser[0].fullName
      });
      
      // Set session and return existing user
      req.login(existingUser[0], (err) => {
        if (err) {
          console.error('Error setting session for existing user:', err);
          return res.status(500).json({
            success: false,
            error: 'Lỗi đăng nhập'
          });
        }

        return res.json({
          success: true,
          data: {
            id: existingUser[0].id,
            username: existingUser[0].username,
            fullName: existingUser[0].fullName,
            email: existingUser[0].email,
            role: existingUser[0].role,
            credits: existingUser[0].credits
          }
        });
      });
      return;
    }

    // Create new user
    console.log('Creating new Zalo user with data:', {
      username: userData.username, // This is the Zalo ID
      fullName: userData.fullName,  // This is the Zalo name
      email: userData.email,        // This is user input or null
      avatar: userData.avatar       // This is the Zalo picture URL
    });

    let newUser;
    try {
      [newUser] = await db.insert(schema.users).values(userData).returning();

      console.log('✅ Successfully created new Zalo user:', {
        id: newUser.id,
        username: newUser.username,
        zaloId: newUser.zaloId,
        fullName: newUser.fullName,
        hasEmail: !!newUser.email
      });
    } catch (error) {
      console.error('❌ Failed to create new Zalo user:', error);
      
      // Check if it's a duplicate key error (user already exists)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
        console.log('🔄 Duplicate user detected, attempting to find and login existing user...');
        
        // Try to find existing user again (perhaps race condition)
        const retryExistingUser = await db.select()
          .from(schema.users)
          .where(eq(schema.users.zaloId, userData.zaloId))
          .limit(1);
        
        if (retryExistingUser.length > 0) {
          console.log('Found existing user on retry, logging in...');
          req.login(retryExistingUser[0], (err) => {
            if (err) {
              console.error('Error setting session for retry user:', err);
              return res.status(500).json({
                success: false,
                error: 'Lỗi đăng nhập'
              });
            }
            
            return res.json({
              success: true,
              data: {
                id: retryExistingUser[0].id,
                username: retryExistingUser[0].username,
                fullName: retryExistingUser[0].fullName,
                email: retryExistingUser[0].email,
                role: retryExistingUser[0].role,
                credits: retryExistingUser[0].credits
              }
            });
          });
          return;
        }
      }
      
      return res.status(500).json({
        success: false,
        error: 'Không thể tạo tài khoản. Vui lòng thử lại sau.'
      });
    }

    // Set session for new user
    if (newUser) {
      req.login(newUser, (err) => {
        if (err) {
          console.error('Error setting session for new user:', err);
          return res.status(500).json({
            success: false,
            error: 'Lỗi đăng nhập sau khi tạo tài khoản'
          });
        }

        return res.json({
          success: true,
          data: {
            id: newUser.id,
            username: newUser.username,
            fullName: newUser.fullName,
            email: newUser.email,
            role: newUser.role,
            credits: newUser.credits
          }
        });
      });
    }

  } catch (error) {
    console.error('Error confirming Zalo account:', error);
    return res.status(500).json({
      success: false,
      error: 'Có lỗi xảy ra khi tạo tài khoản. Vui lòng thử lại.'
    });
  }
});

export default router;
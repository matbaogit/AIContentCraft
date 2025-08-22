import { Router } from 'express';
import { db } from '@db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { storage } from '../storage';
import { randomBytes } from 'crypto';

const router = Router();

// Create new user from Zalo OAuth data
router.post('/create', async (req, res) => {
  try {
    const { zaloUser, accessToken, referralCode } = req.body;

    if (!zaloUser || !zaloUser.id) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Zalo user data'
      });
    }

    // Check if user already exists
    const [existingUser] = await db.select()
      .from(users)
      .where(eq(users.zaloId, zaloUser.id))
      .limit(1);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Generate unique username and referral code
    const baseUsername = `zalo_${zaloUser.id}`;
    let username = baseUsername;
    let counter = 1;
    
    while (await storage.getUserByUsername(username)) {
      username = `${baseUsername}_${counter}`;
      counter++;
    }

    // Generate unique referral code
    let referralCodeGenerated;
    do {
      referralCodeGenerated = `REF${randomBytes(4).toString('hex').toUpperCase()}`;
    } while (await db.select().from(users).where(eq(users.referralCode, referralCodeGenerated)).limit(1).then(r => r.length > 0));

    // Handle referral if provided
    let referrerId = null;
    if (referralCode && referralCode.trim()) {
      try {
        const [referrer] = await db.select()
          .from(users)
          .where(eq(users.referralCode, referralCode.trim()))
          .limit(1);
        
        if (referrer && referrer.id) {
          referrerId = referrer.id;
          console.log('Found referrer:', referrer.username, 'for new Zalo user');
        }
      } catch (error) {
        console.error('Error processing referral code:', error);
      }
    }

    // Create new user
    const [newUser] = await db.insert(users).values({
      username,
      email: null, // Zalo might not provide email
      password: null, // No password for OAuth users
      fullName: zaloUser.name,
      firstName: zaloUser.name,
      profileImageUrl: zaloUser.picture?.data?.url || null,
      zaloId: zaloUser.id,
      role: 'user',
      credits: 0,
      language: 'vi',
      isVerified: true, // OAuth users are considered verified
      referralCode: referralCodeGenerated,
      referredBy: referrerId,
    }).returning();

    // Assign free plan and credits
    try {
      const freePlans = await storage.getPlans();
      const freePlan = freePlans.find(plan => plan.type === 'free');
      
      if (freePlan) {
        await storage.assignPlanToUser(newUser.id, freePlan.id);
        await storage.addUserCredits(newUser.id, freePlan.credits, freePlan.id, 'Gói miễn phí khi đăng ký');
      } else {
        await storage.addUserCredits(newUser.id, 50, undefined, 'Welcome bonus');
      }

      // Process referral bonus if applicable
      if (referrerId) {
        try {
          // Give bonus to referrer
          await storage.addUserCredits(referrerId, 10, undefined, `Giới thiệu thành công: ${newUser.username}`);
          
          // Give bonus to new user
          await storage.addUserCredits(newUser.id, 10, undefined, 'Bonus được giới thiệu');
          
          console.log('Referral bonuses processed successfully');
        } catch (error) {
          console.error('Error processing referral bonuses:', error);
        }
      }
    } catch (error) {
      console.error('Error setting up user benefits:', error);
    }

    // Login the new user
    req.login(newUser, (err) => {
      if (err) {
        console.error('Error logging in new Zalo user:', err);
        return res.status(500).json({
          success: false,
          error: 'User created but login failed'
        });
      }

      console.log('New Zalo user created and logged in:', newUser.username);
      
      res.json({
        success: true,
        message: referralCode ? 
          'Chào mừng bạn đến với ToolBox! Cảm ơn bạn đã tham gia qua lời giới thiệu!' : 
          'Chào mừng bạn đến với ToolBox! Tài khoản của bạn đã được tạo thành công.',
        user: {
          id: newUser.id,
          username: newUser.username,
          fullName: newUser.fullName,
          email: newUser.email,
          role: newUser.role,
          credits: newUser.credits,
          referralCode: newUser.referralCode
        }
      });
    });

  } catch (error) {
    console.error('Error creating Zalo user:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
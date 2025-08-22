import { Router } from 'express';
import { db } from '@db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Get referrer info by referral code
router.get('/info/:code', async (req, res) => {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Referral code is required'
      });
    }

    // Find user with this referral code
    const [referrer] = await db.select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      referralCode: users.referralCode
    })
    .from(users)
    .where(eq(users.referralCode, code))
    .limit(1);

    if (!referrer) {
      return res.status(404).json({
        success: false,
        error: 'Referral code not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: referrer.id,
        username: referrer.username,
        fullName: referrer.fullName,
        referralCode: referrer.referralCode
      }
    });

  } catch (error) {
    console.error('Error fetching referrer info:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
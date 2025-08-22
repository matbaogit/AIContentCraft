import { Router } from 'express';
import { db } from '@db';
import { users, creditUsageHistory } from '@shared/schema';
import { eq, and, desc, count, sum, gte } from 'drizzle-orm';
// Middleware for authentication
const isAuthenticated = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  next();
};

const router = Router();

// Get user referral stats
router.get('/referral-stats', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;

    // Count total referrals (users referred by this user)
    const [totalReferralsResult] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.referredBy, userId));

    const totalReferrals = totalReferralsResult?.count || 0;

    // Calculate total credits earned from referrals
    const referralCredits = await db
      .select({ total: sum(creditUsageHistory.totalCredits) })
      .from(creditUsageHistory)
      .where(and(
        eq(creditUsageHistory.userId, userId),
        eq(creditUsageHistory.action, 'referral_bonus')
      ));

    const totalCreditsEarned = Math.abs(Number(referralCredits[0]?.total || 0));

    // Calculate monthly earnings (current month)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyCredits = await db
      .select({ total: sum(creditUsageHistory.totalCredits) })
      .from(creditUsageHistory)
      .where(and(
        eq(creditUsageHistory.userId, userId),
        eq(creditUsageHistory.action, 'referral_bonus'),
        gte(creditUsageHistory.createdAt, currentMonth)
      ));

    const monthlyEarnings = Math.abs(Number(monthlyCredits[0]?.total || 0));

    // Get recent referrals with details
    const recentReferrals = await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.referredBy, userId))
      .orderBy(desc(users.createdAt))
      .limit(10);

    res.json({
      success: true,
      data: {
        totalReferrals,
        totalCreditsEarned,
        monthlyEarnings,
        recentReferrals
      }
    });

  } catch (error) {
    console.error('Error fetching referral stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
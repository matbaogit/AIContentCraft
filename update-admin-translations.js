// Script to update admin translation keys in database
import { db } from './db/index.js';
import { translations } from './shared/schema.js';
import { eq, and } from 'drizzle-orm';

const adminTranslationKeys = [
  // Stats section
  { key: 'admin.stats.totalUsers', vi: 'Tổng số người dùng', en: 'Total Users' },
  { key: 'admin.stats.totalArticles', vi: 'Tổng số bài viết', en: 'Total Articles' },
  { key: 'admin.stats.totalCredits', vi: 'Tổng tín dụng', en: 'Total Credits' },
  { key: 'admin.stats.totalRevenue', vi: 'Tổng doanh thu', en: 'Total Revenue' },
  { key: 'admin.stats.userGrowth', vi: 'Tăng trưởng người dùng', en: 'User Growth' },
  { key: 'admin.stats.userGrowthDesc', vi: 'Tổng số người dùng mới theo tháng', en: 'Total new users per month' },
  { key: 'admin.stats.noGrowthDataYet', vi: 'Chưa có dữ liệu tăng trưởng', en: 'No growth data yet' },
  { key: 'admin.stats.growthDataWillShow', vi: 'Dữ liệu sẽ hiển thị khi có nhiều người dùng hơn', en: 'Data will show when there are more users' },
  { key: 'admin.stats.revenue', vi: 'Doanh thu', en: 'Revenue' },
  { key: 'admin.stats.revenueDesc', vi: 'Tổng doanh thu theo quý', en: 'Total revenue per quarter' },
  { key: 'admin.stats.noRevenueDataYet', vi: 'Chưa có dữ liệu doanh thu', en: 'No revenue data yet' },
  { key: 'admin.stats.revenueDataWillShow', vi: 'Dữ liệu sẽ hiển thị khi có giao dịch', en: 'Data will show when there are transactions' },
  { key: 'admin.stats.planDistribution', vi: 'Phân bổ gói dịch vụ', en: 'Plan Distribution' },
  { key: 'admin.stats.planDistributionDesc', vi: 'Phân bổ gói tín dụng', en: 'Distribution of credit packages' },
  { key: 'admin.stats.noDataAvailable', vi: 'Chưa có dữ liệu', en: 'No data available' },
  { key: 'admin.stats.recentUsers', vi: 'Người dùng gần đây', en: 'Recent Users' },
  { key: 'admin.stats.noUsersYet', vi: 'Chưa có người dùng nào', en: 'No users yet' },
  { key: 'admin.stats.recentTransactions', vi: 'Giao dịch gần đây', en: 'Recent Transactions' },
  { key: 'admin.stats.noTransactionsYet', vi: 'Chưa có giao dịch nào', en: 'No transactions yet' },
  
  // User section
  { key: 'admin.user.username', vi: 'Tên đăng nhập', en: 'Username' },
  { key: 'admin.user.fullName', vi: 'Họ và tên', en: 'Full Name' },
  { key: 'admin.user.joinDate', vi: 'Ngày tham gia', en: 'Join Date' },
  { key: 'admin.user.credits', vi: 'Tín dụng', en: 'Credits' }
];

async function updateTranslations() {
  console.log('Updating admin translation keys...');
  
  try {
    for (const translation of adminTranslationKeys) {
      // Check if translation already exists for Vietnamese
      const existingVi = await db.select()
        .from(translations)
        .where(and(
          eq(translations.key, translation.key),
          eq(translations.language, 'vi')
        ))
        .limit(1);
      
      if (existingVi.length === 0) {
        await db.insert(translations).values({
          key: translation.key,
          language: 'vi',
          value: translation.vi
        });
        console.log(`Added VI: ${translation.key}`);
      } else {
        await db.update(translations)
          .set({ value: translation.vi })
          .where(and(
            eq(translations.key, translation.key),
            eq(translations.language, 'vi')
          ));
        console.log(`Updated VI: ${translation.key}`);
      }
      
      // Check if translation already exists for English
      const existingEn = await db.select()
        .from(translations)
        .where(and(
          eq(translations.key, translation.key),
          eq(translations.language, 'en')
        ))
        .limit(1);
      
      if (existingEn.length === 0) {
        await db.insert(translations).values({
          key: translation.key,
          language: 'en',
          value: translation.en
        });
        console.log(`Added EN: ${translation.key}`);
      } else {
        await db.update(translations)
          .set({ value: translation.en })
          .where(and(
            eq(translations.key, translation.key),
            eq(translations.language, 'en')
          ));
        console.log(`Updated EN: ${translation.key}`);
      }
    }
    
    console.log('Successfully updated all admin translation keys!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating translations:', error);
    process.exit(1);
  }
}

updateTranslations();
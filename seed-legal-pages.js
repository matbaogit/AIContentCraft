import { db } from './db/index.js';
import { legalPages } from './shared/schema.js';

async function seedLegalPages() {
  try {
    console.log('🌱 Seeding legal pages...');

    // Check if legal pages already exist
    const existingPages = await db.select().from(legalPages);
    
    if (existingPages.length > 0) {
      console.log('✅ Legal pages already exist, skipping seed...');
      return;
    }

    // Insert legal pages data
    const legalPagesData = [
      {
        id: 'privacy-policy',
        title_vi: 'Chính sách bảo mật',
        title_en: 'Privacy Policy',
        content_vi: `# Chính sách bảo mật

## 1. Thông tin chúng tôi thu thập
Chúng tôi thu thập thông tin khi bạn đăng ký tài khoản, sử dụng dịch vụ, hoặc liên hệ với chúng tôi.

## 2. Cách chúng tôi sử dụng thông tin
Thông tin của bạn được sử dụng để:
- Cung cấp và cải thiện dịch vụ
- Gửi thông báo quan trọng
- Hỗ trợ khách hàng

## 3. Bảo mật thông tin
Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn bằng các biện pháp bảo mật phù hợp.

## 4. Chia sẻ thông tin
Chúng tôi không bán, cho thuê hoặc chia sẻ thông tin cá nhân của bạn với bên thứ ba trừ khi có sự đồng ý của bạn.

## 5. Liên hệ
Nếu có câu hỏi về chính sách này, vui lòng liên hệ với chúng tôi.`,
        content_en: `# Privacy Policy

## 1. Information We Collect
We collect information when you register an account, use our services, or contact us.

## 2. How We Use Information
Your information is used to:
- Provide and improve services
- Send important notifications
- Customer support

## 3. Information Security
We are committed to protecting your personal information with appropriate security measures.

## 4. Information Sharing
We do not sell, rent, or share your personal information with third parties without your consent.

## 5. Contact
If you have questions about this policy, please contact us.`,
        path: '/privacy-policy',
        lastUpdated: new Date()
      },
      {
        id: 'data-deletion',
        title_vi: 'Hướng dẫn xóa dữ liệu',
        title_en: 'Data Deletion Instructions',
        content_vi: `# Hướng dẫn xóa dữ liệu

## Cách xóa tài khoản và dữ liệu cá nhân

### 1. Xóa tài khoản
- Đăng nhập vào tài khoản của bạn
- Vào phần "Cài đặt tài khoản"
- Chọn "Xóa tài khoản"
- Xác nhận quyết định của bạn

### 2. Dữ liệu sẽ được xóa
- Thông tin cá nhân
- Bài viết và nội dung đã tạo
- Lịch sử sử dụng dịch vụ
- Dữ liệu thanh toán

### 3. Thời gian xử lý
Yêu cầu xóa dữ liệu sẽ được xử lý trong vòng 30 ngày.

### 4. Liên hệ hỗ trợ
Nếu cần hỗ trợ, vui lòng liên hệ với chúng tôi qua email hoặc chat hỗ trợ.`,
        content_en: `# Data Deletion Instructions

## How to delete your account and personal data

### 1. Delete Account
- Log in to your account
- Go to "Account Settings"
- Select "Delete Account"
- Confirm your decision

### 2. Data to be deleted
- Personal information
- Articles and created content
- Service usage history
- Payment data

### 3. Processing time
Data deletion requests will be processed within 30 days.

### 4. Support contact
If you need support, please contact us via email or support chat.`,
        path: '/data-deletion',
        lastUpdated: new Date()
      },
      {
        id: 'terms-of-service',
        title_vi: 'Điều khoản dịch vụ',
        title_en: 'Terms of Service',
        content_vi: `# Điều khoản dịch vụ

## 1. Chấp nhận điều khoản
Bằng cách sử dụng dịch vụ của chúng tôi, bạn đồng ý với các điều khoản này.

## 2. Sử dụng dịch vụ
- Bạn phải từ 18 tuổi trở lên để sử dụng dịch vụ
- Không được sử dụng dịch vụ cho mục đích bất hợp pháp
- Tôn trọng quyền sở hữu trí tuệ

## 3. Tài khoản người dùng
- Bạn chịu trách nhiệm bảo mật thông tin tài khoản
- Thông báo ngay nếu phát hiện tài khoản bị xâm nhập

## 4. Thanh toán và hoàn tiền
- Thanh toán được xử lý an toàn
- Chính sách hoàn tiền áp dụng theo quy định

## 5. Chấm dứt dịch vụ
Chúng tôi có quyền chấm dứt dịch vụ nếu bạn vi phạm điều khoản.

## 6. Thay đổi điều khoản
Chúng tôi có thể cập nhật điều khoản này. Thay đổi sẽ có hiệu lực ngay khi được đăng tải.`,
        content_en: `# Terms of Service

## 1. Acceptance of Terms
By using our service, you agree to these terms.

## 2. Use of Service
- You must be 18 years or older to use the service
- Do not use the service for illegal purposes
- Respect intellectual property rights

## 3. User Accounts
- You are responsible for account security
- Report immediately if you detect account intrusion

## 4. Payment and Refunds
- Payments are processed securely
- Refund policy applies as specified

## 5. Service Termination
We reserve the right to terminate service if you violate the terms.

## 6. Terms Changes
We may update these terms. Changes will take effect immediately upon posting.`,
        path: '/terms-of-service',
        lastUpdated: new Date()
      }
    ];

    const insertedPages = await db.insert(legalPages).values(legalPagesData).returning();
    
    console.log('✅ Legal pages seeded successfully!');
    console.log(`📄 Created ${insertedPages.length} legal pages:`);
    insertedPages.forEach(page => {
      console.log(`  - ${page.id}: ${page.title_vi} / ${page.title_en}`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding legal pages:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedLegalPages()
    .then(() => {
      console.log('🎉 Legal pages seed completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Legal pages seed failed:', error);
      process.exit(1);
    });
}

export { seedLegalPages };
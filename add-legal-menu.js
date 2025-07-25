import { db } from './db/index.js';
import { sidebarMenuItems, legalPages } from './shared/schema.js';

async function addLegalMenu() {
  try {
    console.log('🔧 Adding legal pages menu item...');

    // Add legal pages menu item
    await db.insert(sidebarMenuItems)
      .values({
        key: 'legal-pages',
        label: 'Trang pháp lý', // Add label field required by schema
        icon: 'FileText',
        path: '/admin/legal-pages',
        labelVi: 'Trang pháp lý',
        labelEn: 'Legal Pages',
        sort: 99,
        isVisible: true,
        requiredRole: 'admin'
      })
      .onConflictDoUpdate({
        target: sidebarMenuItems.key,
        set: {
          label: 'Trang pháp lý',
          icon: 'FileText',
          path: '/admin/legal-pages',
          labelVi: 'Trang pháp lý',
          labelEn: 'Legal Pages',
          sort: 99,
          isVisible: true,
          requiredRole: 'admin'
        }
      });

    console.log('✅ Legal pages menu item added successfully!');

    // Add sample legal pages data
    console.log('📄 Adding legal pages data...');
    
    const pages = [
      {
        id: 'privacy-policy',
        title_vi: 'Chính Sách Bảo Mật',
        title_en: 'Privacy Policy',
        content_vi: `# Chính Sách Bảo Mật

## 1. Thông Tin Chúng Tôi Thu Thập
- Thông tin cá nhân khi đăng ký tài khoản
- Dữ liệu sử dụng dịch vụ
- Thông tin kỹ thuật từ thiết bị

## 2. Cách Chúng Tôi Sử Dụng Thông Tin
- Cung cấp và cải thiện dịch vụ
- Liên lạc với người dùng
- Đảm bảo bảo mật hệ thống

## 3. Chia Sẻ Thông Tin
Chúng tôi cam kết không bán hoặc chia sẻ thông tin cá nhân với bên thứ ba.

## 4. Bảo Mật Dữ Liệu
Sử dụng mã hóa và các biện pháp bảo mật tiêu chuẩn công nghiệp.

## 5. Quyền Của Người Dùng
- Truy cập dữ liệu cá nhân
- Yêu cầu chỉnh sửa hoặc xóa
- Rút lại sự đồng ý`,
        content_en: `# Privacy Policy

## 1. Information We Collect
- Personal information during account registration
- Service usage data
- Technical information from your device

## 2. How We Use Information
- Provide and improve our services
- Communicate with users
- Ensure system security

## 3. Information Sharing
We are committed to not selling or sharing personal information with third parties.

## 4. Data Security
Using encryption and industry-standard security measures.

## 5. User Rights
- Access personal data
- Request editing or deletion
- Withdraw consent`,
        path: '/privacy-policy',
        description: 'Chính sách bảo vệ thông tin người dùng',
      },
      {
        id: 'data-deletion',
        title_vi: 'Hướng Dẫn Xóa Dữ Liệu',
        title_en: 'Data Deletion Instructions',
        content_vi: `# Hướng Dẫn Xóa Dữ Liệu

## Tổng Quan
Bạn có quyền yêu cầu xóa hoàn toàn dữ liệu cá nhân và tài khoản khỏi hệ thống SEO AI Writer.

## Các Cách Xóa Dữ Liệu

### 1. Tự Xóa Trong Tài Khoản
- Đăng nhập vào tài khoản
- Vào mục "Cài đặt tài khoản"
- Chọn "Xóa tài khoản"

### 2. Gửi Yêu Cầu Qua Email
Gửi email đến privacy@seoaiwriter.com với thông tin:
- Tên đầy đủ
- Email đăng ký tài khoản
- Lý do yêu cầu xóa

### 3. Biểu Mẫu Trực Tuyến
Điền form trực tuyến để gửi yêu cầu xóa dữ liệu.

## Thời Gian Xử Lý
- Xác nhận nhận yêu cầu: Ngay lập tức
- Xác minh danh tính: 1-3 ngày làm việc
- Xóa dữ liệu: 7-14 ngày làm việc

## Dữ Liệu Sẽ Được Xóa
- Thông tin tài khoản
- Nội dung đã tạo
- Dữ liệu sử dụng
- Kết nối bên ngoài`,
        content_en: `# Data Deletion Instructions

## Overview
You have the right to request complete deletion of your personal data and account from the SEO AI Writer system.

## Data Deletion Methods

### 1. Self-Delete in Account
- Log in to your account
- Go to "Account Settings"
- Select "Delete Account"

### 2. Email Request
Send email to privacy@seoaiwriter.com with information:
- Full name
- Registered email address
- Reason for deletion request

### 3. Online Form
Fill out the online form to submit a data deletion request.

## Processing Timeline
- Request confirmation: Immediately
- Identity verification: 1-3 business days
- Data deletion: 7-14 business days

## Data to be Deleted
- Account information
- Created content
- Usage data
- External connections`,
        path: '/data-deletion',
        description: 'Hướng dẫn yêu cầu xóa dữ liệu cá nhân',
      },
      {
        id: 'terms-of-service',
        title_vi: 'Điều Khoản Dịch Vụ',
        title_en: 'Terms of Service',
        content_vi: `# Điều Khoản Dịch Vụ

## Chấp Nhận Điều Khoản
Bằng việc sử dụng SEO AI Writer, bạn đồng ý tuân thủ các điều khoản này.

## Mô Tả Dịch Vụ
SEO AI Writer cung cấp:
- Tạo nội dung bằng AI
- Tối ưu hóa SEO
- Tạo hình ảnh tự động
- Quản lý nội dung
- Tích hợp mạng xã hội

## Tài Khoản Người Dùng
Bạn có trách nhiệm:
- Cung cấp thông tin chính xác
- Bảo mật thông tin đăng nhập
- Tuân thủ quy định sử dụng

## Chính Sách Sử Dụng
Không được:
- Tạo nội dung bất hợp pháp
- Vi phạm bản quyền
- Spam hoặc lừa đảo
- Can thiệp vào hệ thống

## Thanh Toán và Hoàn Tiền
- Thanh toán qua cổng an toàn
- Hoàn tiền trong 7 ngày cho gói chưa sử dụng
- Không hoàn tiền cho tín dụng đã sử dụng

## Quyền Sở Hữu Trí Tuệ
- Bạn giữ quyền sở hữu nội dung tạo ra
- Chúng tôi sở hữu mã nguồn và công nghệ

## Giới Hạn Trách Nhiệm
- Dịch vụ cung cấp "như hiện tại"
- Không đảm bảo hoạt động liên tục
- Trách nhiệm tối đa bằng số tiền đã thanh toán`,
        content_en: `# Terms of Service

## Acceptance of Terms
By using SEO AI Writer, you agree to comply with these terms.

## Service Description
SEO AI Writer provides:
- AI-powered content generation
- SEO optimization
- Automated image generation
- Content management
- Social media integration

## User Accounts
You are responsible for:
- Providing accurate information
- Securing login credentials
- Complying with usage policies

## Usage Policy
You must not:
- Create illegal content
- Violate copyrights
- Send spam or fraud
- Interfere with systems

## Payment and Refunds
- Payment through secure gateways
- Refunds within 7 days for unused packages
- No refunds for used credits

## Intellectual Property
- You retain ownership of created content
- We own source code and technology

## Limitation of Liability
- Service provided "as is"
- No guarantee of continuous operation
- Maximum liability equals amount paid`,
        path: '/terms-of-service',
        description: 'Các điều khoản và điều kiện sử dụng',
      }
    ];

    // Insert legal pages with upsert logic
    for (const page of pages) {
      console.log(`📄 Adding legal page: ${page.id}`);
      
      await db.insert(legalPages)
        .values(page)
        .onConflictDoUpdate({
          target: [legalPages.id],
          set: {
            title_vi: page.title_vi,
            title_en: page.title_en,
            content_vi: page.content_vi,
            content_en: page.content_en,
            path: page.path,
            description: page.description,
            lastUpdated: new Date(),
            updatedAt: new Date(),
          }
        });
    }

    console.log('✅ All legal setup completed successfully!');
  } catch (error) {
    console.error('❌ Error setting up legal pages:', error);
    throw error;
  }
}

// Run if called directly  
if (import.meta.url === `file://${process.argv[1]}`) {
  addLegalMenu()
    .then(() => {
      console.log('🎉 Setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

export { addLegalMenu };
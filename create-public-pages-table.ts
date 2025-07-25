import { db } from "./db/index.js";
import { sql } from "drizzle-orm";

async function createPublicPagesTable() {
  try {
    console.log('Creating public_pages table...');
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS public_pages (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(100) NOT NULL UNIQUE,
        title VARCHAR(200) NOT NULL,
        title_en VARCHAR(200),
        content TEXT NOT NULL,
        content_en TEXT,
        meta_description VARCHAR(300),
        meta_description_en VARCHAR(300),
        is_published BOOLEAN NOT NULL DEFAULT true,
        sort_order INTEGER NOT NULL DEFAULT 0,
        last_edited_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    console.log('✅ Table created successfully!');
    
    console.log('Inserting initial data...');
    
    // Insert privacy policy
    await db.execute(sql`
      INSERT INTO public_pages (slug, title, title_en, content, content_en, meta_description, meta_description_en, is_published, sort_order) VALUES
      ('privacy-policy', 'Chính sách bảo mật', 'Privacy Policy', 
      '# Chính sách bảo mật

## 1. Thu thập thông tin

Chúng tôi thu thập thông tin khi bạn:
- Đăng ký tài khoản
- Sử dụng dịch vụ tạo nội dung
- Liên hệ với chúng tôi

## 2. Sử dụng thông tin

Thông tin của bạn được sử dụng để:
- Cung cấp dịch vụ
- Cải thiện trải nghiệm người dùng
- Gửi thông báo quan trọng

## 3. Bảo mật thông tin

Chúng tôi cam kết bảo mật thông tin cá nhân của bạn bằng:
- Mã hóa dữ liệu
- Kiểm soát truy cập
- Giám sát bảo mật

## 4. Chia sẻ thông tin

Chúng tôi không chia sẻ thông tin cá nhân với bên thứ ba trừ khi:
- Có sự đồng ý của bạn
- Theo yêu cầu pháp luật
- Để bảo vệ quyền lợi hợp pháp

## 5. Liên hệ

Nếu có câu hỏi về chính sách bảo mật, vui lòng liên hệ: support@seoaiwriter.com',

      '# Privacy Policy

## 1. Information Collection

We collect information when you:
- Register an account
- Use our content creation services
- Contact us

## 2. Information Usage

Your information is used to:
- Provide services
- Improve user experience
- Send important notifications

## 3. Information Security

We are committed to protecting your personal information through:
- Data encryption
- Access control
- Security monitoring

## 4. Information Sharing

We do not share personal information with third parties except when:
- You have given consent
- Required by law
- To protect legitimate interests

## 5. Contact

If you have questions about our privacy policy, please contact: support@seoaiwriter.com',

      'Chính sách bảo mật của SEO AI Writer - Cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn',
      'SEO AI Writer Privacy Policy - How we collect, use, and protect your personal information',
      true, 1)
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        title_en = EXCLUDED.title_en,
        content = EXCLUDED.content,
        content_en = EXCLUDED.content_en,
        meta_description = EXCLUDED.meta_description,
        meta_description_en = EXCLUDED.meta_description_en,
        is_published = EXCLUDED.is_published,
        sort_order = EXCLUDED.sort_order,
        updated_at = NOW()
    `);
    
    // Insert data deletion instructions
    await db.execute(sql`
      INSERT INTO public_pages (slug, title, title_en, content, content_en, meta_description, meta_description_en, is_published, sort_order) VALUES
      ('data-deletion-instructions', 'Hướng dẫn xóa dữ liệu', 'Data Deletion Instructions',
      '# Hướng dẫn xóa dữ liệu

## Quyền xóa dữ liệu cá nhân

Theo quy định về bảo vệ dữ liệu cá nhân, bạn có quyền yêu cầu xóa dữ liệu cá nhân khỏi hệ thống của chúng tôi.

## Cách yêu cầu xóa dữ liệu

### Phương pháp 1: Tự xóa tài khoản
1. Đăng nhập vào tài khoản của bạn
2. Vào mục "Cài đặt tài khoản"
3. Chọn "Xóa tài khoản"
4. Xác nhận yêu cầu xóa

### Phương pháp 2: Liên hệ hỗ trợ
Gửi email đến support@seoaiwriter.com với thông tin:
- Họ tên đầy đủ
- Email đăng ký
- Lý do xóa dữ liệu
- Chữ ký xác nhận

## Dữ liệu sẽ được xóa

Khi xóa tài khoản, các dữ liệu sau sẽ được xóa vĩnh viễn:
- Thông tin cá nhân
- Lịch sử sử dụng dịch vụ
- Nội dung đã tạo
- Tài liệu và hình ảnh

## Thời gian xử lý

- Xóa tự động: Ngay lập tức
- Qua hỗ trợ: 7-14 ngày làm việc

## Lưu ý quan trọng

- Việc xóa dữ liệu là không thể hoàn tác
- Một số dữ liệu có thể được giữ lại theo quy định pháp luật
- Dữ liệu backup có thể mất thêm 30 ngày để xóa hoàn toàn

## Liên hệ hỗ trợ

Email: support@seoaiwriter.com
Điện thoại: 1900-XXX-XXX',

      '# Data Deletion Instructions

## Right to Delete Personal Data

Under personal data protection regulations, you have the right to request deletion of your personal data from our system.

## How to Request Data Deletion

### Method 1: Self-delete Account
1. Log in to your account
2. Go to "Account Settings"
3. Select "Delete Account"
4. Confirm deletion request

### Method 2: Contact Support
Send email to support@seoaiwriter.com with:
- Full name
- Registered email
- Reason for data deletion
- Confirmation signature

## Data to be Deleted

When deleting account, the following data will be permanently removed:
- Personal information
- Service usage history
- Created content
- Documents and images

## Processing Time

- Automatic deletion: Immediate
- Via support: 7-14 business days

## Important Notes

- Data deletion is irreversible
- Some data may be retained per legal requirements
- Backup data may take additional 30 days to completely remove

## Support Contact

Email: support@seoaiwriter.com
Phone: 1900-XXX-XXX',

      'Hướng dẫn chi tiết cách xóa dữ liệu cá nhân khỏi hệ thống SEO AI Writer',
      'Detailed instructions on how to delete personal data from SEO AI Writer system',
      true, 2)
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        title_en = EXCLUDED.title_en,
        content = EXCLUDED.content,
        content_en = EXCLUDED.content_en,
        meta_description = EXCLUDED.meta_description,
        meta_description_en = EXCLUDED.meta_description_en,
        is_published = EXCLUDED.is_published,
        sort_order = EXCLUDED.sort_order,
        updated_at = NOW()
    `);
    
    // Insert terms of service
    await db.execute(sql`
      INSERT INTO public_pages (slug, title, title_en, content, content_en, meta_description, meta_description_en, is_published, sort_order) VALUES
      ('terms-of-service', 'Điều khoản dịch vụ', 'Terms of Service',
      '# Điều khoản dịch vụ

## 1. Chấp nhận điều khoản

Bằng cách sử dụng dịch vụ SEO AI Writer, bạn đồng ý tuân thủ các điều khoản này.

## 2. Mô tả dịch vụ

SEO AI Writer cung cấp:
- Công cụ tạo nội dung bằng AI
- Tối ưu hóa SEO
- Quản lý và xuất bản nội dung
- Hỗ trợ đa ngôn ngữ

## 3. Quyền và nghĩa vụ người dùng

### Quyền của người dùng:
- Sử dụng dịch vụ theo gói đã đăng ký
- Được hỗ trợ kỹ thuật
- Bảo mật thông tin cá nhân

### Nghĩa vụ của người dùng:
- Cung cấp thông tin chính xác
- Không sử dụng dịch vụ cho mục đích bất hợp pháp
- Thanh toán đúng hạn

## 4. Quyền sở hữu trí tuệ

- Nội dung do bạn tạo thuộc quyền sở hữu của bạn
- Bạn chịu trách nhiệm về tính hợp pháp của nội dung
- Chúng tôi có quyền tạm dừng dịch vụ nếu vi phạm

## 5. Thanh toán và hoàn tiền

- Phí dịch vụ được tính theo gói đăng ký
- Hoàn tiền trong 7 ngày nếu không hài lòng
- Không hoàn tiền cho dịch vụ đã sử dụng

## 6. Giới hạn trách nhiệm

Chúng tôi không chịu trách nhiệm về:
- Thiệt hại gián tiếp
- Mất mát dữ liệu do lỗi người dùng
- Gián đoạn dịch vụ do force majeure

## 7. Chấm dứt dịch vụ

- Bạn có thể hủy dịch vụ bất kỳ lúc nào
- Chúng tôi có quyền chấm dứt nếu vi phạm điều khoản
- Dữ liệu sẽ được xóa sau 30 ngày

## 8. Thay đổi điều khoản

- Điều khoản có thể được cập nhật
- Thông báo trước 30 ngày
- Tiếp tục sử dụng đồng nghĩa chấp nhận

## 9. Luật áp dụng

Điều khoản này được điều chỉnh bởi pháp luật Việt Nam.

## 10. Liên hệ

Mọi thắc mắc về điều khoản, liên hệ:
Email: legal@seoaiwriter.com
Địa chỉ: [Địa chỉ công ty]',

      '# Terms of Service

## 1. Acceptance of Terms

By using SEO AI Writer service, you agree to comply with these terms.

## 2. Service Description

SEO AI Writer provides:
- AI content creation tools
- SEO optimization
- Content management and publishing
- Multi-language support

## 3. User Rights and Obligations

### User Rights:
- Use service according to subscribed plan
- Receive technical support
- Personal information security

### User Obligations:
- Provide accurate information
- Not use service for illegal purposes
- Pay on time

## 4. Intellectual Property Rights

- Content you create belongs to you
- You are responsible for content legality
- We reserve the right to suspend service for violations

## 5. Payment and Refunds

- Service fees are charged per subscription plan
- Refund within 7 days if unsatisfied
- No refund for used services

## 6. Limitation of Liability

We are not responsible for:
- Indirect damages
- Data loss due to user error
- Service interruption due to force majeure

## 7. Service Termination

- You can cancel service anytime
- We may terminate for terms violation
- Data will be deleted after 30 days

## 8. Terms Changes

- Terms may be updated
- 30 days advance notice
- Continued use implies acceptance

## 9. Applicable Law

These terms are governed by Vietnamese law.

## 10. Contact

For any questions about terms, contact:
Email: legal@seoaiwriter.com
Address: [Company Address]',

      'Điều khoản dịch vụ của SEO AI Writer - Quyền và nghĩa vụ khi sử dụng dịch vụ',
      'SEO AI Writer Terms of Service - Rights and obligations when using our service',
      true, 3)
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        title_en = EXCLUDED.title_en,
        content = EXCLUDED.content,
        content_en = EXCLUDED.content_en,
        meta_description = EXCLUDED.meta_description,
        meta_description_en = EXCLUDED.meta_description_en,
        is_published = EXCLUDED.is_published,
        sort_order = EXCLUDED.sort_order,
        updated_at = NOW()
    `);
    
    console.log('✅ Public pages created successfully!');
  } catch (error) {
    console.error('❌ Error creating public pages:', error);
  }
}

createPublicPagesTable();
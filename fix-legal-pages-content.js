import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function fixLegalPagesContent() {
  try {
    console.log('🔧 Fixing legal pages content - making each page unique...');
    
    // Check current data
    const currentPages = await sql`SELECT id, title_vi, path, LENGTH(content_vi) as content_length FROM legal_pages ORDER BY id`;
    console.log('📊 Current pages:');
    currentPages.forEach(page => {
      console.log(`- ${page.id}: ${page.title_vi} (${page.path}) - ${page.content_length} chars`);
    });
    
    // Update Privacy Policy
    await sql`
      UPDATE legal_pages 
      SET 
        title_vi = 'Chính Sách Bảo Mật',
        title_en = 'Privacy Policy',
        content_vi = '<h1>Chính Sách Bảo Mật</h1>
<p>Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn. Chính sách này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ dữ liệu của bạn.</p>

<h2>1. Thông Tin Chúng Tôi Thu Thập</h2>
<p>Chúng tôi thu thập các loại thông tin sau:</p>
<ul>
<li><strong>Thông tin tài khoản:</strong> Tên đăng nhập, email, mật khẩu</li>
<li><strong>Thông tin sử dụng:</strong> Cách bạn sử dụng dịch vụ của chúng tôi</li>
<li><strong>Thông tin thiết bị:</strong> Địa chỉ IP, trình duyệt, hệ điều hành</li>
</ul>

<h2>2. Cách Chúng Tôi Sử Dụng Thông Tin</h2>
<p>Thông tin của bạn được sử dụng để:</p>
<ul>
<li>Cung cấp và cải thiện dịch vụ</li>
<li>Xử lý thanh toán và giao dịch</li>
<li>Gửi thông báo quan trọng</li>
<li>Hỗ trợ khách hàng</li>
</ul>

<h2>3. Bảo Mật Dữ Liệu</h2>
<p>Chúng tôi sử dụng các biện pháp bảo mật hiện đại để bảo vệ dữ liệu của bạn, bao gồm mã hóa SSL và lưu trữ an toàn.</p>

<h2>4. Chia Sẻ Thông Tin</h2>
<p>Chúng tôi không bán hoặc chia sẻ thông tin cá nhân của bạn với bên thứ ba, trừ khi:</p>
<ul>
<li>Có sự đồng ý của bạn</li>
<li>Theo yêu cầu pháp lý</li>
<li>Để bảo vệ quyền lợi hợp pháp của chúng tôi</li>
</ul>

<h2>5. Quyền Của Bạn</h2>
<p>Bạn có quyền:</p>
<ul>
<li>Truy cập và cập nhật thông tin cá nhân</li>
<li>Yêu cầu xóa dữ liệu</li>
<li>Rút lại sự đồng ý</li>
<li>Khiếu nại về việc xử lý dữ liệu</li>
</ul>

<p><strong>Liên hệ:</strong> Nếu có câu hỏi về chính sách này, vui lòng liên hệ với chúng tôi qua email support@seoaiwriter.com</p>',
        content_en = '<h1>Privacy Policy</h1>
<p>We are committed to protecting your personal information. This policy explains how we collect, use, and protect your data.</p>

<h2>1. Information We Collect</h2>
<p>We collect the following types of information:</p>
<ul>
<li><strong>Account information:</strong> Username, email, password</li>
<li><strong>Usage information:</strong> How you use our service</li>
<li><strong>Device information:</strong> IP address, browser, operating system</li>
</ul>

<h2>2. How We Use Information</h2>
<p>Your information is used to:</p>
<ul>
<li>Provide and improve our service</li>
<li>Process payments and transactions</li>
<li>Send important notifications</li>
<li>Provide customer support</li>
</ul>

<h2>3. Data Security</h2>
<p>We use modern security measures to protect your data, including SSL encryption and secure storage.</p>

<h2>4. Information Sharing</h2>
<p>We do not sell or share your personal information with third parties, except when:</p>
<ul>
<li>You give consent</li>
<li>Required by law</li>
<li>To protect our legitimate interests</li>
</ul>

<h2>5. Your Rights</h2>
<p>You have the right to:</p>
<ul>
<li>Access and update your personal information</li>
<li>Request data deletion</li>
<li>Withdraw consent</li>
<li>File complaints about data processing</li>
</ul>

<p><strong>Contact:</strong> If you have questions about this policy, please contact us at support@seoaiwriter.com</p>',
        last_updated = NOW(),
        updated_at = NOW()
      WHERE id = 'privacy-policy'
    `;

    // Update Data Deletion
    await sql`
      UPDATE legal_pages 
      SET 
        title_vi = 'Hướng Dẫn Xóa Dữ Liệu',
        title_en = 'Data Deletion Instructions',
        content_vi = '<h1>Hướng Dẫn Xóa Dữ Liệu</h1>
<p>Chúng tôi tôn trọng quyền riêng tư của bạn và cung cấp các cách để bạn có thể yêu cầu xóa dữ liệu cá nhân.</p>

<h2>1. Quyền Xóa Dữ Liệu</h2>
<p>Theo quy định pháp luật về bảo vệ dữ liệu, bạn có quyền yêu cầu chúng tôi xóa thông tin cá nhân của bạn trong các trường hợp sau:</p>
<ul>
<li>Thông tin không còn cần thiết cho mục đích ban đầu</li>
<li>Bạn rút lại sự đồng ý và không có cơ sở pháp lý khác</li>
<li>Dữ liệu được xử lý bất hợp pháp</li>
<li>Cần xóa để tuân thủ nghĩa vụ pháp lý</li>
</ul>

<h2>2. Cách Yêu Cầu Xóa Dữ Liệu</h2>
<p>Để yêu cầu xóa dữ liệu, bạn có thể:</p>
<ul>
<li><strong>Tự xóa trong tài khoản:</strong> Đăng nhập và xóa thông tin trong phần Cài đặt</li>
<li><strong>Gửi email:</strong> Liên hệ support@seoaiwriter.com với tiêu đề "Yêu cầu xóa dữ liệu"</li>
<li><strong>Điền form online:</strong> Sử dụng biểu mẫu bên dưới</li>
</ul>

<h2>3. Thông Tin Cần Cung Cấp</h2>
<p>Khi yêu cầu xóa dữ liệu, vui lòng cung cấp:</p>
<ul>
<li>Email đăng ký tài khoản</li>
<li>Tên đầy đủ</li>
<li>Lý do yêu cầu xóa</li>
<li>Tài khoản social media liên kết (nếu có)</li>
</ul>

<h2>4. Thời Gian Xử Lý</h2>
<p>Chúng tôi sẽ xử lý yêu cầu của bạn trong vòng <strong>30 ngày</strong> kể từ khi nhận được yêu cầu hợp lệ.</p>

<h2>5. Lưu Ý Quan Trọng</h2>
<ul>
<li>Một số dữ liệu có thể được giữ lại theo yêu cầu pháp lý</li>
<li>Dữ liệu backup có thể mất thời gian lâu hơn để xóa hoàn toàn</li>
<li>Sau khi xóa, bạn sẽ không thể khôi phục dữ liệu</li>
</ul>

<p><strong>Liên hệ hỗ trợ:</strong> support@seoaiwriter.com | Hotline: 1900-xxx-xxx</p>',
        content_en = '<h1>Data Deletion Instructions</h1>
<p>We respect your privacy and provide ways for you to request deletion of your personal data.</p>

<h2>1. Right to Data Deletion</h2>
<p>Under data protection regulations, you have the right to request us to delete your personal information in the following cases:</p>
<ul>
<li>Information is no longer necessary for the original purpose</li>
<li>You withdraw consent and there is no other legal basis</li>
<li>Data is processed unlawfully</li>
<li>Deletion is needed to comply with legal obligations</li>
</ul>

<h2>2. How to Request Data Deletion</h2>
<p>To request data deletion, you can:</p>
<ul>
<li><strong>Self-delete in account:</strong> Login and delete information in Settings</li>
<li><strong>Send email:</strong> Contact support@seoaiwriter.com with subject "Data Deletion Request"</li>
<li><strong>Fill online form:</strong> Use the form below</li>
</ul>

<h2>3. Required Information</h2>
<p>When requesting data deletion, please provide:</p>
<ul>
<li>Registered email address</li>
<li>Full name</li>
<li>Reason for deletion request</li>
<li>Linked social media accounts (if any)</li>
</ul>

<h2>4. Processing Time</h2>
<p>We will process your request within <strong>30 days</strong> from receiving a valid request.</p>

<h2>5. Important Notes</h2>
<ul>
<li>Some data may be retained as required by law</li>
<li>Backup data may take longer to completely delete</li>
<li>After deletion, you cannot recover the data</li>
</ul>

<p><strong>Support contact:</strong> support@seoaiwriter.com | Hotline: 1900-xxx-xxx</p>',
        last_updated = NOW(),
        updated_at = NOW()
      WHERE id = 'data-deletion'
    `;

    // Update Terms of Service
    await sql`
      UPDATE legal_pages 
      SET 
        title_vi = 'Điều Khoản Dịch Vụ',
        title_en = 'Terms of Service',
        content_vi = '<h1>Điều Khoản Dịch Vụ</h1>
<p>Chào mừng bạn đến với SEO AI Writer. Bằng cách sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ các điều khoản sau.</p>

<h2>1. Chấp Nhận Điều Khoản</h2>
<p>Khi truy cập và sử dụng SEO AI Writer, bạn xác nhận rằng bạn đã đọc, hiểu và đồng ý tuân thủ các điều khoản này.</p>

<h2>2. Mô Tả Dịch Vụ</h2>
<p>SEO AI Writer cung cấp:</p>
<ul>
<li><strong>Tạo nội dung AI:</strong> Sử dụng trí tuệ nhân tạo để tạo bài viết, blog, content marketing</li>
<li><strong>Tối ưu SEO:</strong> Phân tích từ khóa và tối ưu hóa nội dung cho công cụ tìm kiếm</li>
<li><strong>Tạo hình ảnh:</strong> Sinh hình ảnh tự động phù hợp với nội dung</li>
<li><strong>Quản lý nội dung:</strong> Lưu trữ và tổ chức thư viện nội dung</li>
<li><strong>Tích hợp mạng xã hội:</strong> Đăng bài tự động lên các nền tảng</li>
</ul>

<h2>3. Tài Khoản Người Dùng</h2>
<p>Bạn có trách nhiệm:</p>
<ul>
<li>Cung cấp thông tin chính xác khi đăng ký</li>
<li>Bảo mật thông tin đăng nhập</li>
<li>Không chia sẻ tài khoản với người khác</li>
<li>Thông báo ngay nếu phát hiện tài khoản bị xâm nhập</li>
</ul>

<h2>4. Chính Sách Sử Dụng</h2>
<p>Bạn <strong>KHÔNG được phép:</strong></p>
<ul>
<li>Tạo nội dung bất hợp pháp, có hại hoặc vi phạm đạo đức</li>
<li>Vi phạm bản quyền hoặc quyền sở hữu trí tuệ</li>
<li>Spam, lừa đảo hoặc làm phiền người khác</li>
<li>Can thiệp vào hoạt động của hệ thống</li>
<li>Sử dụng dịch vụ cho mục đích thương mại không được phép</li>
</ul>

<h2>5. Thanh Toán và Hoàn Tiền</h2>
<ul>
<li><strong>Thanh toán:</strong> Qua cổng thanh toán an toàn</li>
<li><strong>Hoàn tiền:</strong> Trong vòng 7 ngày đối với gói chưa sử dụng</li>
<li><strong>Credits:</strong> Không hoàn tiền đối với credits đã sử dụng</li>
<li><strong>Gia hạn:</strong> Tự động gia hạn trừ khi hủy trước 24h</li>
</ul>

<h2>6. Sở Hữu Trí Tuệ</h2>
<ul>
<li>Bạn sở hữu nội dung bạn tạo ra</li>
<li>Chúng tôi sở hữu mã nguồn và công nghệ</li>
<li>Bạn cấp cho chúng tôi quyền sử dụng nội dung để cải thiện dịch vụ</li>
</ul>

<h2>7. Giới Hạn Trách Nhiệm</h2>
<ul>
<li>Dịch vụ được cung cấp "như hiện tại"</li>
<li>Không đảm bảo hoạt động liên tục 100%</li>
<li>Trách nhiệm tối đa bằng số tiền bạn đã thanh toán</li>
</ul>

<h2>8. Chấm Dứt Dịch Vụ</h2>
<p>Chúng tôi có quyền tạm ngừng hoặc chấm dứt dịch vụ nếu bạn vi phạm điều khoản.</p>

<p><strong>Cập nhật lần cuối:</strong> 25/07/2025</p>
<p><strong>Liên hệ:</strong> support@seoaiwriter.com</p>',
        content_en = '<h1>Terms of Service</h1>
<p>Welcome to SEO AI Writer. By using our service, you agree to comply with the following terms.</p>

<h2>1. Acceptance of Terms</h2>
<p>By accessing and using SEO AI Writer, you acknowledge that you have read, understood, and agree to be bound by these terms.</p>

<h2>2. Service Description</h2>
<p>SEO AI Writer provides:</p>
<ul>
<li><strong>AI Content Creation:</strong> Use artificial intelligence to create articles, blogs, marketing content</li>
<li><strong>SEO Optimization:</strong> Keyword analysis and content optimization for search engines</li>
<li><strong>Image Generation:</strong> Automatic image generation suitable for content</li>
<li><strong>Content Management:</strong> Storage and organization of content library</li>
<li><strong>Social Media Integration:</strong> Automatic posting to platforms</li>
</ul>

<h2>3. User Accounts</h2>
<p>You are responsible for:</p>
<ul>
<li>Providing accurate information when registering</li>
<li>Securing login credentials</li>
<li>Not sharing accounts with others</li>
<li>Immediately reporting suspected account breaches</li>
</ul>

<h2>4. Usage Policy</h2>
<p>You <strong>MAY NOT:</strong></p>
<ul>
<li>Create illegal, harmful, or unethical content</li>
<li>Violate copyrights or intellectual property rights</li>
<li>Spam, fraud, or harass others</li>
<li>Interfere with system operations</li>
<li>Use service for unauthorized commercial purposes</li>
</ul>

<h2>5. Payment and Refunds</h2>
<ul>
<li><strong>Payment:</strong> Through secure payment gateways</li>
<li><strong>Refunds:</strong> Within 7 days for unused packages</li>
<li><strong>Credits:</strong> No refunds for used credits</li>
<li><strong>Renewal:</strong> Auto-renewal unless canceled 24h before</li>
</ul>

<h2>6. Intellectual Property</h2>
<ul>
<li>You own the content you create</li>
<li>We own the source code and technology</li>
<li>You grant us rights to use content to improve service</li>
</ul>

<h2>7. Limitation of Liability</h2>
<ul>
<li>Service provided "as is"</li>
<li>No guarantee of 100% continuous operation</li>
<li>Maximum liability equals amount paid</li>
</ul>

<h2>8. Service Termination</h2>
<p>We reserve the right to suspend or terminate service if you violate these terms.</p>

<p><strong>Last updated:</strong> July 25, 2025</p>
<p><strong>Contact:</strong> support@seoaiwriter.com</p>',
        last_updated = NOW(),
        updated_at = NOW()
      WHERE id = 'terms-of-service'
    `;

    // Verify the updates
    const updatedPages = await sql`SELECT id, title_vi, path, LENGTH(content_vi) as content_length FROM legal_pages ORDER BY id`;
    console.log('\n✅ Updated pages:');
    updatedPages.forEach(page => {
      console.log(`- ${page.id}: ${page.title_vi} (${page.path}) - ${page.content_length} chars`);
    });
    
    console.log('\n🎉 Legal pages content fixed successfully!');
    console.log('Now each page has unique content:');
    console.log('- Privacy Policy: Detailed privacy information');
    console.log('- Data Deletion: Step-by-step deletion instructions');
    console.log('- Terms of Service: Complete terms and conditions');
    
  } catch (error) {
    console.error('❌ Error fixing legal pages:', error);
    process.exit(1);
  }
}

fixLegalPagesContent();
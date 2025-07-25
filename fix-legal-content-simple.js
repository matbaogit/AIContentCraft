import { db } from './server/storage.js';

async function updateLegalPages() {
  try {
    console.log('🔧 Updating legal pages with unique content...');
    
    // Check if storage has the method we need
    if (typeof db.updateLegalPage === 'function') {
      
      // Update Privacy Policy  
      await db.updateLegalPage('privacy-policy', {
        title_vi: 'Chính Sách Bảo Mật',
        title_en: 'Privacy Policy',
        content_vi: `<h1>Chính Sách Bảo Mật</h1>
<p>Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn. Chính sách này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ dữ liệu của bạn.</p>

<h2>1. Thông Tin Chúng Tôi Thu Thập</h2>
<ul>
<li><strong>Thông tin tài khoản:</strong> Tên đăng nhập, email, mật khẩu</li>
<li><strong>Thông tin sử dụng:</strong> Cách bạn sử dụng dịch vụ của chúng tôi</li>
<li><strong>Thông tin thiết bị:</strong> Địa chỉ IP, trình duyệt, hệ điều hành</li>
</ul>

<h2>2. Cách Chúng Tôi Sử Dụng Thông Tin</h2>
<ul>
<li>Cung cấp và cải thiện dịch vụ</li>
<li>Xử lý thanh toán và giao dịch</li>
<li>Gửi thông báo quan trọng</li>
<li>Hỗ trợ khách hàng</li>
</ul>

<h2>3. Bảo Mật Dữ Liệu</h2>
<p>Chúng tôi sử dụng các biện pháp bảo mật hiện đại để bảo vệ dữ liệu của bạn, bao gồm mã hóa SSL và lưu trữ an toàn.</p>

<p><strong>Liên hệ:</strong> support@seoaiwriter.com</p>`,
        content_en: `<h1>Privacy Policy</h1>
<p>We are committed to protecting your personal information. This policy explains how we collect, use, and protect your data.</p>

<h2>1. Information We Collect</h2>
<ul>
<li><strong>Account information:</strong> Username, email, password</li>
<li><strong>Usage information:</strong> How you use our service</li>
<li><strong>Device information:</strong> IP address, browser, operating system</li>
</ul>

<h2>2. How We Use Information</h2>
<ul>
<li>Provide and improve our service</li>
<li>Process payments and transactions</li>
<li>Send important notifications</li>
<li>Provide customer support</li>
</ul>

<h2>3. Data Security</h2>
<p>We use modern security measures to protect your data, including SSL encryption and secure storage.</p>

<p><strong>Contact:</strong> support@seoaiwriter.com</p>`
      });

      // Update Data Deletion
      await db.updateLegalPage('data-deletion', {
        title_vi: 'Hướng Dẫn Xóa Dữ Liệu', 
        title_en: 'Data Deletion Instructions',
        content_vi: `<h1>Hướng Dẫn Xóa Dữ Liệu</h1>
<p>Chúng tôi tôn trọng quyền riêng tư của bạn và cung cấp các cách để bạn có thể yêu cầu xóa dữ liệu cá nhân.</p>

<h2>1. Quyền Xóa Dữ Liệu</h2>
<p>Bạn có quyền yêu cầu chúng tôi xóa thông tin cá nhân của bạn trong các trường hợp sau:</p>
<ul>
<li>Thông tin không còn cần thiết cho mục đích ban đầu</li>
<li>Bạn rút lại sự đồng ý và không có cơ sở pháp lý khác</li>
<li>Dữ liệu được xử lý bất hợp pháp</li>
</ul>

<h2>2. Cách Yêu Cầu Xóa Dữ Liệu</h2>
<ul>
<li><strong>Tự xóa trong tài khoản:</strong> Đăng nhập và xóa thông tin trong phần Cài đặt</li>
<li><strong>Gửi email:</strong> Liên hệ support@seoaiwriter.com với tiêu đề "Yêu cầu xóa dữ liệu"</li>
</ul>

<h2>3. Thời Gian Xử Lý</h2>
<p>Chúng tôi sẽ xử lý yêu cầu của bạn trong vòng <strong>30 ngày</strong> kể từ khi nhận được yêu cầu hợp lệ.</p>

<p><strong>Liên hệ hỗ trợ:</strong> support@seoaiwriter.com</p>`,
        content_en: `<h1>Data Deletion Instructions</h1>
<p>We respect your privacy and provide ways for you to request deletion of your personal data.</p>

<h2>1. Right to Data Deletion</h2>
<p>You have the right to request us to delete your personal information in the following cases:</p>
<ul>
<li>Information is no longer necessary for the original purpose</li>
<li>You withdraw consent and there is no other legal basis</li>
<li>Data is processed unlawfully</li>
</ul>

<h2>2. How to Request Data Deletion</h2>
<ul>
<li><strong>Self-delete in account:</strong> Login and delete information in Settings</li>
<li><strong>Send email:</strong> Contact support@seoaiwriter.com with subject "Data Deletion Request"</li>
</ul>

<h2>3. Processing Time</h2>
<p>We will process your request within <strong>30 days</strong> from receiving a valid request.</p>

<p><strong>Support contact:</strong> support@seoaiwriter.com</p>`
      });

      // Update Terms of Service
      await db.updateLegalPage('terms-of-service', {
        title_vi: 'Điều Khoản Dịch Vụ',
        title_en: 'Terms of Service', 
        content_vi: `<h1>Điều Khoản Dịch Vụ</h1>
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
</ul>

<h2>3. Chính Sách Sử Dụng</h2>
<p>Bạn <strong>KHÔNG được phép:</strong></p>
<ul>
<li>Tạo nội dung bất hợp pháp, có hại hoặc vi phạm đạo đức</li>
<li>Vi phạm bản quyền hoặc quyền sở hữu trí tuệ</li>
<li>Spam, lừa đảo hoặc làm phiền người khác</li>
<li>Can thiệp vào hoạt động của hệ thống</li>
</ul>

<h2>4. Thanh Toán và Hoàn Tiền</h2>
<ul>
<li><strong>Thanh toán:</strong> Qua cổng thanh toán an toàn</li>
<li><strong>Hoàn tiền:</strong> Trong vòng 7 ngày đối với gói chưa sử dụng</li>
<li><strong>Credits:</strong> Không hoàn tiền đối với credits đã sử dụng</li>
</ul>

<p><strong>Cập nhật lần cuối:</strong> 25/07/2025</p>
<p><strong>Liên hệ:</strong> support@seoaiwriter.com</p>`,
        content_en: `<h1>Terms of Service</h1>
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
</ul>

<h2>3. Usage Policy</h2>
<p>You <strong>MAY NOT:</strong></p>
<ul>
<li>Create illegal, harmful, or unethical content</li>
<li>Violate copyrights or intellectual property rights</li>
<li>Spam, fraud, or harass others</li>
<li>Interfere with system operations</li>
</ul>

<h2>4. Payment and Refunds</h2>
<ul>
<li><strong>Payment:</strong> Through secure payment gateways</li>
<li><strong>Refunds:</strong> Within 7 days for unused packages</li>
<li><strong>Credits:</strong> No refunds for used credits</li>
</ul>

<p><strong>Last updated:</strong> July 25, 2025</p>
<p><strong>Contact:</strong> support@seoaiwriter.com</p>`
      });

      console.log('✅ All legal pages updated with unique content!');
      
    } else {
      console.log('❌ updateLegalPage method not found in storage');
    }
    
  } catch (error) {
    console.error('❌ Error updating legal pages:', error);
  }
}

updateLegalPages();
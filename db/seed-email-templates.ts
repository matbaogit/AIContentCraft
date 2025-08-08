import { db } from "./index";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

// Sync existing email templates from current system with updated branding
const currentEmailTemplates = [
  {
    type: "verification" as const,
    name: "Email xác thực tài khoản (Từ hệ thống hiện tại)",
    subject: "Xác nhận tài khoản ToolBox của bạn",
    htmlContent: `
  <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
    <div style="background-color: #1e3a8a; padding: 20px; text-align: center;">
      <h1 style="color: white; margin: 0;">ToolBox</h1>
    </div>
    <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
      <h2 style="color: #1e3a8a;">Xác nhận địa chỉ email của bạn</h2>
      <p>Chào {username},</p>
      <p>Cảm ơn bạn đã đăng ký tài khoản ToolBox. Để hoàn tất quá trình đăng ký, vui lòng xác nhận địa chỉ email của bạn bằng cách nhấp vào nút bên dưới:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{verificationUrl}" style="background-color: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Xác nhận Email</a>
      </div>
      <p>Hoặc bạn có thể copy và dán đường dẫn này vào trình duyệt của bạn:</p>
      <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">{verificationUrl}</p>
      <p>Liên kết này sẽ hết hạn sau 24 giờ.</p>
      <p>Nếu bạn không đăng ký tài khoản tại ToolBox, bạn có thể bỏ qua email này.</p>
      <p>Trân trọng,<br>Đội ngũ ToolBox</p>
    </div>
    <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
      <p>© ${new Date().getFullYear()} ToolBox. Tất cả các quyền được bảo lưu.</p>
    </div>
  </div>
    `,
    textContent: `
Xác nhận tài khoản ToolBox của bạn

Chào {username},

Cảm ơn bạn đã đăng ký tài khoản ToolBox. Để hoàn tất quá trình đăng ký, vui lòng truy cập vào liên kết sau để xác nhận địa chỉ email của bạn:

{verificationUrl}

Liên kết này sẽ hết hạn sau 24 giờ.

Nếu bạn không đăng ký tài khoản tại ToolBox, bạn có thể bỏ qua email này.

Trân trọng,
Đội ngũ ToolBox
    `,
    variables: ["{username}", "{verificationUrl}"],
    isActive: true
  },
  {
    type: "reset_password" as const,
    name: "Email đặt lại mật khẩu (Từ hệ thống hiện tại)",
    subject: "Đặt lại mật khẩu ToolBox của bạn",
    htmlContent: `
  <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
    <div style="background-color: #1e3a8a; padding: 20px; text-align: center;">
      <h1 style="color: white; margin: 0;">ToolBox</h1>
    </div>
    <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
      <h2 style="color: #1e3a8a;">Đặt lại mật khẩu của bạn</h2>
      <p>Chào {username},</p>
      <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản ToolBox của bạn. Nhấp vào nút bên dưới để đặt mật khẩu mới:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{resetUrl}" style="background-color: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Đặt lại mật khẩu</a>
      </div>
      <p>Hoặc bạn có thể copy và dán đường dẫn này vào trình duyệt của bạn:</p>
      <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">{resetUrl}</p>
      <p>Liên kết này sẽ hết hạn sau 1 giờ.</p>
      <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này hoặc liên hệ với bộ phận hỗ trợ nếu bạn có bất kỳ câu hỏi nào.</p>
      <p>Trân trọng,<br>Đội ngũ ToolBox</p>
    </div>
    <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
      <p>© ${new Date().getFullYear()} ToolBox. Tất cả các quyền được bảo lưu.</p>
    </div>
  </div>
    `,
    textContent: `
Đặt lại mật khẩu ToolBox của bạn

Chào {username},

Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản ToolBox của bạn. Vui lòng truy cập vào liên kết sau để đặt mật khẩu mới:

{resetUrl}

Liên kết này sẽ hết hạn sau 1 giờ.

Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này hoặc liên hệ với bộ phận hỗ trợ nếu bạn có bất kỳ câu hỏi nào.

Trân trọng,
Đội ngũ ToolBox
    `,
    variables: ["{username}", "{resetUrl}"],
    isActive: true
  },
  {
    type: "welcome" as const,
    name: "Email chào mừng (Từ hệ thống hiện tại)",
    subject: "Chào mừng bạn đến với ToolBox!",
    htmlContent: `
  <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
    <div style="background-color: #1e3a8a; padding: 20px; text-align: center;">
      <h1 style="color: white; margin: 0;">ToolBox</h1>
    </div>
    <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
      <h2 style="color: #1e3a8a;">Chào mừng bạn đến với ToolBox!</h2>
      <p>Chào {username},</p>
      <p>Chúng tôi rất vui mừng khi bạn đã tham gia cùng chúng tôi! Tài khoản của bạn đã được kích hoạt thành công và bạn đã sẵn sàng bắt đầu tạo nội dung tuyệt vời được tối ưu hóa cho SEO.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{loginUrl}" style="background-color: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Đăng nhập ngay</a>
      </div>
      <h3 style="color: #1e3a8a;">Bắt đầu với ToolBox</h3>
      <ul>
        <li>Tạo bài viết được tối ưu hóa SEO dựa trên các từ khóa mục tiêu của bạn</li>
        <li>Sử dụng AI để tạo nội dung đa ngôn ngữ</li>
        <li>Xuất bản trực tiếp lên WordPress hoặc mạng xã hội</li>
        <li>Theo dõi hiệu suất nội dung của bạn</li>
      </ul>
      <p>Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với đội hỗ trợ của chúng tôi.</p>
      <p>Trân trọng,<br>Đội ngũ ToolBox</p>
    </div>
    <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
      <p>© ${new Date().getFullYear()} ToolBox. Tất cả các quyền được bảo lưu.</p>
    </div>
  </div>
    `,
    textContent: `
Chào mừng bạn đến với ToolBox!

Chào {username},

Chúng tôi rất vui mừng khi bạn đã tham gia cùng chúng tôi! Tài khoản của bạn đã được kích hoạt thành công và bạn đã sẵn sàng bắt đầu tạo nội dung tuyệt vời được tối ưu hóa cho SEO.

Bạn có thể đăng nhập tại: {loginUrl}

Bắt đầu với ToolBox:
- Tạo bài viết được tối ưu hóa SEO dựa trên các từ khóa mục tiêu của bạn
- Sử dụng AI để tạo nội dung đa ngôn ngữ
- Xuất bản trực tiếp lên WordPress hoặc mạng xã hội
- Theo dõi hiệu suất nội dung của bạn

Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với đội hỗ trợ của chúng tôi.

Trân trọng,
Đội ngũ ToolBox
    `,
    variables: ["{username}", "{loginUrl}"],
    isActive: true
  }
];

const defaultEmailTemplates = [
  {
    type: "verification" as const,
    name: "Email xác thực tài khoản",
    subject: "Xác nhận tài khoản ToolBox của bạn",
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Xác nhận tài khoản</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Chào mừng đến với ToolBox!</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Xin chào {username},</h2>
          <p style="font-size: 16px; margin-bottom: 25px;">
            Cảm ơn bạn đã đăng ký tài khoản ToolBox! Để hoàn tất quá trình đăng ký và bảo mật tài khoản của bạn, 
            vui lòng xác nhận địa chỉ email bằng cách nhấp vào nút bên dưới:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Xác nhận tài khoản
            </a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 25px;">
            Nếu bạn không thể nhấp vào nút trên, hãy sao chép và dán liên kết sau vào trình duyệt của bạn:
          </p>
          <p style="font-size: 12px; color: #888; word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">
            {verificationUrl}
          </p>
          <p style="font-size: 14px; color: #666; margin-top: 25px;">
            Liên kết này sẽ hết hạn sau 24 giờ. Nếu bạn không yêu cầu tạo tài khoản này, vui lòng bỏ qua email này.
          </p>
        </div>
        <div style="text-align: center; margin-top: 20px; padding: 20px; color: #888; font-size: 12px;">
          <p>© 2024 ToolBox. Mọi quyền được bảo lưu.</p>
        </div>
      </body>
      </html>
    `,
    textContent: `
Chào mừng đến với ToolBox!

Xin chào {username},

Cảm ơn bạn đã đăng ký tài khoản ToolBox! Để hoàn tất quá trình đăng ký và bảo mật tài khoản của bạn, vui lòng xác nhận địa chỉ email bằng cách truy cập liên kết bên dưới:

{verificationUrl}

Liên kết này sẽ hết hạn sau 24 giờ. Nếu bạn không yêu cầu tạo tài khoản này, vui lòng bỏ qua email này.

Trân trọng,
Đội ngũ ToolBox

© 2024 ToolBox. Mọi quyền được bảo lưu.
    `,
    variables: ["{username}", "{verificationUrl}"],
    isActive: true
  },
  {
    type: "reset_password" as const,
    name: "Email đặt lại mật khẩu",
    subject: "Yêu cầu đặt lại mật khẩu ToolBox",
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Đặt lại mật khẩu</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Đặt lại mật khẩu</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Xin chào {username},</h2>
          <p style="font-size: 16px; margin-bottom: 25px;">
            Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản ToolBox của bạn. 
            Để đặt lại mật khẩu, vui lòng nhấp vào nút bên dưới:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{resetUrl}" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Đặt lại mật khẩu
            </a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 25px;">
            Nếu bạn không thể nhấp vào nút trên, hãy sao chép và dán liên kết sau vào trình duyệt của bạn:
          </p>
          <p style="font-size: 12px; color: #888; word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">
            {resetUrl}
          </p>
          <p style="font-size: 14px; color: #666; margin-top: 25px;">
            Liên kết này sẽ hết hạn sau 1 giờ vì lý do bảo mật. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này và mật khẩu của bạn sẽ không thay đổi.
          </p>
        </div>
        <div style="text-align: center; margin-top: 20px; padding: 20px; color: #888; font-size: 12px;">
          <p>© 2024 ToolBox. Mọi quyền được bảo lưu.</p>
        </div>
      </body>
      </html>
    `,
    textContent: `
Đặt lại mật khẩu ToolBox

Xin chào {username},

Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản ToolBox của bạn. Để đặt lại mật khẩu, vui lòng truy cập liên kết bên dưới:

{resetUrl}

Liên kết này sẽ hết hạn sau 1 giờ vì lý do bảo mật. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này và mật khẩu của bạn sẽ không thay đổi.

Trân trọng,
Đội ngũ ToolBox

© 2024 ToolBox. Mọi quyền được bảo lưu.
    `,
    variables: ["{username}", "{resetUrl}"],
    isActive: true
  },
  {
    type: "welcome" as const,
    name: "Email chào mừng",
    subject: "Chào mừng bạn đến với ToolBox - Hướng dẫn bắt đầu",
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chào mừng</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Chào mừng đến với ToolBox!</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Xin chào {username},</h2>
          <p style="font-size: 16px; margin-bottom: 25px;">
            Chúc mừng! Tài khoản ToolBox của bạn đã được kích hoạt thành công. 
            Bây giờ bạn có thể bắt đầu sử dụng tất cả các tính năng tuyệt vời mà chúng tôi cung cấp.
          </p>
          
          <h3 style="color: #333; margin-top: 30px;">Những gì bạn có thể làm với ToolBox:</h3>
          <ul style="font-size: 15px; padding-left: 20px;">
            <li style="margin-bottom: 10px;">🚀 Tạo nội dung SEO chất lượng cao với AI</li>
            <li style="margin-bottom: 10px;">🎨 Tạo hình ảnh tự động cho bài viết</li>
            <li style="margin-bottom: 10px;">📱 Đăng tự động lên mạng xã hội</li>
            <li style="margin-bottom: 10px;">📊 Phân tích hiệu suất nội dung</li>
            <li style="margin-bottom: 10px;">🎯 Tối ưu hóa SEO tự động</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{loginUrl}" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Bắt đầu sử dụng ngay
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 25px;">
            Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với đội ngũ hỗ trợ của chúng tôi. 
            Chúng tôi luôn sẵn sàng giúp đỡ bạn thành công!
          </p>
        </div>
        <div style="text-align: center; margin-top: 20px; padding: 20px; color: #888; font-size: 12px;">
          <p>© 2024 ToolBox. Mọi quyền được bảo lưu.</p>
        </div>
      </body>
      </html>
    `,
    textContent: `
🎉 Chào mừng đến với ToolBox!

Xin chào {username},

Chúc mừng! Tài khoản ToolBox của bạn đã được kích hoạt thành công. Bây giờ bạn có thể bắt đầu sử dụng tất cả các tính năng tuyệt vời mà chúng tôi cung cấp.

Những gì bạn có thể làm với ToolBox:
• Tạo nội dung SEO chất lượng cao với AI
• Tạo hình ảnh tự động cho bài viết
• Đăng tự động lên mạng xã hội
• Phân tích hiệu suất nội dung
• Tối ưu hóa SEO tự động

Bắt đầu ngay: {loginUrl}

Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với đội ngũ hỗ trợ của chúng tôi. Chúng tôi luôn sẵn sàng giúp đỡ bạn thành công!

Trân trọng,
Đội ngũ ToolBox

© 2024 ToolBox. Mọi quyền được bảo lưu.
    `,
    variables: ["{username}", "{loginUrl}"],
    isActive: true
  },
  {
    type: "notification" as const,
    name: "Email thông báo chung",
    subject: "Thông báo từ ToolBox",
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thông báo</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: #333; margin: 0; font-size: 28px;">📢 Thông báo quan trọng</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Xin chào {username},</h2>
          <div style="font-size: 16px; margin-bottom: 25px; background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #4facfe;">
            {message}
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 25px;">
            Cảm ơn bạn đã sử dụng ToolBox. Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với đội ngũ hỗ trợ của chúng tôi.
          </p>
        </div>
        <div style="text-align: center; margin-top: 20px; padding: 20px; color: #888; font-size: 12px;">
          <p>© 2024 ToolBox. Mọi quyền được bảo lưu.</p>
        </div>
      </body>
      </html>
    `,
    textContent: `
📢 Thông báo từ ToolBox

Xin chào {username},

{message}

Cảm ơn bạn đã sử dụng ToolBox. Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với đội ngũ hỗ trợ của chúng tôi.

Trân trọng,
Đội ngũ ToolBox

© 2024 ToolBox. Mọi quyền được bảo lưu.
    `,
    variables: ["{username}", "{message}"],
    isActive: true
  }
];

export async function seedEmailTemplates() {
  try {
    console.log("🌱 Seeding email templates...");
    
    // First, sync current system templates with updated branding
    console.log("📧 Syncing current system templates...");
    for (const template of currentEmailTemplates) {
      // Check if template already exists
      const existing = await db.query.emailTemplates.findFirst({
        where: eq(schema.emailTemplates.type, template.type)
      });
      
      if (!existing) {
        await db.insert(schema.emailTemplates).values(template);
        console.log(`✅ Created current template: ${template.name}`);
      } else {
        // Update existing template with current system content
        await db.update(schema.emailTemplates)
          .set({
            name: template.name,
            subject: template.subject,
            htmlContent: template.htmlContent,
            textContent: template.textContent,
            variables: template.variables,
            isActive: template.isActive,
            updatedAt: new Date()
          })
          .where(eq(schema.emailTemplates.type, template.type));
        console.log(`🔄 Updated current template: ${template.name}`);
      }
    }
    
    // Then, seed default modern templates (if they don't exist)
    console.log("🎨 Adding modern email templates...");
    for (const template of defaultEmailTemplates) {
      // Check if a modern template with this name already exists
      const existing = await db.query.emailTemplates.findFirst({
        where: eq(schema.emailTemplates.name, template.name)
      });
      
      if (!existing) {
        await db.insert(schema.emailTemplates).values(template);
        console.log(`✅ Created modern template: ${template.name}`);
      } else {
        console.log(`⏭️  Modern template already exists: ${template.name}`);
      }
    }
    
    console.log("🎉 Email templates seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding email templates:", error);
    throw error;
  }
}

// Run seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedEmailTemplates()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
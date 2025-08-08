import { db } from "./index";
import * as schema from "@shared/schema";

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
    console.log("🌱 Seeding default email templates...");
    
    for (const template of defaultEmailTemplates) {
      // Check if template already exists
      const existing = await db.query.emailTemplates.findFirst({
        where: eq(schema.emailTemplates.type, template.type)
      });
      
      if (!existing) {
        await db.insert(schema.emailTemplates).values(template);
        console.log(`✅ Created email template: ${template.name}`);
      } else {
        console.log(`⏭️  Email template already exists: ${template.name}`);
      }
    }
    
    console.log("🎉 Email templates seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding email templates:", error);
    throw error;
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seedEmailTemplates()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
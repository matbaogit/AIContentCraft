import { storage } from './storage';

interface EmailTemplateData {
  [key: string]: string;
}

/**
 * Service để lấy và xử lý email templates từ database
 */
export class DynamicEmailTemplateService {
  
  /**
   * Thay thế biến trong template
   */
  private replaceVariables(content: string, data: EmailTemplateData): string {
    let result = content;
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  }

  /**
   * Lấy email template theo loại
   */
  async getEmailTemplate(type: string, data: EmailTemplateData): Promise<{
    subject: string;
    html: string;
    text: string;
  } | null> {
    try {
      // Lấy template từ database
      const template = await storage.getEmailTemplateByType(type);
      
      if (!template || !template.isActive) {
        console.warn(`No active email template found for type: ${type}`);
        return null;
      }

      // Thay thế biến trong nội dung
      const subject = this.replaceVariables(template.subject, data);
      const html = this.replaceVariables(template.htmlContent, data);
      const text = this.replaceVariables(template.textContent, data);

      return {
        subject,
        html,
        text
      };
    } catch (error) {
      console.error(`Error getting email template for type ${type}:`, error);
      return null;
    }
  }

  /**
   * Lấy email xác thực
   */
  async getVerificationEmailTemplate(options: {
    username: string;
    verificationUrl: string;
  }): Promise<{ subject: string; html: string; text: string } | null> {
    return this.getEmailTemplate('verification', {
      username: options.username,
      verificationUrl: options.verificationUrl
    });
  }

  /**
   * Lấy email đặt lại mật khẩu
   */
  async getResetPasswordEmailTemplate(options: {
    username: string;
    resetUrl: string;
  }): Promise<{ subject: string; html: string; text: string } | null> {
    return this.getEmailTemplate('reset_password', {
      username: options.username,
      resetUrl: options.resetUrl
    });
  }

  /**
   * Lấy email chào mừng
   */
  async getWelcomeEmailTemplate(options: {
    username: string;
    loginUrl: string;
  }): Promise<{ subject: string; html: string; text: string } | null> {
    return this.getEmailTemplate('welcome', {
      username: options.username,
      loginUrl: options.loginUrl
    });
  }

  /**
   * Lấy email thông báo
   */
  async getNotificationEmailTemplate(options: {
    username: string;
    message: string;
  }): Promise<{ subject: string; html: string; text: string } | null> {
    return this.getEmailTemplate('notification', {
      username: options.username,
      message: options.message
    });
  }
}

// Export instance để sử dụng
export const dynamicEmailTemplateService = new DynamicEmailTemplateService();
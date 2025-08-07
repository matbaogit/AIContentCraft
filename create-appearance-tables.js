import { db } from './db/index.ts';
import { appearanceSettings, appearanceHistory, uploadedAssets } from './shared/schema.ts';

async function createAppearanceTables() {
  try {
    console.log('Creating appearance tables and inserting default data...');
    
    // Insert default SEO settings
    const defaultSettings = [
      // Vietnamese SEO
      { type: 'seo_meta', key: 'site_title', value: 'SEO AI Writer - Tạo nội dung SEO tự động', language: 'vi' },
      { type: 'seo_meta', key: 'site_description', value: 'Công cụ AI tạo nội dung SEO chất lượng cao, tối ưu hóa từ khóa và tăng thứ hạng tìm kiếm', language: 'vi' },
      { type: 'seo_meta', key: 'site_keywords', value: 'SEO, AI, nội dung, tạo bài viết, tối ưu hóa, từ khóa', language: 'vi' },
      
      // English SEO
      { type: 'seo_meta', key: 'site_title', value: 'SEO AI Writer - Automated Content Generation', language: 'en' },
      { type: 'seo_meta', key: 'site_description', value: 'High-quality AI-powered SEO content generator, keyword optimization and search ranking improvement', language: 'en' },
      { type: 'seo_meta', key: 'site_keywords', value: 'SEO, AI, content, article generation, optimization, keywords', language: 'en' },
      
      // Header settings
      { type: 'header', key: 'site_name', value: 'SEO AI Writer', language: 'vi' },
      { type: 'header', key: 'site_name', value: 'SEO AI Writer', language: 'en' },
      
      // Login page settings
      { type: 'login_page', key: 'title', value: 'Chào mừng trở lại!', language: 'vi' },
      { type: 'login_page', key: 'welcome_text', value: 'Đăng nhập để tiếp tục sử dụng công cụ tạo nội dung SEO', language: 'vi' },
      { type: 'login_page', key: 'title', value: 'Welcome Back!', language: 'en' },
      { type: 'login_page', key: 'welcome_text', value: 'Login to continue using our SEO content generation tool', language: 'en' },
      
      // Footer settings
      { type: 'footer', key: 'copyright', value: '© 2025 SEO AI Writer. Tất cả quyền được bảo lưu.', language: 'vi' },
      { type: 'footer', key: 'copyright', value: '© 2025 SEO AI Writer. All rights reserved.', language: 'en' }
    ];

    for (const setting of defaultSettings) {
      try {
        await db.insert(appearanceSettings).values({
          type: setting.type,
          key: setting.key,
          value: setting.value,
          language: setting.language,
          isActive: true
        }).onConflictDoNothing();
      } catch (error) {
        // Ignore conflicts
      }
    }
    
    console.log('✅ Appearance tables created and default data inserted successfully!');
  } catch (error) {
    console.error('❌ Error creating appearance tables:', error);
  }
}

createAppearanceTables();
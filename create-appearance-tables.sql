-- Create appearance_settings table
CREATE TABLE IF NOT EXISTS appearance_settings (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value TEXT,
    language VARCHAR(10) DEFAULT 'vi',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(type, key, language)
);

-- Create appearance_history table
CREATE TABLE IF NOT EXISTS appearance_history (
    id SERIAL PRIMARY KEY,
    setting_id INTEGER REFERENCES appearance_settings(id),
    old_value TEXT,
    new_value TEXT,
    changed_by INTEGER,
    changed_at TIMESTAMP DEFAULT NOW()
);

-- Create uploaded_assets table
CREATE TABLE IF NOT EXISTS uploaded_assets (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    mime_type VARCHAR(100),
    size INTEGER,
    url TEXT,
    uploaded_by INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default SEO settings if not exist
INSERT INTO appearance_settings (type, key, value, language) VALUES
('seo_meta', 'site_title', 'SEO AI Writer - Tạo nội dung SEO tự động', 'vi'),
('seo_meta', 'site_description', 'Công cụ AI tạo nội dung SEO chất lượng cao, tối ưu hóa từ khóa và tăng thứ hạng tìm kiếm', 'vi'),
('seo_meta', 'site_keywords', 'SEO, AI, nội dung, tạo bài viết, tối ưu hóa, từ khóa', 'vi'),
('seo_meta', 'site_title', 'SEO AI Writer - Automated Content Generation', 'en'),
('seo_meta', 'site_description', 'High-quality AI-powered SEO content generator, keyword optimization and search ranking improvement', 'en'),
('seo_meta', 'site_keywords', 'SEO, AI, content, article generation, optimization, keywords', 'en'),
('header', 'site_name', 'SEO AI Writer', 'vi'),
('header', 'site_name', 'SEO AI Writer', 'en'),
('login_page', 'title', 'Chào mừng trở lại!', 'vi'),
('login_page', 'welcome_text', 'Đăng nhập để tiếp tục sử dụng công cụ tạo nội dung SEO', 'vi'),
('login_page', 'title', 'Welcome Back!', 'en'),
('login_page', 'welcome_text', 'Login to continue using our SEO content generation tool', 'en'),
('footer', 'copyright', '© 2025 SEO AI Writer. Tất cả quyền được bảo lưu.', 'vi'),
('footer', 'copyright', '© 2025 SEO AI Writer. All rights reserved.', 'en')
ON CONFLICT (type, key, language) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appearance_settings_type ON appearance_settings(type);
CREATE INDEX IF NOT EXISTS idx_appearance_settings_language ON appearance_settings(language);
CREATE INDEX IF NOT EXISTS idx_appearance_history_setting_id ON appearance_history(setting_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_assets_uploaded_by ON uploaded_assets(uploaded_by);
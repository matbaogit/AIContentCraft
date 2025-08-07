-- Create appearance_type enum if not exists
DO $$ BEGIN
    CREATE TYPE appearance_type AS ENUM ('seo_meta', 'header', 'footer', 'login_page');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create appearance_settings table
CREATE TABLE IF NOT EXISTS appearance_settings (
  id SERIAL PRIMARY KEY,
  type appearance_type NOT NULL,
  key TEXT NOT NULL,
  value TEXT,
  language TEXT DEFAULT 'vi',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create appearance_history table
CREATE TABLE IF NOT EXISTS appearance_history (
  id SERIAL PRIMARY KEY,
  setting_id INTEGER REFERENCES appearance_settings(id) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by INTEGER REFERENCES users(id) NOT NULL,
  change_description TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create uploaded_assets table
CREATE TABLE IF NOT EXISTS uploaded_assets (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  path TEXT NOT NULL,
  url TEXT NOT NULL,
  uploaded_by INTEGER REFERENCES users(id) NOT NULL,
  usage_type TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Insert some default appearance settings
INSERT INTO appearance_settings (type, key, value, language) VALUES
('seo_meta', 'site_title', 'SEO AI Writer', 'vi'),
('seo_meta', 'site_description', 'Công cụ tạo nội dung SEO bằng AI', 'vi'),
('seo_meta', 'site_keywords', 'SEO, AI, content, writer', 'vi'),
('header', 'logo_url', '/default-logo.png', 'vi'),
('header', 'site_name', 'SEO AI Writer', 'vi'),
('login_page', 'title', 'Đăng nhập', 'vi'),
('login_page', 'welcome_text', 'Chào mừng bạn đến với SEO AI Writer', 'vi'),
('footer', 'copyright', '© 2025 SEO AI Writer. All rights reserved.', 'vi')
ON CONFLICT DO NOTHING;

-- English versions
INSERT INTO appearance_settings (type, key, value, language) VALUES
('seo_meta', 'site_title', 'SEO AI Writer', 'en'),
('seo_meta', 'site_description', 'AI-powered SEO content creation tool', 'en'),
('seo_meta', 'site_keywords', 'SEO, AI, content, writer', 'en'),
('header', 'logo_url', '/default-logo.png', 'en'),
('header', 'site_name', 'SEO AI Writer', 'en'),
('login_page', 'title', 'Sign In', 'en'),
('login_page', 'welcome_text', 'Welcome to SEO AI Writer', 'en'),
('footer', 'copyright', '© 2025 SEO AI Writer. All rights reserved.', 'en')
ON CONFLICT DO NOTHING;
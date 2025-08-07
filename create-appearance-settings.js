import pg from 'pg';
const { Pool } = pg;

async function createAppearanceSettings() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Creating appearance_settings table...');
    
    // Create appearance_settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS appearance_settings (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        language VARCHAR(5) NOT NULL DEFAULT 'vi',
        content JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(type, language)
      );
    `);

    console.log('Creating appearance_history table...');
    
    // Create appearance_history table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS appearance_history (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        language VARCHAR(5) NOT NULL DEFAULT 'vi',
        previous_content JSONB,
        new_content JSONB NOT NULL,
        changed_by VARCHAR(100) NOT NULL,
        changed_at TIMESTAMP DEFAULT NOW(),
        change_type VARCHAR(20) DEFAULT 'update'
      );
    `);

    console.log('Creating uploaded_assets table...');
    
    // Create uploaded_assets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS uploaded_assets (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        size INTEGER NOT NULL,
        url VARCHAR(500) NOT NULL,
        uploaded_by VARCHAR(100) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT NOW(),
        asset_type VARCHAR(50) DEFAULT 'image'
      );
    `);

    console.log('Inserting default appearance settings...');
    
    // Insert default header settings for Vietnamese
    await pool.query(`
      INSERT INTO appearance_settings (type, language, content) 
      VALUES ('header', 'vi', '{"logo_url": "https://ftp.toolbox.vn/img/logo-toolboxvn.png", "site_title": "SEO AI Writer"}')
      ON CONFLICT (type, language) DO UPDATE SET 
        content = EXCLUDED.content,
        updated_at = NOW();
    `);

    // Insert default header settings for English
    await pool.query(`
      INSERT INTO appearance_settings (type, language, content) 
      VALUES ('header', 'en', '{"logo_url": "https://ftp.toolbox.vn/img/logo-toolboxvn.png", "site_title": "SEO AI Writer"}')
      ON CONFLICT (type, language) DO UPDATE SET 
        content = EXCLUDED.content,
        updated_at = NOW();
    `);

    console.log('Appearance settings created successfully!');
    
  } catch (error) {
    console.error('Error creating appearance settings:', error);
  } finally {
    await pool.end();
  }
}

createAppearanceSettings();
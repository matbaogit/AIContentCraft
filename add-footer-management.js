import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function addFooterManagement() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Creating footer management tables...');

    // Create footer_sections table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS footer_sections (
        id SERIAL PRIMARY KEY,
        section_key TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        "order" INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create footer_links table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS footer_links (
        id SERIAL PRIMARY KEY,
        section_id INTEGER REFERENCES footer_sections(id) NOT NULL,
        label TEXT NOT NULL,
        href TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        "order" INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create footer_social_links table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS footer_social_links (
        id SERIAL PRIMARY KEY,
        platform TEXT NOT NULL,
        url TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        "order" INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create footer_settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS footer_settings (
        id SERIAL PRIMARY KEY,
        description TEXT,
        copyright_text TEXT,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    console.log('Seeding footer data...');

    // Insert default footer sections
    const sections = [
      { key: 'product', title: 'product', order: 1 },
      { key: 'company', title: 'company', order: 2 },
      { key: 'support', title: 'support', order: 3 }
    ];

    for (const section of sections) {
      await pool.query(`
        INSERT INTO footer_sections (section_key, title, "order")
        VALUES ($1, $2, $3)
        ON CONFLICT (section_key) DO UPDATE SET
          title = EXCLUDED.title,
          "order" = EXCLUDED."order",
          updated_at = NOW()
      `, [section.key, section.title, section.order]);
    }

    // Get section IDs
    const productSection = await pool.query("SELECT id FROM footer_sections WHERE section_key = 'product'");
    const companySection = await pool.query("SELECT id FROM footer_sections WHERE section_key = 'company'");
    const supportSection = await pool.query("SELECT id FROM footer_sections WHERE section_key = 'support'");

    // Insert default footer links
    const links = [
      // Product links
      { sectionId: productSection.rows[0].id, label: 'create Seo Content', href: '#', order: 1 },
      { sectionId: productSection.rows[0].id, label: 'wordpress Connect', href: '#', order: 2 },
      { sectionId: productSection.rows[0].id, label: 'social Share', href: '#', order: 3 },
      { sectionId: productSection.rows[0].id, label: 'seo Analysis', href: '#', order: 4 },
      
      // Company links
      { sectionId: companySection.rows[0].id, label: 'about', href: '#', order: 1 },
      { sectionId: companySection.rows[0].id, label: 'blog', href: '#', order: 2 },
      { sectionId: companySection.rows[0].id, label: 'partners', href: '#', order: 3 },
      { sectionId: companySection.rows[0].id, label: 'careers', href: '#', order: 4 },
      
      // Support links
      { sectionId: supportSection.rows[0].id, label: 'help Center', href: '#', order: 1 },
      { sectionId: supportSection.rows[0].id, label: 'terms', href: '#', order: 2 },
      { sectionId: supportSection.rows[0].id, label: 'privacy', href: '#', order: 3 },
      { sectionId: supportSection.rows[0].id, label: 'contact', href: '#contact', order: 4 },
    ];

    for (const link of links) {
      await pool.query(`
        INSERT INTO footer_links (section_id, label, href, "order")
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING
      `, [link.sectionId, link.label, link.href, link.order]);
    }

    // Insert default social links
    const socialLinks = [
      { platform: 'facebook', url: '#', order: 1 },
      { platform: 'twitter', url: '#', order: 2 },
      { platform: 'instagram', url: '#', order: 3 },
      { platform: 'linkedin', url: '#', order: 4 }
    ];

    for (const social of socialLinks) {
      await pool.query(`
        INSERT INTO footer_social_links (platform, url, "order")
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
      `, [social.platform, social.url, social.order]);
    }

    // Insert footer settings
    await pool.query(`
      INSERT INTO footer_settings (description, copyright_text)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [
      'description',
      'copyright'
    ]);

    console.log('Footer management tables and data created successfully!');
    
  } catch (error) {
    console.error('Error creating footer management:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

addFooterManagement().catch(console.error);
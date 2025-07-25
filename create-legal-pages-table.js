import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

async function createLegalPagesTable() {
  try {
    console.log('🔧 Creating legal_pages table...');

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS legal_pages (
        id TEXT PRIMARY KEY,
        title_vi TEXT NOT NULL,
        title_en TEXT NOT NULL,  
        content_vi TEXT NOT NULL,
        content_en TEXT NOT NULL,
        path TEXT NOT NULL UNIQUE,
        description TEXT,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Legal pages table created successfully!');
    
    // Now seed the data
    const { seedLegalPages } = await import('./seed-legal-pages.js');
    await seedLegalPages();
    
  } catch (error) {
    console.error('❌ Error creating legal pages table:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createLegalPagesTable()
    .then(() => {
      console.log('🎉 Legal pages setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Legal pages setup failed:', error);
      process.exit(1);
    });
}

export { createLegalPagesTable };
import { db } from './db/index';
import { sql } from 'drizzle-orm';

async function fixSocialConnectionsTable() {
  try {
    console.log('Fixing social_connections table...');
    
    // Add missing columns if they don't exist
    await db.execute(sql`
      ALTER TABLE social_connections 
      ADD COLUMN IF NOT EXISTS access_token TEXT,
      ADD COLUMN IF NOT EXISTS refresh_token TEXT,
      ADD COLUMN IF NOT EXISTS token_expiry TIMESTAMP,
      ADD COLUMN IF NOT EXISTS account_id TEXT,
      ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'
    `);
    
    console.log('Added missing columns');
    
    // Update existing records
    await db.execute(sql`
      UPDATE social_connections 
      SET access_token = COALESCE(access_token, ''),
          account_id = COALESCE(account_id, ''),
          settings = COALESCE(settings, '{}')
      WHERE access_token IS NULL OR account_id IS NULL OR settings IS NULL
    `);
    
    console.log('Updated existing records');
    
    // Create indexes
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_social_connections_user_id ON social_connections(user_id)
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_social_connections_platform ON social_connections(platform)
    `);
    
    console.log('Created indexes');
    console.log('✅ Social connections table fixed successfully');
    
  } catch (error) {
    console.error('❌ Error fixing social_connections table:', error);
    throw error;
  }
}

// Run the fix
fixSocialConnectionsTable()
  .then(() => {
    console.log('Database fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database fix failed:', error);
    process.exit(1);
  });
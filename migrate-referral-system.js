import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function migrateReferralSystem() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🚀 Starting referral system migration...');

    // Add referral columns to users table
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
    `);
    
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by INTEGER REFERENCES users(id);
    `);
    
    console.log('✅ Added referral columns to users table');

    // Create referral status enum
    await pool.query(`
      DO $$ BEGIN
          CREATE TYPE referral_status AS ENUM ('pending', 'completed', 'failed');
      EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;
    `);
    
    console.log('✅ Created referral_status enum');

    // Create referrals table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS referrals (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
          referral_code TEXT NOT NULL UNIQUE,
          total_referrals INTEGER NOT NULL DEFAULT 0,
          total_credits_earned INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    console.log('✅ Created referrals table');

    // Create referral_transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS referral_transactions (
          id SERIAL PRIMARY KEY,
          referrer_id INTEGER NOT NULL REFERENCES users(id),
          referred_user_id INTEGER NOT NULL REFERENCES users(id),
          referral_code TEXT NOT NULL,
          referrer_credits INTEGER NOT NULL,
          referred_credits INTEGER NOT NULL,
          status referral_status NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          completed_at TIMESTAMP
      );
    `);
    
    console.log('✅ Created referral_transactions table');

    // Add referral settings to system_settings
    await pool.query(`
      INSERT INTO system_settings (key, value, category) 
      VALUES 
          ('referrer_credit_reward', '50', 'referral'),
          ('referred_credit_reward', '20', 'referral'),
          ('referral_system_enabled', 'true', 'referral')
      ON CONFLICT (key) DO NOTHING;
    `);
    
    console.log('✅ Added referral system settings');

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);',
      'CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);',
      'CREATE INDEX IF NOT EXISTS idx_referrals_user_id ON referrals(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON referrals(referral_code);',
      'CREATE INDEX IF NOT EXISTS idx_referral_transactions_referrer_id ON referral_transactions(referrer_id);',
      'CREATE INDEX IF NOT EXISTS idx_referral_transactions_referred_user_id ON referral_transactions(referred_user_id);',
      'CREATE INDEX IF NOT EXISTS idx_referral_transactions_status ON referral_transactions(status);'
    ];

    for (const indexQuery of indexes) {
      await pool.query(indexQuery);
    }
    
    console.log('✅ Created indexes');

    console.log('🎉 Referral system migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrateReferralSystem().catch(console.error);
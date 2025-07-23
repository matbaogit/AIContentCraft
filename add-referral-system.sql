-- Add referral system to existing schema
-- Add referral columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by INTEGER REFERENCES users(id);

-- Create referral status enum
DO $$ BEGIN
    CREATE TYPE referral_status AS ENUM ('pending', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
    referral_code TEXT NOT NULL UNIQUE,
    total_referrals INTEGER NOT NULL DEFAULT 0,
    total_credits_earned INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create referral_transactions table
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

-- Add referral settings to system_settings
INSERT INTO system_settings (key, value, label, description, category, type) 
VALUES 
    ('referrer_credit_reward', '50', 'Credit cho người giới thiệu', 'Số credit người giới thiệu sẽ nhận được khi có người đăng ký thành công', 'referral', 'number'),
    ('referred_credit_reward', '20', 'Credit cho người được giới thiệu', 'Số credit người được giới thiệu sẽ nhận được khi đăng ký thành công', 'referral', 'number'),
    ('referral_system_enabled', 'true', 'Bật hệ thống giới thiệu', 'Bật/tắt tính năng giới thiệu trong hệ thống', 'referral', 'boolean')
ON CONFLICT (key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);
CREATE INDEX IF NOT EXISTS idx_referrals_user_id ON referrals(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_referrer_id ON referral_transactions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_referred_user_id ON referral_transactions(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_status ON referral_transactions(status);
import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function createCreditUsageHistoryTable() {
  try {
    await client.connect();
    console.log('Creating credit_usage_history table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS "credit_usage_history" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "action" text NOT NULL,
        "content_length" text,
        "ai_model" text,
        "generate_images" boolean DEFAULT false,
        "image_count" integer DEFAULT 0,
        "total_credits" integer NOT NULL,
        "credits_breakdown" jsonb,
        "request_data" jsonb,
        "result_title" text,
        "result_word_count" integer,
        "success" boolean DEFAULT true NOT NULL,
        "error_message" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "credit_usage_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action
      );
    `);
    
    console.log('✅ credit_usage_history table created successfully');
    
    // Create index for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS "credit_usage_history_user_id_idx" ON "credit_usage_history" ("user_id");
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS "credit_usage_history_created_at_idx" ON "credit_usage_history" ("created_at");
    `);
    
    console.log('✅ Indexes created successfully');
    
  } catch (error) {
    console.error('❌ Error creating credit_usage_history table:', error);
  } finally {
    await client.end();
  }
}

createCreditUsageHistoryTable();
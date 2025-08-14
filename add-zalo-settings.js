import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function addZaloSettings() {
  try {
    console.log('Adding Zalo OAuth settings to system_settings...');
    
    // Thêm cài đặt Zalo OAuth
    const zaloSettings = [
      {
        key: 'zaloAppId',
        value: '', // Admin sẽ cấu hình sau
        category: 'zalo_oauth'
      },
      {
        key: 'zaloAppSecret', 
        value: '', // Admin sẽ cấu hình sau
        category: 'zalo_oauth'
      },
      {
        key: 'enableZaloOAuth',
        value: 'false', // Mặc định tắt cho đến khi admin cấu hình
        category: 'zalo_oauth'
      }
    ];
    
    for (const setting of zaloSettings) {
      // Kiểm tra xem setting đã tồn tại chưa
      const existing = await db.execute(`
        SELECT id FROM system_settings WHERE key = $1
      `, [setting.key]);
      
      if (existing.length === 0) {
        await db.execute(`
          INSERT INTO system_settings (key, value, category, created_at, updated_at)
          VALUES ($1, $2, $3, NOW(), NOW())
        `, [setting.key, setting.value, setting.category]);
        console.log(`✓ Added setting: ${setting.key}`);
      } else {
        console.log(`- Setting already exists: ${setting.key}`);
      }
    }
    
    console.log('✓ Zalo OAuth settings added successfully!');
    
  } catch (error) {
    console.error('Error adding Zalo settings:', error);
  } finally {
    await client.end();
  }
}

addZaloSettings();
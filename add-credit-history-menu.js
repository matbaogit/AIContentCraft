import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function addCreditHistoryMenu() {
  try {
    await client.connect();
    console.log('Adding Credit History menu item...');
    
    // Thêm menu item mới cho lịch sử tín dụng
    await client.query(`
      INSERT INTO sidebar_menu_items (key, label, label_en, path, icon, required_role, is_enabled, sort_order) 
      VALUES ('credit-history', 'Lịch sử tín dụng', 'Credit History', '/dashboard/credit-history', 'History', 'user', true, 4)
      ON CONFLICT (key) DO UPDATE SET
        label = EXCLUDED.label,
        label_en = EXCLUDED.label_en,
        path = EXCLUDED.path,
        icon = EXCLUDED.icon,
        required_role = EXCLUDED.required_role,
        is_enabled = EXCLUDED.is_enabled,
        sort_order = EXCLUDED.sort_order;
    `);
    
    console.log('✅ Credit History menu item added successfully');
    
  } catch (error) {
    console.error('❌ Error adding Credit History menu:', error);
  } finally {
    await client.end();
  }
}

addCreditHistoryMenu();
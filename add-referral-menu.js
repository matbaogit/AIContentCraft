import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { sidebarMenuItems } from './shared/schema.ts';

// Get database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.log('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function addReferralMenuItem() {
  try {
    console.log('🚀 Adding referral menu item to sidebar...');
    
    // Insert referral menu item
    const referralMenuItem = await db
      .insert(sidebarMenuItems)
      .values({
        key: 'referral',
        icon: 'Gift',
        path: '/dashboard/referral',
        labelVi: 'Giới thiệu',
        labelEn: 'Referral',
        isEnabled: true,
        sortOrder: 16,
        role: 'user'
      })
      .onConflictDoUpdate({
        target: sidebarMenuItems.key,
        set: {
          icon: 'Gift',
          path: '/dashboard/referral',
          labelVi: 'Giới thiệu',
          labelEn: 'Referral',
          isEnabled: true,
          sortOrder: 16,
          role: 'user'
        }
      })
      .returning();

    console.log('✅ Successfully added referral menu item:', referralMenuItem[0]);
    
    await client.end();
    console.log('🎉 Referral menu item setup completed!');
  } catch (error) {
    console.error('❌ Error adding referral menu item:', error);
    await client.end();
    process.exit(1);
  }
}

addReferralMenuItem();
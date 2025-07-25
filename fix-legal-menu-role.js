import { db } from './db/index.js';
import { sidebarMenuItems } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function fixLegalMenuRole() {
  try {
    console.log('🔧 Fixing legal pages menu item role...');

    // Check current record
    const currentRecord = await db.select()
      .from(sidebarMenuItems)
      .where(eq(sidebarMenuItems.key, 'legal-pages'));
    
    if (currentRecord.length === 0) {
      console.log('❌ Legal pages menu item not found!');
      return;
    }
    
    console.log('📋 Current record:', {
      id: currentRecord[0].id,
      key: currentRecord[0].key,
      label: currentRecord[0].label,
      requiredRole: currentRecord[0].requiredRole,
      isVisible: currentRecord[0].isVisible
    });

    // Update to admin role
    const updated = await db.update(sidebarMenuItems)
      .set({ 
        requiredRole: 'admin',
        isVisible: true,
        updatedAt: new Date()
      })
      .where(eq(sidebarMenuItems.key, 'legal-pages'))
      .returning();

    if (updated.length > 0) {
      console.log('✅ Successfully updated legal pages menu item to admin role!');
      console.log('📋 Updated record:', {
        id: updated[0].id,
        key: updated[0].key,
        label: updated[0].label,
        requiredRole: updated[0].requiredRole,
        isVisible: updated[0].isVisible
      });
    } else {
      console.log('❌ Failed to update record');
    }
    
  } catch (error) {
    console.error('❌ Error fixing legal menu role:', error);
    throw error;
  }
}

// Run if called directly  
if (import.meta.url === `file://${process.argv[1]}`) {
  fixLegalMenuRole()
    .then(() => {
      console.log('🎉 Fix completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fix failed:', error);
      process.exit(1);
    });
}

export { fixLegalMenuRole };
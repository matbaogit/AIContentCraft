import { db } from './db/index.js';
import { sidebarMenuItems } from './shared/schema.js';

async function debugSidebarMenu() {
  try {
    console.log('Fetching all sidebar menu items...');
    const menuItems = await db.select().from(sidebarMenuItems).orderBy(sidebarMenuItems.sortOrder);
    
    console.log('\n=== ALL SIDEBAR MENU ITEMS ===');
    menuItems.forEach(item => {
      console.log(`ID: ${item.id}, Key: ${item.key}, Label: ${item.label}, Enabled: ${item.isEnabled}, Path: ${item.path}`);
    });
    
    console.log('\n=== ENABLED ITEMS ONLY ===');
    const enabledItems = menuItems.filter(item => item.isEnabled);
    enabledItems.forEach(item => {
      console.log(`Key: ${item.key}, Label: ${item.label}, Path: ${item.path}`);
    });
    
    console.log('\n=== DISABLED ITEMS ===');
    const disabledItems = menuItems.filter(item => !item.isEnabled);
    disabledItems.forEach(item => {
      console.log(`Key: ${item.key}, Label: ${item.label}, Path: ${item.path}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

debugSidebarMenu();
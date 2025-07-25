import { db } from './server/db.js';
import { legalPages } from './shared/schema.js';

async function checkLegalPages() {
  try {
    console.log('🔍 Checking legal pages data...');
    
    const pages = await db.select().from(legalPages);
    
    console.log('📊 Legal pages in database:');
    console.log('Total pages:', pages.length);
    
    pages.forEach((page, index) => {
      console.log(`\n${index + 1}. Page ID: ${page.id}`);
      console.log(`   Title VI: ${page.title_vi}`);
      console.log(`   Title EN: ${page.title_en}`);
      console.log(`   Path: ${page.path}`);
      console.log(`   Content VI length: ${page.content_vi?.length || 0} chars`);
      console.log(`   Content EN length: ${page.content_en?.length || 0} chars`);
      console.log(`   Content VI preview: ${page.content_vi?.substring(0, 100)}...`);
    });
    
    // Check for duplicate paths
    const paths = pages.map(p => p.path);
    const duplicates = paths.filter((path, index) => paths.indexOf(path) !== index);
    
    if (duplicates.length > 0) {
      console.log('\n⚠️  DUPLICATE PATHS FOUND:', duplicates);
    } else {
      console.log('\n✅ No duplicate paths found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking legal pages:', error);
    process.exit(1);
  }
}

checkLegalPages();
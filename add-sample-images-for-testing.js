import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { images } from './shared/schema.ts';

async function addSampleImages() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL not found');
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    // Add some sample images for testing
    const sampleImages = [
      {
        userId: 1, // admin user
        title: "AI Generated Landscape",
        prompt: "Beautiful mountain landscape with sunrise, digital art style",
        imageUrl: "https://picsum.photos/800/600?random=1",
        sourceText: "Sample article content about nature and landscapes",
        creditsUsed: 1,
        status: "generated"
      },
      {
        userId: 1,
        title: "Technology Concept Art",
        prompt: "Futuristic city with flying cars, cyberpunk style",
        imageUrl: "https://picsum.photos/800/600?random=2", 
        sourceText: "Article about future technology trends",
        creditsUsed: 1,
        status: "generated"
      },
      {
        userId: 1,
        title: "Business Meeting",
        prompt: "Professional business meeting in modern office, realistic style",
        imageUrl: "https://picsum.photos/800/600?random=3",
        sourceText: "Business strategy article content",
        creditsUsed: 1,
        status: "generated"
      }
    ];

    const insertedImages = await db.insert(images).values(sampleImages).returning();
    
    console.log('Sample images added successfully:', insertedImages.length);
    console.log('Images:', insertedImages.map(img => ({ id: img.id, title: img.title })));
    
  } catch (error) {
    console.error('Error adding sample images:', error);
  } finally {
    await client.end();
  }
}

addSampleImages();
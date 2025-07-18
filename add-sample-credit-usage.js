import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function addSampleCreditUsage() {
  try {
    await client.connect();
    console.log('Adding sample credit usage history...');
    
    // Tạo dữ liệu mẫu cho user ID 1 (admin)
    const sampleData = [
      {
        user_id: 1,
        action: 'content_generation',
        content_length: 'short',
        ai_model: 'chatgpt',
        generate_images: false,
        image_count: 0,
        total_credits: 2,
        credits_breakdown: JSON.stringify({
          contentLength: 1,
          aiModel: 1,
          images: 0,
          total: 2
        }),
        request_data: JSON.stringify({
          keywords: 'AI, Technology',
          length: 'short',
          tone: 'friendly'
        }),
        result_title: 'AI trong Tương Lai: Những Xu Hướng Đáng Chú Ý',
        result_word_count: 487,
        success: true,
        error_message: null
      },
      {
        user_id: 1,
        action: 'content_generation',
        content_length: 'medium',
        ai_model: 'gemini',
        generate_images: true,
        image_count: 2,
        total_credits: 6,
        credits_breakdown: JSON.stringify({
          contentLength: 3,
          aiModel: 1,
          images: 4,
          total: 8
        }),
        request_data: JSON.stringify({
          keywords: 'Marketing Digital, SEO',
          length: 'medium',
          tone: 'professional',
          generateImages: true
        }),
        result_title: 'Chiến Lược Marketing Digital Hiệu Quả cho Doanh Nghiệp',
        result_word_count: 1234,
        success: true,
        error_message: null
      },
      {
        user_id: 1,
        action: 'content_generation',
        content_length: 'long',
        ai_model: 'claude',
        generate_images: false,
        image_count: 0,
        total_credits: 0,
        credits_breakdown: JSON.stringify({
          contentLength: 5,
          aiModel: 2,
          images: 0,
          total: 7
        }),
        request_data: JSON.stringify({
          keywords: 'E-commerce, Bán hàng online',
          length: 'long',
          tone: 'expert'
        }),
        result_title: null,
        result_word_count: null,
        success: false,
        error_message: 'Webhook timeout error'
      }
    ];
    
    for (const data of sampleData) {
      await client.query(`
        INSERT INTO credit_usage_history 
        (user_id, action, content_length, ai_model, generate_images, image_count, total_credits, credits_breakdown, request_data, result_title, result_word_count, success, error_message, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW() - INTERVAL '${Math.floor(Math.random() * 24)} hours')
      `, [
        data.user_id,
        data.action,
        data.content_length,
        data.ai_model,
        data.generate_images,
        data.image_count,
        data.total_credits,
        data.credits_breakdown,
        data.request_data,
        data.result_title,
        data.result_word_count,
        data.success,
        data.error_message
      ]);
    }
    
    console.log('✅ Sample credit usage history added successfully');
    
  } catch (error) {
    console.error('❌ Error adding sample credit usage:', error);
  } finally {
    await client.end();
  }
}

addSampleCreditUsage();
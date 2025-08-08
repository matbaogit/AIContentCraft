import pg from 'pg';
const { Pool } = pg;

async function createFaqTable() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Creating FAQs table...');
    
    // Create FAQs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS faqs (
        id SERIAL PRIMARY KEY,
        question_vi TEXT NOT NULL,
        answer_vi TEXT NOT NULL,
        question_en TEXT,
        answer_en TEXT,
        "order" INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Inserting sample FAQ data...');
    
    // Insert sample FAQ data
    const sampleFaqs = [
      {
        question_vi: "ToolBox giúp tạo nội dung như thế nào?",
        answer_vi: "ToolBox sử dụng trí tuệ nhân tạo tiên tiến để tạo ra nội dung chất lượng cao, tối ưu SEO. Bạn chỉ cần nhập từ khóa, mô tả chủ đề, và hệ thống sẽ tự động tạo bài viết hoàn chỉnh với tiêu đề, meta description, và nội dung được tối ưu hóa cho công cụ tìm kiếm.",
        question_en: "How does ToolBox help create content?",
        answer_en: "ToolBox uses advanced artificial intelligence to create high-quality, SEO-optimized content. You simply input keywords, describe the topic, and the system automatically generates complete articles with titles, meta descriptions, and content optimized for search engines.",
        order: 1
      },
      {
        question_vi: "Có những loại nội dung nào tôi có thể tạo?",
        answer_vi: "Bạn có thể tạo nhiều loại nội dung khác nhau như bài viết blog, bài viết SEO, nội dung social media, mô tả sản phẩm, và nhiều hơn nữa. Hệ thống hỗ trợ tạo nội dung theo nhiều phong cách và độ dài khác nhau tùy theo nhu cầu của bạn.",
        question_en: "What types of content can I create?",
        answer_en: "You can create various types of content such as blog posts, SEO articles, social media content, product descriptions, and much more. The system supports content creation in different styles and lengths according to your needs.",
        order: 2
      },
      {
        question_vi: "Tôi có thể xuất bản bài viết trực tiếp lên WordPress không?",
        answer_vi: "Có, bạn hoàn toàn có thể xuất bản bài viết trực tiếp lên WordPress. Chỉ cần kết nối tài khoản WordPress của bạn trong phần 'Kết nối', sau đó bạn có thể xuất bản bài viết với một cú click. Hệ thống cũng hỗ trợ lập lịch xuất bản tự động.",
        question_en: "Can I publish articles directly to WordPress?",
        answer_en: "Yes, you can publish articles directly to WordPress. Simply connect your WordPress account in the 'Connections' section, then you can publish articles with one click. The system also supports automatic scheduled publishing.",
        order: 3
      },
      {
        question_vi: "Hệ thống tín dụng hoạt động như thế nào?",
        answer_vi: "Mỗi bài viết bạn tạo sẽ tiêu tốn một số tín dụng tùy thuộc vào độ dài và độ phức tạp. Bài viết ngắn (500-1000 từ) tiêu tốn 1-2 tín dụng, bài viết dài (1000+ từ) tiêu tốn 3-5 tín dụng. Bạn có thể mua thêm tín dụng hoặc nâng cấp gói để có nhiều tín dụng hơn.",
        question_en: "How does the credit system work?",
        answer_en: "Each article you create will consume some credits depending on length and complexity. Short articles (500-1000 words) consume 1-2 credits, long articles (1000+ words) consume 3-5 credits. You can buy more credits or upgrade your plan to get more credits.",
        order: 4
      },
      {
        question_vi: "Tôi có thể sử dụng bằng tiếng Anh không?",
        answer_vi: "Có, hệ thống hỗ trợ đa ngôn ngữ bao gồm tiếng Việt và tiếng Anh. Bạn có thể chuyển đổi ngôn ngữ bằng cách click vào nút ngôn ngữ ở góc trên cùng của trang. Nội dung AI cũng có thể được tạo bằng cả tiếng Việt và tiếng Anh.",
        question_en: "Can I use it in English?",
        answer_en: "Yes, the system supports multiple languages including Vietnamese and English. You can switch languages by clicking the language button at the top of the page. AI content can also be generated in both Vietnamese and English.",
        order: 5
      }
    ];

    for (const faq of sampleFaqs) {
      await pool.query(`
        INSERT INTO faqs (question_vi, answer_vi, question_en, answer_en, "order", is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [faq.question_vi, faq.answer_vi, faq.question_en, faq.answer_en, faq.order, true]);
    }

    console.log('FAQ table and sample data created successfully!');
    
  } catch (error) {
    console.error('Error creating FAQ table:', error);
  } finally {
    await pool.end();
  }
}

createFaqTable();
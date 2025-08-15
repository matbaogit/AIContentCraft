import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { registerAdminRoutes } from "./admin-routes";
import { setupFacebookAuth } from "./routes/facebook-auth";
// // import zaloAuthRouter from "./routes/zalo-auth-working";
import * as schema from "@shared/schema";
import { db } from "../db";
import { sql, eq, desc } from "drizzle-orm";
import { ApiResponse, GenerateContentRequest, GenerateContentResponse } from "@shared/types";
import { systemSettings, creditUsageHistory } from "@shared/schema";
import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Helper function to convert HTML to plain text with proper line breaks
function htmlToPlainText(html: string): string {
  if (!html) return '';
  
  // Convert block elements to line breaks before removing tags
  let text = html
    .replace(/<\/?(p|div|h[1-6]|br)>/gi, '\n')    // Block elements to line breaks
    .replace(/<\/li>/gi, '\n')                     // List items to line breaks
    .replace(/<li>/gi, '• ')                       // List items with bullet points
    .replace(/<ul>|<\/ul>|<ol>|<\/ol>/gi, '\n')   // List containers to line breaks
    .replace(/<[^>]*>/g, '')                       // Remove all remaining HTML tags
    .replace(/&nbsp;/g, ' ')                       // Replace &nbsp; with space
    .replace(/&amp;/g, '&')                        // Replace &amp; with &
    .replace(/&lt;/g, '<')                         // Replace &lt; with <
    .replace(/&gt;/g, '>')                         // Replace &gt; with >
    .replace(/&quot;/g, '"')                       // Replace &quot; with "
    .replace(/&#39;/g, '\'')                       // Replace &#39; with '
    .replace(/&apos;/g, '\'')                      // Replace &apos; with '
    .replace(/\n\s*\n/g, '\n')                     // Replace multiple line breaks with single
    .replace(/^\s+|\s+$/gm, '')                    // Remove leading/trailing whitespace from each line
    .trim();                                       // Remove leading/trailing whitespace
  
  return text;
}

// Helper function to log credit usage history
async function logCreditUsage(
  userId: number,
  action: string,
  contentLength: string | null,
  aiModel: string | null,
  generateImages: boolean,
  imageCount: number,
  totalCredits: number,
  creditsBreakdown: any,
  requestData: any,
  resultTitle: string | null = null,
  resultWordCount: number | null = null,
  success: boolean = true,
  errorMessage: string | null = null
) {
  try {
    await db.insert(creditUsageHistory).values({
      userId,
      action,
      contentLength,
      aiModel,
      generateImages,
      imageCount,
      totalCredits,
      creditsBreakdown,
      requestData,
      resultTitle,
      resultWordCount,
      success,
      errorMessage
    });
    console.log('✓ Credit usage logged successfully');
  } catch (error) {
    console.error('✗ Failed to log credit usage:', error);
  }
}

// Authentication middleware
const isAuthenticated = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      success: false, 
      error: 'Not authenticated' 
    });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Debug middleware to log all requests
  app.use((req, res, next) => {
    if (req.url.includes('/api/social') || req.url.includes('/api/auth/zalo')) {
      console.log(`=== REQUEST DEBUG ===`);
      console.log(`${req.method} ${req.url}`);
      console.log('Headers:', req.headers);
      console.log('Query:', req.query);
    }
    next();
  });

  // Set up OAuth routes BEFORE authentication (to avoid conflicts)
  
  // Removed problematic test endpoint
  
  // Set up Facebook OAuth routes
  setupFacebookAuth(app);

  // Set up authentication routes
  setupAuth(app);
  
  // Register admin routes
  registerAdminRoutes(app);

  // ========== Public Appearance Settings API ==========
  // Public endpoint for appearance settings (không cần authentication)
  app.get("/api/appearance/settings", async (req, res) => {
    try {
      const { type, language = 'vi' } = req.query;
      const settings = await storage.getAppearanceSettings(
        type as string, 
        language as string
      );

      return res.status(200).json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error("Error getting public appearance settings:", error);
      return res.status(200).json({
        success: true,
        data: [] // Return empty array on error for frontend fallback
      });
    }
  });

  // ========== Public Theme Settings API ==========
  // Public endpoint for theme settings (không cần authentication)
  app.get("/api/admin/settings/theme-public", async (req, res) => {
    try {
      const themeSettings = await storage.getSettingsByCategory('theme');
      
      return res.status(200).json({
        allowUserThemeChange: themeSettings.allowUserThemeChange === "true",
        defaultTheme: themeSettings.defaultTheme || "dark"
      });
    } catch (error) {
      console.error("Error getting public theme settings:", error);
      // Return default settings on error
      return res.status(200).json({
        allowUserThemeChange: true,
        defaultTheme: "dark"
      });
    }
  });

  // ========== Legal Pages API ==========
  // Get all legal pages
  app.get('/api/admin/legal-pages', isAuthenticated, async (req, res) => {
    try {
      // Check admin permission
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const pages = await db.select().from(schema.legalPages);
      
      res.json({
        success: true,
        data: pages
      });
    } catch (error) {
      console.error('Error fetching legal pages:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch legal pages'
      });
    }
  });

  // Update legal page
  app.put('/api/admin/legal-pages/:id', isAuthenticated, async (req, res) => {
    try {
      // Check admin permission
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const pageId = req.params.id;
      const { title_vi, title_en, content_vi, content_en } = req.body;

      // Validate input
      if (!title_vi || !title_en || !content_vi || !content_en) {
        return res.status(400).json({
          success: false,
          error: 'All fields are required'
        });
      }

      // Update the page
      const [updatedPage] = await db
        .update(schema.legalPages)
        .set({
          title_vi,
          title_en,
          content_vi,
          content_en,
          lastUpdated: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.legalPages.id, pageId))
        .returning();

      if (!updatedPage) {
        return res.status(404).json({
          success: false,
          error: 'Legal page not found'
        });
      }

      res.json({
        success: true,
        data: updatedPage
      });
    } catch (error) {
      console.error('Error updating legal page:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update legal page'
      });
    }
  });

  // ========== Legal Pages API endpoints are now complete ==========
  // Debug endpoints have been removed after successful fix

  // ========== Public Legal Pages API ==========
  // Get public legal page by path (no authentication required)
  app.get('/api/legal-pages/:path', async (req, res) => {
    try {
      const pathParam = req.params.path;
      const pagePath = `/${pathParam}`;
      
      const [page] = await db
        .select()
        .from(schema.legalPages)
        .where(eq(schema.legalPages.path, pagePath));

      if (!page) {
        return res.status(404).json({
          success: false,
          error: 'Legal page not found'
        });
      }

      res.json({
        success: true,
        data: page
      });
    } catch (error) {
      console.error('Error fetching public legal page:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch legal page'
      });
    }
  });

  // Data deletion request endpoint
  app.post('/api/data-deletion-request', async (req, res) => {
    try {
      const { email, fullName, reason } = req.body;
      
      // Basic validation
      if (!email || !fullName || !reason) {
        return res.status(400).json({
          success: false,
          error: 'Vui lòng điền đầy đủ thông tin'
        });
      }

      // Log the deletion request (you might want to save this to database)
      console.log('=== DATA DELETION REQUEST ===');
      console.log('Email:', email);
      console.log('Full Name:', fullName);
      console.log('Reason:', reason);
      console.log('Timestamp:', new Date().toISOString());
      console.log('IP:', req.ip);
      
      // Here you could save to a deletion_requests table
      // For now, we'll just log it and return success
      
      // In a real application, you might want to:
      // 1. Save the request to a database table
      // 2. Send an email to admins
      // 3. Send confirmation email to user
      // 4. Create a ticket in your support system
      
      res.json({
        success: true,
        message: 'Yêu cầu xóa dữ liệu đã được ghi nhận'
      });
      
    } catch (error) {
      console.error('Error processing data deletion request:', error);
      res.status(500).json({
        success: false,
        error: 'Có lỗi xảy ra khi xử lý yêu cầu'
      });
    }
  });

  // ========== Public Translations API ==========
  // Get all translations (public endpoint)
  app.get('/api/public/translations', async (req, res) => {
    try {
      const translations = await db.select().from(schema.translations);
      res.json({ 
        success: true, 
        data: { translations } 
      });
    } catch (error) {
      console.error('Error fetching translations:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch translations' 
      });
    }
  });

  // ========== Sidebar Menu API ==========
  // Get enabled sidebar menu items for users
  app.get('/api/sidebar-menu', isAuthenticated, async (req, res) => {
    try {
      const userRole = req.user.role || 'user';
      
      // For admin users, show all menus (user + admin)
      // For regular users, show only user menus
      let whereCondition;
      if (userRole === 'admin') {
        whereCondition = sql`${schema.sidebarMenuItems.isEnabled} = true`;
      } else {
        whereCondition = sql`${schema.sidebarMenuItems.isEnabled} = true 
                            AND ${schema.sidebarMenuItems.requiredRole} = 'user'`;
      }
      
      const menuItems = await db.select()
        .from(schema.sidebarMenuItems)
        .where(whereCondition)
        .orderBy(schema.sidebarMenuItems.sortOrder);

      return res.status(200).json({
        success: true,
        data: menuItems
      });
    } catch (error) {
      console.error("Error getting sidebar menu items:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to get sidebar menu items"
      });
    }
  });

  // API routes
  const httpServer = createServer(app);

  // ========== Plans API ==========
  // Get all plans
  app.get('/api/plans', async (req, res) => {
    try {
      const type = req.query.type as schema.PlanType | undefined;
      const plans = await storage.getPlans(type);
      res.json({ success: true, data: plans });
    } catch (error) {
      console.error('Error fetching plans:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch plans' });
    }
  });

  // ========== Dashboard API ==========
  // Get dashboard stats
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      
      // Get user's credit balance
      const creditBalance = await storage.getUserCredits(userId);
      
      // Get user's articles
      const { articles, total: totalArticles } = await storage.getArticlesByUser(userId, 1, 0);
      
      // Get user's connections
      const connections = await storage.getConnections(userId);
      
      // Get user's storage plan
      const userPlans = await storage.getUserPlans(userId);
      const storagePlan = userPlans.find(up => up.plan.type === 'storage' && up.isActive);
      
      // Calculate monthly change (mock data for now)
      const monthlyChange = 0.12; // 12% increase
      
      // Prepare connections status
      const connectionsStatus = {
        wordpress: connections.some(c => c.type === 'wordpress' && c.isActive),
        facebook: connections.some(c => c.type === 'facebook' && c.isActive),
        tiktok: connections.some(c => c.type === 'tiktok' && c.isActive),
        twitter: connections.some(c => c.type === 'twitter' && c.isActive),
      };
      
      // Prepare storage stats
      const storageStats = storagePlan && storagePlan.plan?.value
        ? {
            current: storagePlan.usedStorage || 0,
            total: storagePlan.plan.value,
            percentage: ((storagePlan.usedStorage || 0) / storagePlan.plan.value) * 100
          }
        : {
            current: 0,
            total: 0,
            percentage: 0
          };
      
      res.json({
        success: true,
        data: {
          creditBalance,
          articlesCreated: {
            total: totalArticles,
            monthlyChange
          },
          storageUsed: storageStats,
          connections: connectionsStatus
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' });
    }
  });

  // Get user's current plans
  app.get('/api/dashboard/user-plans', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const userPlans = await storage.getUserPlans(userId);
      
      res.json({
        success: true,
        data: {
          userPlans
        }
      });
    } catch (error) {
      console.error('Error fetching user plans:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch user plans' });
    }
  });

  // Get user's articles
  app.get('/api/dashboard/articles', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const page = parseInt(req.query.page as string || '1');
      const limit = parseInt(req.query.limit as string || '10');
      
      const { articles, total } = await storage.getArticlesByUser(userId, page, limit);
      
      res.json({
        success: true,
        data: {
          articles,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching user articles:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch articles' });
    }
  });

  // Get article by id
  app.get('/api/dashboard/articles/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }
      
      const userId = req.user.id;
      const articleId = parseInt(req.params.id, 10);
      
      if (isNaN(articleId)) {
        return res.status(400).json({ success: false, error: 'Invalid article ID' });
      }
      
      const article = await storage.getArticleById(articleId);
      
      if (!article) {
        return res.status(404).json({ success: false, error: 'Article not found' });
      }
      
      // Kiểm tra quyền sở hữu bài viết
      if (article.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'You do not have permission to access this article' });
      }
      
      res.json({ success: true, data: article });
    } catch (error) {
      console.error('Error fetching article details:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch article details' });
    }
  });

  // Get images associated with a specific article
  app.get('/api/dashboard/articles/:id/images', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }
      
      const userId = req.user.id;
      const articleId = parseInt(req.params.id, 10);
      
      if (isNaN(articleId)) {
        return res.status(400).json({ success: false, error: 'Invalid article ID' });
      }
      
      // Get images associated with this article
      const images = await db.query.images.findMany({
        where: eq(schema.images.articleId, articleId),
        orderBy: [sql`created_at DESC`]
      });
      
      // Verify user has access to this article
      if (images.length > 0) {
        const article = await storage.getArticleById(articleId);
        if (!article || (article.userId !== userId && req.user.role !== 'admin')) {
          return res.status(403).json({ success: false, error: 'You do not have permission to access this article' });
        }
      }
      
      res.json({ success: true, data: { images } });
    } catch (error) {
      console.error('Error fetching article images:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch article images' });
    }
  });

  // Get content separation data for articles
  app.get('/api/dashboard/articles/:id/content-separation', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }
      
      const userId = req.user.id;
      const articleId = parseInt(req.params.id, 10);
      
      if (isNaN(articleId)) {
        return res.status(400).json({ success: false, error: 'Invalid article ID' });
      }
      
      const article = await storage.getArticleById(articleId);
      
      if (!article) {
        return res.status(404).json({ success: false, error: 'Article not found' });
      }
      
      // Kiểm tra quyền sở hữu bài viết
      if (article.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'You do not have permission to access this article' });
      }
      
      res.json({ 
        success: true, 
        data: {
          id: article.id,
          title: article.title,
          content: article.content,
          textContent: article.textContent,
          imageUrls: article.imageUrls,
          createdAt: article.createdAt
        }
      });
    } catch (error) {
      console.error('Error fetching content separation data:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch content separation data' });
    }
  });

  // Update article by id
  app.patch('/api/dashboard/articles/:id', async (req, res) => {
    try {
      console.log("=== PATCH /api/dashboard/articles/:id CALLED ===");
      console.log("Article ID:", req.params.id);
      console.log("Request body:", req.body);
      
      if (!req.isAuthenticated()) {
        console.log("✗ PATCH failed: Not authenticated");
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }
      
      const userId = req.user.id;
      const articleId = parseInt(req.params.id, 10);
      
      console.log("User ID:", userId);
      console.log("Parsed Article ID:", articleId);
      
      if (isNaN(articleId)) {
        console.log("✗ PATCH failed: Invalid article ID");
        return res.status(400).json({ success: false, error: 'Invalid article ID' });
      }
      
      const article = await storage.getArticleById(articleId);
      console.log("Article found:", article ? "Yes" : "No");
      
      if (!article) {
        console.log("✗ PATCH failed: Article not found");
        return res.status(404).json({ success: false, error: 'Article not found' });
      }
      
      // Kiểm tra quyền sở hữu bài viết
      if (article.userId !== userId && req.user.role !== 'admin') {
        console.log("✗ PATCH failed: Permission denied");
        return res.status(403).json({ success: false, error: 'You do not have permission to update this article' });
      }
      
      // Lấy dữ liệu cập nhật
      const { title, content, keywords, status } = req.body;
      console.log("Update data:", { title, content: content?.substring(0, 100) + "...", keywords, status });
      
      // Cập nhật bài viết
      const updatedArticle = await storage.updateArticle(articleId, {
        title,
        content,
        keywords,
        status,
      });
      
      console.log("✓ PATCH successful, updated article:", updatedArticle?.id);
      res.json({ success: true, data: updatedArticle });
    } catch (error) {
      console.error('Error updating article:', error);
      res.status(500).json({ success: false, error: 'Failed to update article' });
    }
  });

  // Get user's credit usage history
  app.get('/api/dashboard/credit-usage-history', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page as string || '1');
      const limit = parseInt(req.query.limit as string || '20');
      const offset = (page - 1) * limit;
      
      // Get credit usage history with pagination
      const usageHistory = await db.select()
        .from(creditUsageHistory)
        .where(eq(creditUsageHistory.userId, userId))
        .orderBy(desc(creditUsageHistory.createdAt))
        .limit(limit)
        .offset(offset);
      
      // Get total count for pagination
      const totalCount = await db.select({ count: sql`COUNT(*)` })
        .from(creditUsageHistory)
        .where(eq(creditUsageHistory.userId, userId));
      
      const total = Number(totalCount[0]?.count || 0);
      
      res.json({
        success: true,
        data: {
          history: usageHistory,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching credit usage history:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch credit usage history' });
    }
  });

  // Create article
  app.post('/api/dashboard/articles', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const { title, content, keywords, creditsUsed = 1 } = req.body;
      
      // Check if user has enough credits
      const userCredits = await storage.getUserCredits(userId);
      if (userCredits < creditsUsed) {
        return res.status(400).json({ success: false, error: 'Insufficient credits' });
      }
      
      // Extract images from content
      const imageRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
      const imageUrls = [];
      let match;
      
      while ((match = imageRegex.exec(content)) !== null) {
        imageUrls.push(match[1]);
      }
      
      // Remove img tags from content to get text content
      const textContent = content.replace(/<img[^>]*>/g, '').trim();
      
      // Create article with separated content and images
      const article = await storage.createArticle({
        userId,
        title,
        content,
        textContent,
        imageUrls,
        keywords,
        creditsUsed,
        status: 'draft'
      });
      
      // Subtract credits
      await storage.subtractUserCredits(userId, creditsUsed, `Created article: ${title}`);
      
      res.status(201).json({ success: true, data: article });
    } catch (error) {
      console.error('Error creating article:', error);
      res.status(500).json({ success: false, error: 'Failed to create article' });
    }
  });

  // Generate content API - tạo nội dung trong ứng dụng
  app.post('/api/dashboard/generate-content', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const contentRequest = req.body;
      
      console.log('=== CONTENT GENERATION REQUEST START ===');
      console.log('User ID:', userId);
      console.log('Username:', req.user.username);
      console.log('Received content generation request:', JSON.stringify(contentRequest, null, 2));
      
      // Add user information to the request
      contentRequest.userId = userId;
      contentRequest.username = req.user.username;
      if (!contentRequest.timestamp) {
        contentRequest.timestamp = new Date().toISOString();
      }
      
      // Get credit configuration from admin settings
      console.log('=== FETCHING CREDIT CONFIGURATION ===');
      const creditConfigRes = await db.query.systemSettings.findFirst({
        where: eq(systemSettings.key, 'credit_config')
      });
      
      let creditConfig = {
        contentGeneration: { short: 1, medium: 3, long: 5, extraLong: 8 },
        aiModels: { chatgpt: 1, gemini: 1, claude: 2 },
        imageGeneration: { perImage: 2 },
        socialContent: { perGeneration: 5 }
      };
      
      if (creditConfigRes?.value) {
        try {
          const parsedConfig = typeof creditConfigRes.value === 'string' 
            ? JSON.parse(creditConfigRes.value) 
            : creditConfigRes.value;
          creditConfig = { ...creditConfig, ...parsedConfig };
          console.log('✓ Loaded credit config from admin settings:', JSON.stringify(creditConfig, null, 2));
        } catch (error) {
          console.error('✗ Error parsing credit configuration, using default:', error);
        }
      } else {
        console.log('⚠ No credit config found in admin settings, using default values');
      }
      
      console.log('=== CALCULATING CREDITS ===');
      console.log('Content parameters:');
      console.log('- Length:', contentRequest.length);
      console.log('- AI Model:', contentRequest.aiModel);
      console.log('- Generate Images:', contentRequest.generateImages);
      console.log('- Image Count:', contentRequest.imageCount || 0);
      
      // Determine credits needed based on content length using admin configuration
      let contentCredits = 1;
      switch (contentRequest.length) {
        case 'short':
          contentCredits = creditConfig.contentGeneration.short;
          break;
        case 'medium':
          contentCredits = creditConfig.contentGeneration.medium;
          break;
        case 'long':
          contentCredits = creditConfig.contentGeneration.long;
          break;
        case 'extra_long':
        case 'extraLong':
          contentCredits = creditConfig.contentGeneration.extraLong;
          break;
        default:
          contentCredits = creditConfig.contentGeneration.medium;
          console.log('⚠ Unknown content length, using medium default');
      }
      console.log('✓ Content length credits:', contentCredits);
      
      // Calculate AI model credits
      let aiModelCredits = 0;
      if (contentRequest.aiModel && creditConfig.aiModels[contentRequest.aiModel]) {
        aiModelCredits = creditConfig.aiModels[contentRequest.aiModel];
      }
      console.log('✓ AI model credits:', aiModelCredits);
      
      // Calculate image generation credits
      let imageCredits = 0;
      if (contentRequest.generateImages && contentRequest.imageCount) {
        imageCredits = contentRequest.imageCount * creditConfig.imageGeneration.perImage;
      }
      console.log('✓ Image generation credits:', imageCredits);
      
      // Total credits calculation
      const creditsNeeded = contentCredits + aiModelCredits + imageCredits;
      
      // Credit breakdown for logging
      const creditsBreakdown = {
        contentLength: contentCredits,
        aiModel: aiModelCredits,
        images: imageCredits,
        total: creditsNeeded
      };
      
      console.log('=== CREDIT CALCULATION SUMMARY ===');
      console.log('Credits breakdown:', JSON.stringify(creditsBreakdown, null, 2));
      console.log('TOTAL CREDITS NEEDED:', creditsNeeded);
      
      // Check if user has enough credits
      const userCredits = await storage.getUserCredits(userId);
      if (userCredits < creditsNeeded) {
        return res.status(400).json({ 
          success: false, 
          error: 'Insufficient credits' 
        });
      }
      
      // This would be replaced with actual AI content generation using n8n webhook
      // For now, return mock content
      const mockResponse: GenerateContentResponse = {
        title: contentRequest.title || "Default Title",
        content: `<h1>${contentRequest.title}</h1>
          <p>This is a placeholder for AI-generated content. In a real implementation, this would be generated based on the provided parameters using the n8n webhook.</p>
          <h2>About this topic</h2>
          <p>This content would be optimized for SEO with keywords: ${contentRequest.keywords}</p>
          <h2>More information</h2>
          <p>The content would be written in a ${contentRequest.tone} tone and would be approximately ${contentRequest.length === 'short' ? '500' : contentRequest.length === 'medium' ? '1000' : contentRequest.length === 'long' ? '1500' : '2000'} words long.</p>
          <p>Custom prompt details: ${contentRequest.prompt}</p>`,
        keywords: contentRequest.keywords.split(',').map(k => k.trim()),
        creditsUsed: creditsNeeded,
        metrics: {
          generationTimeMs: 3000,
          wordCount: 150
        }
      };
      
      console.log('=== GENERATE CONTENT API CALLED ===');
      
      // Ưu tiên lấy webhook URL từ database (admin settings)
      let webhookUrl = undefined;
      const webhookSettingRes = await db.query.systemSettings.findFirst({
        where: eq(systemSettings.key, 'notificationWebhookUrl')
      });
      webhookUrl = webhookSettingRes?.value || undefined;
      console.log('Webhook URL from database:', webhookUrl);
      
      // Nếu không có trong database, lấy từ file .env làm fallback
      if (!webhookUrl) {
        webhookUrl = process.env.WEBHOOK_URL;
        console.log('Webhook URL from .env (fallback):', webhookUrl);
      }
      
      // Xóa chế độ offline mode theo yêu cầu
      
      // Nếu không có webhook URL hoặc webhook URL không hợp lệ, sử dụng tạo nội dung trực tiếp
      if (!webhookUrl || webhookUrl.includes('your-webhook-service.com') || webhookUrl.trim() === '') {
        console.log('=== USING DIRECT CONTENT GENERATION ===');
        console.log('Reason: Webhook URL not configured or invalid');
        
        // Trừ credits trước khi tạo nội dung
        console.log('=== DEDUCTING CREDITS (DIRECT GENERATION) ===');
        console.log('User ID:', userId);
        console.log('Credits to deduct:', creditsNeeded);
        await storage.subtractUserCredits(userId, creditsNeeded, `Content generation: ${contentRequest.keywords}`);
        
        // Tạo nội dung mẫu phong phú hơn
        const directContent = {
          success: true,
          data: {
            title: `Khám phá thế giới ${contentRequest.keywords}`,
            content: `<h1>Khám phá thế giới ${contentRequest.keywords}</h1>
            
            <p>Chào mừng bạn đến với bài viết chuyên sâu về <strong>${contentRequest.keywords}</strong>. Trong bài viết này, chúng tôi sẽ khám phá những khía cạnh thú vị và hấp dẫn nhất của chủ đề này.</p>
            
            <h2>Tổng quan về ${contentRequest.keywords}</h2>
            <p>Để hiểu rõ hơn về ${contentRequest.keywords}, chúng ta cần tìm hiểu từ những khái niệm cơ bản nhất. Đây là một chủ đề rất phong phú và đa dạng, mang lại nhiều giá trị cho người đọc.</p>
            
            <h2>Những điểm nổi bật chính</h2>
            <ul>
              <li><strong>Tính độc đáo:</strong> ${contentRequest.keywords} có những đặc điểm riêng biệt khiến nó trở nên đặc biệt</li>
              <li><strong>Giá trị thực tiễn:</strong> Ứng dụng trong cuộc sống hàng ngày rất đa dạng</li>
              <li><strong>Xu hướng phát triển:</strong> Ngày càng được quan tâm và phát triển mạnh mẽ</li>
            </ul>
            
            <h2>Hướng dẫn chi tiết</h2>
            <p>Để có thể tận dụng tối đa ${contentRequest.keywords}, bạn cần:</p>
            <ol>
              <li>Tìm hiểu kỹ về lý thuyết cơ bản</li>
              <li>Thực hành thường xuyên</li>
              <li>Cập nhật thông tin mới nhất</li>
              <li>Chia sẻ kiến thức với cộng đồng</li>
            </ol>
            
            <h2>Lời khuyên từ chuyên gia</h2>
            <p><em>Theo kinh nghiệm của các chuyên gia, ${contentRequest.keywords} đòi hỏi sự kiên trì và đam mê. Hãy bắt đầu từ những bước nhỏ và từ từ nâng cao trình độ của mình.</em></p>
            
            <h2>Kết luận</h2>
            <p>Qua bài viết này, chúng ta đã cùng nhau khám phá những khía cạnh quan trọng của ${contentRequest.keywords}. Hy vọng những thông tin này sẽ hữu ích cho hành trình tìm hiểu của bạn.</p>
            
            <p><strong>Bạn có muốn tìm hiểu thêm về ${contentRequest.keywords}?</strong> Hãy để lại bình luận và chia sẻ cùng chúng tôi!</p>`,
            keywords: contentRequest.keywords.split(',').map(k => k.trim()),
            creditsUsed: creditsNeeded,
            metrics: {
              generationTimeMs: 2000,
              wordCount: 450
            }
          }
        };
        
        return res.json(directContent);
      }
      
      // Ưu tiên lấy webhook secret từ database (admin settings)
      let webhookSecret = undefined;
      const webhookSecretRes = await db.query.systemSettings.findFirst({
        where: eq(systemSettings.key, 'webhookSecret')
      });
      webhookSecret = webhookSecretRes?.value;
      console.log('Webhook Secret from database:', webhookSecret ? '(exists)' : '(missing)');
      
      // Nếu không có trong database, lấy từ file .env làm fallback
      if (!webhookSecret) {
        webhookSecret = process.env.WEBHOOK_SECRET;
        console.log('Webhook Secret from .env (fallback):', webhookSecret ? '(exists)' : '(missing)');
      }
      
      // Gửi request đến webhook
      console.log('Sending content request to webhook:', webhookUrl);
      
      // Create unified payload format for both endpoints
      const webhookPayload = {
        keywords: contentRequest.keywords,
        mainKeyword: contentRequest.mainKeyword,
        secondaryKeywords: contentRequest.secondaryKeywords,
        length: contentRequest.length,
        tone: contentRequest.tone,
        prompt: contentRequest.prompt,
        addHeadings: contentRequest.addHeadings,
        useBold: contentRequest.useBold,
        useItalic: contentRequest.useItalic,
        useBullets: contentRequest.useBullets,
        relatedKeywords: contentRequest.relatedKeywords,
        language: contentRequest.language,
        country: contentRequest.country,
        perspective: contentRequest.perspective,
        complexity: contentRequest.complexity,
        useWebResearch: contentRequest.useWebResearch,
        refSources: contentRequest.refSources,
        aiModel: contentRequest.aiModel,
        linkItems: contentRequest.linkItems,
        imageSize: contentRequest.imageSize,
        generateImages: contentRequest.generateImages,
        image_size: contentRequest.image_size,
        userId: contentRequest.userId,
        username: contentRequest.username,
        timestamp: contentRequest.timestamp
      };
      
      // Ghi log yêu cầu gửi đến webhook
      console.log('Webhook payload:', JSON.stringify(webhookPayload, null, 2));
      
      // Tạo header cho request
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      // Thêm header X-Webhook-Secret nếu có
      if (webhookSecret) {
        headers['X-Webhook-Secret'] = webhookSecret;
      }
      
      try {
        // Tạo controller để có thể hủy thủ công nếu cần
        const controller = new AbortController();
        const webhookTimeout = parseInt(process.env.WEBHOOK_TIMEOUT || '900000', 10); // Đọc timeout từ .env hoặc mặc định 15 phút
        const timeoutId = setTimeout(() => controller.abort(), webhookTimeout);
        
        // Gửi request đến webhook
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(webhookPayload),
          signal: controller.signal
        });
        
        // Xóa timeout khi nhận được phản hồi
        clearTimeout(timeoutId);
        
        if (!webhookResponse.ok) {
          console.log(`Webhook response status: ${webhookResponse.status}`);
          

          
          return res.status(webhookResponse.status).json({
            success: false,
            error: `Không thể kết nối với dịch vụ tạo nội dung. Mã lỗi: ${webhookResponse.status}. Vui lòng kiểm tra cấu hình webhook.`
          });
        }
        
        // Xử lý phản hồi từ webhook
        const responseText = await webhookResponse.text();
        console.log('Webhook response text (first 500 chars):', responseText.substring(0, 500));
        console.log('Webhook response text length:', responseText.length);
        
        // Nếu responseText trống hoặc không hợp lệ, sử dụng dữ liệu mẫu
        if (!responseText || responseText.trim() === '') {
          console.log('Webhook returned empty response, using mock data');
          // Trừ credits trước khi trả về mock response
          console.log('=== DEDUCTING CREDITS (MOCK RESPONSE) ===');
          console.log('User ID:', userId);
          console.log('Credits to deduct:', creditsNeeded);
          await storage.subtractUserCredits(userId, creditsNeeded, `Content generation`);
          return res.json({ success: true, data: mockResponse });
        }
        
        try {
          const webhookResult = JSON.parse(responseText);
          
          console.log('=== PARSED WEBHOOK RESULT ===');
          console.log('webhookResult type:', typeof webhookResult);
          console.log('webhookResult is Array:', Array.isArray(webhookResult));
          console.log('webhookResult.success:', webhookResult.success);
          console.log('webhookResult.data is Array:', Array.isArray(webhookResult.data));
          console.log('webhookResult.data.length:', webhookResult.data?.length);
          console.log('Full webhookResult structure:', JSON.stringify(webhookResult, null, 2).substring(0, 1000));
          
          // Kiểm tra nếu webhookResult chính là mảng (không có wrapper)
          if (Array.isArray(webhookResult)) {
            console.log('=== WEBHOOK RESULT IS DIRECT ARRAY ===');
            const firstResult = webhookResult[0];
            if (firstResult && firstResult.aiTitle) {
              console.log('Found aiTitle in direct array:', firstResult.aiTitle);
              
              // Xử lý aiTitle để loại bỏ dấu ngoặc kép thừa
              const cleanedTitle = firstResult.aiTitle.replace(/^"|"$/g, '').replace(/[\r\n\t]+/g, ' ').trim();
              
              // NGAY LẬP TỨC LỮU BÀI VIẾT VÀO DATABASE với status = 'draft'
              console.log('=== SAVING ARTICLE TO DATABASE IMMEDIATELY ===');
              try {
                // Extract images from content
                const imageRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
                const imageUrls = [];
                let match;
                
                while ((match = imageRegex.exec(firstResult.articleContent)) !== null) {
                  imageUrls.push(match[1]);
                }
                
                // Remove img tags from content to get text content
                const textContent = firstResult.articleContent.replace(/<img[^>]*>/g, '').trim();
                
                // Create article with separated content and images
                const article = await storage.createArticle({
                  userId,
                  title: cleanedTitle,
                  content: firstResult.articleContent,
                  textContent,
                  imageUrls,
                  keywords: contentRequest.keywords,
                  creditsUsed: creditsNeeded,
                  status: 'draft' // Lưu với status = 'draft'
                });
                
                // Subtract credits
                await storage.subtractUserCredits(userId, creditsNeeded, `Created article: ${cleanedTitle}`);
                
                console.log('✓ Article saved to database with ID:', article.id);
                
                const formattedResponse = {
                  title: cleanedTitle,
                  content: firstResult.articleContent,
                  aiTitle: cleanedTitle,
                  articleContent: firstResult.articleContent,
                  keywords: contentRequest.keywords.split(','),
                  creditsUsed: creditsNeeded,
                  articleId: article.id, // Trả về articleId cho frontend
                  metrics: {
                    generationTimeMs: 5000,
                    wordCount: firstResult.articleContent ? firstResult.articleContent.split(/\s+/).length : 0
                  }
                };
                
                // Log credit usage history với imageCount đúng
                const actualImageCount = contentRequest.generateImages ? 3 : 0; // Default là 3 ảnh khi generateImages = true
                await logCreditUsage(
                  userId,
                  'content_generation',
                  contentRequest.length,
                  contentRequest.aiModel,
                  contentRequest.generateImages || false,
                  actualImageCount,
                  creditsNeeded,
                  creditsBreakdown,
                  contentRequest,
                  cleanedTitle,
                  formattedResponse.metrics.wordCount,
                  true
                );
                
                console.log('Returning formatted response with cleaned title and articleId:', cleanedTitle, article.id);
                return res.json({ success: true, data: formattedResponse });
              } catch (dbError) {
                console.error('✗ Failed to save article to database:', dbError);
                // Vẫn trả về content nhưng không có articleId (chưa lưu)
                const formattedResponse = {
                  title: cleanedTitle,
                  content: firstResult.articleContent,
                  aiTitle: cleanedTitle,
                  articleContent: firstResult.articleContent,
                  keywords: contentRequest.keywords.split(','),
                  creditsUsed: creditsNeeded,
                  articleId: null, // Không có articleId vì lưu thất bại
                  saveError: true, // Flag để frontend biết có lỗi khi lưu
                  metrics: {
                    generationTimeMs: 5000,
                    wordCount: firstResult.articleContent ? firstResult.articleContent.split(/\s+/).length : 0
                  }
                };
                
                // Log credit usage history với imageCount đúng
                const actualImageCount = contentRequest.generateImages ? 3 : 0;
                await logCreditUsage(
                  userId,
                  'content_generation',
                  contentRequest.length,
                  contentRequest.aiModel,
                  contentRequest.generateImages || false,
                  actualImageCount,
                  creditsNeeded,
                  creditsBreakdown,
                  contentRequest,
                  cleanedTitle,
                  formattedResponse.metrics.wordCount,
                  true
                );
                
                console.log('Returning response without articleId due to DB error:', cleanedTitle);
                return res.json({ success: true, data: formattedResponse });
              }
            }
          }
          
          // Kiểm tra cấu trúc phản hồi với wrapper
          if (webhookResult && webhookResult.success && Array.isArray(webhookResult.data) && webhookResult.data.length > 0) {
            const firstResult = webhookResult.data[0];
            
            console.log('=== WEBHOOK RESPONSE DEBUG ===');
            console.log('firstResult keys:', Object.keys(firstResult));
            console.log('firstResult.articleContent exists:', !!firstResult.articleContent);
            console.log('firstResult.aiTitle exists:', !!firstResult.aiTitle);
            console.log('firstResult.aiTitle value:', firstResult.aiTitle);
            
            // Xử lý theo cấu trúc phản hồi
            if (firstResult.articleContent && firstResult.aiTitle) {
              console.log('=== USING WRAPPED LOGIC BRANCH ===');
              // Xử lý aiTitle để loại bỏ các ký tự xuống dòng và dấu cách thừa
              const cleanedTitle = firstResult.aiTitle.replace(/[\r\n\t]+/g, ' ').trim();
              
              // NGAY LẬP TỨC LỮU BÀI VIẾT VÀO DATABASE với status = 'draft'
              console.log('=== SAVING WRAPPED ARTICLE TO DATABASE IMMEDIATELY ===');
              try {
                // Extract images from content
                const imageRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
                const imageUrls = [];
                let match;
                
                while ((match = imageRegex.exec(firstResult.articleContent)) !== null) {
                  imageUrls.push(match[1]);
                }
                
                // Remove img tags from content to get text content
                const textContent = firstResult.articleContent.replace(/<img[^>]*>/g, '').trim();
                
                // Create article with separated content and images
                const article = await storage.createArticle({
                  userId,
                  title: cleanedTitle,
                  content: firstResult.articleContent,
                  textContent,
                  imageUrls,
                  keywords: contentRequest.keywords,
                  creditsUsed: creditsNeeded,
                  status: 'draft' // Lưu với status = 'draft'
                });
                
                // Subtract credits
                await storage.subtractUserCredits(userId, creditsNeeded, `Created article: ${cleanedTitle}`);
                
                console.log('✓ Wrapped Article saved to database with ID:', article.id);
                
                const formattedResponse = {
                  title: cleanedTitle, // Tiêu đề sẽ được hiển thị (đã được làm sạch)
                  content: firstResult.articleContent, // Nội dung sẽ được hiển thị
                  aiTitle: cleanedTitle, // Lưu trữ tiêu đề gốc từ AI (đã được làm sạch)
                  articleContent: firstResult.articleContent, // Lưu trữ nội dung gốc
                  keywords: contentRequest.keywords.split(','),
                  creditsUsed: creditsNeeded,
                  articleId: article.id, // Trả về articleId cho frontend
                  metrics: {
                    generationTimeMs: 5000,
                    wordCount: firstResult.articleContent.split(/\s+/).length
                  }
                };
                
                // Log credit usage history
                const actualImageCount = contentRequest.generateImages ? 3 : 0; // Default là 3 ảnh khi generateImages = true
                await logCreditUsage(
                  userId,
                  'content_generation',
                  contentRequest.length,
                  contentRequest.aiModel,
                  contentRequest.generateImages || false,
                  actualImageCount,
                  creditsNeeded,
                  creditsBreakdown,
                  contentRequest,
                  cleanedTitle, // Đây là title đã được clean
                  formattedResponse.metrics.wordCount,
                  true
                );
                
                console.log('Returning wrapped response with articleId:', cleanedTitle, article.id);
                return res.json({ success: true, data: formattedResponse });
              } catch (dbError) {
                console.error('✗ Failed to save wrapped article to database:', dbError);
                // Vẫn trả về content nhưng không có articleId (chưa lưu)
                // Subtract credits vì content đã được tạo thành công
                await storage.subtractUserCredits(userId, creditsNeeded, `Content generation`);
                
                const formattedResponse = {
                  title: cleanedTitle, // Tiêu đề sẽ được hiển thị (đã được làm sạch)
                  content: firstResult.articleContent, // Nội dung sẽ được hiển thị
                  aiTitle: cleanedTitle, // Lưu trữ tiêu đề gốc từ AI (đã được làm sạch)
                  articleContent: firstResult.articleContent, // Lưu trữ nội dung gốc
                  keywords: contentRequest.keywords.split(','),
                  creditsUsed: creditsNeeded,
                  articleId: null, // Không có articleId vì lưu thất bại
                  saveError: true, // Flag để frontend biết có lỗi khi lưu
                  metrics: {
                    generationTimeMs: 5000,
                    wordCount: firstResult.articleContent.split(/\s+/).length
                  }
                };
                
                // Log credit usage history
                const actualImageCount = contentRequest.generateImages ? 3 : 0; // Default là 3 ảnh khi generateImages = true
                await logCreditUsage(
                  userId,
                  'content_generation',
                  contentRequest.length,
                  contentRequest.aiModel,
                  contentRequest.generateImages || false,
                  actualImageCount,
                  creditsNeeded,
                  creditsBreakdown,
                  contentRequest,
                  cleanedTitle, // Đây là title đã được clean
                  formattedResponse.metrics.wordCount,
                  true
                );
                
                console.log('Returning wrapped response without articleId due to DB error:', cleanedTitle);
                return res.json({ success: true, data: formattedResponse });
              }
            }
          }
          
          // Nếu không nhận dạng được cấu trúc theo cách trên, kiểm tra dữ liệu từ webhookResult
          if (webhookResult && webhookResult.success && Array.isArray(webhookResult.data)) {
            // Trường hợp dữ liệu đã được đóng gói trong webhookResult.data
            const responseData = webhookResult.data[0];
            // Đảm bảo creditsUsed luôn có trong response
            responseData.creditsUsed = creditsNeeded;
            
            // Extract title from various possible fields
            const extractedTitle = responseData.aiTitle || responseData.title || 
                                 contentRequest.keywords || 'Generated Content';
            
            console.log('=== TITLE EXTRACTION DEBUG ===');
            console.log('responseData.aiTitle:', responseData.aiTitle);
            console.log('responseData.title:', responseData.title);
            console.log('extractedTitle:', extractedTitle);
            
            // Log credit usage history for generic response
            const actualImageCount = contentRequest.generateImages ? 3 : 0; // Default là 3 ảnh khi generateImages = true
            await logCreditUsage(
              userId,
              'content_generation',
              contentRequest.length,
              contentRequest.aiModel,
              contentRequest.generateImages || false,
              actualImageCount,
              creditsNeeded,
              creditsBreakdown,
              contentRequest,
              extractedTitle,
              responseData.metrics?.wordCount || 0,
              true
            );
            
            console.log('Trả về phản hồi gốc từ webhook với creditsUsed:', responseData);
            return res.json({ success: true, data: responseData });
          } else {
            // Trường hợp cấu trúc khác, trả về nguyên dạng nhưng đảm bảo có creditsUsed
            webhookResult.creditsUsed = creditsNeeded;
            
            // Log credit usage history for unknown response format
            const actualImageCount = contentRequest.generateImages ? 3 : 0; // Default là 3 ảnh khi generateImages = true
            await logCreditUsage(
              userId,
              'content_generation',
              contentRequest.length,
              contentRequest.aiModel,
              contentRequest.generateImages || false,
              actualImageCount,
              creditsNeeded,
              creditsBreakdown,
              contentRequest,
              'Unknown Title',
              0,
              true
            );
            
            console.log('Trả về phản hồi nguyên dạng với creditsUsed:', webhookResult);
            return res.json({ success: true, data: webhookResult });
          }
          
        } catch (jsonError) {
          console.error('Failed to parse webhook response as JSON:', jsonError);
          // Trừ credits trước khi trả về mock response
          await storage.subtractUserCredits(userId, creditsNeeded, `Content generation`);
          
          // Log credit usage history for JSON parsing error
          await logCreditUsage(
            userId,
            'content_generation',
            contentRequest.length,
            contentRequest.aiModel,
            contentRequest.generateImages || false,
            contentRequest.imageCount || 0,
            creditsNeeded,
            creditsBreakdown,
            contentRequest,
            'Mock Response - JSON Parse Error',
            mockResponse.metrics?.wordCount || 0,
            false,
            'Failed to parse webhook response as JSON'
          );
          
          // Sử dụng dữ liệu mẫu nếu phân tích JSON thất bại
          return res.json({ success: true, data: mockResponse });
        }
      } catch (webhookError: any) {
        console.error('Error calling webhook:', webhookError);
        
        // Kiểm tra xem lỗi có phải là timeout không
        if (webhookError.name === 'AbortError' || webhookError.name === 'TimeoutError') {
          console.log('Xử lý lỗi timeout webhook');
          
          // Log credit usage history for timeout error
          await logCreditUsage(
            userId,
            'content_generation',
            contentRequest.length,
            contentRequest.aiModel,
            contentRequest.generateImages || false,
            contentRequest.imageCount || 0,
            0, // No credits charged for timeout
            creditsBreakdown,
            contentRequest,
            null,
            null,
            false,
            'Webhook timeout error'
          );
          
          return res.status(504).json({
            success: false,
            error: 'Không thể kết nối với dịch vụ tạo nội dung. Mã lỗi: 504. Vui lòng kiểm tra cấu hình webhook.'
          });
        }
        
        // Log credit usage history for general webhook error
        await logCreditUsage(
          userId,
          'content_generation',
          contentRequest.length,
          contentRequest.aiModel,
          contentRequest.generateImages || false,
          contentRequest.imageCount || 0,
          0, // No credits charged for webhook error
          creditsBreakdown,
          contentRequest,
          null,
          null,
          false,
          `Webhook error: ${webhookError.message}`
        );
        
        // Nếu webhook lỗi, sử dụng tạo nội dung trực tiếp thay vì trả lỗi
        console.log('=== WEBHOOK FAILED, USING DIRECT CONTENT GENERATION ===');
        
        // Trừ credits trước khi tạo nội dung
        console.log('=== DEDUCTING CREDITS (WEBHOOK FALLBACK) ===');
        console.log('User ID:', userId);
        console.log('Credits to deduct:', creditsNeeded);
        await storage.subtractUserCredits(userId, creditsNeeded, `Content generation (fallback): ${contentRequest.keywords}`);
        
        // Tạo nội dung fallback và lưu ngay vào database
        const fallbackTitle = `Tìm hiểu về ${contentRequest.keywords}`;
        const fallbackContent = `<h1>Tìm hiểu về ${contentRequest.keywords}</h1>
            
            <p>Bài viết này sẽ giúp bạn hiểu rõ hơn về <strong>${contentRequest.keywords}</strong>, một chủ đề đang được nhiều người quan tâm.</p>
            
            <h2>Giới thiệu ${contentRequest.keywords}</h2>
            <p>${contentRequest.keywords} là một lĩnh vực thú vị và đầy tiềm năng. Để hiểu rõ về nó, chúng ta cần tìm hiểu từ những khái niệm cơ bản.</p>
            
            <h2>Tại sao ${contentRequest.keywords} quan trọng?</h2>
            <ul>
              <li>Mang lại giá trị thực tiễn cao</li>
              <li>Có ứng dụng rộng rãi trong nhiều lĩnh vực</li>
              <li>Xu hướng phát triển mạnh mẽ trong tương lai</li>
            </ul>
            
            <h2>Cách tiếp cận ${contentRequest.keywords}</h2>
            <p>Để bắt đầu với ${contentRequest.keywords}, bạn nên:</p>
            <ol>
              <li>Tìm hiểu kiến thức nền tảng</li>
              <li>Thực hành thường xuyên</li>
              <li>Tham gia cộng đồng để học hỏi</li>
            </ol>
            
            <h2>Lời khuyên cho người mới bắt đầu</h2>
            <p><em>Hãy bắt đầu từ những bước nhỏ và dần dần nâng cao trình độ. Sự kiên trì và đam mê sẽ giúp bạn thành công trong việc tìm hiểu ${contentRequest.keywords}.</em></p>
            
            <h2>Kết luận</h2>
            <p>Hy vọng qua bài viết này, bạn đã có cái nhìn tổng quan về ${contentRequest.keywords}. Hãy tiếp tục theo dõi để cập nhật thêm nhiều thông tin hữu ích!</p>`;
        
        // NGAY LẬP TỨC LỮU BÀI VIẾT FALLBACK VÀO DATABASE với status = 'draft'
        console.log('=== SAVING FALLBACK ARTICLE TO DATABASE IMMEDIATELY ===');
        try {
          // Create article with fallback content
          const article = await storage.createArticle({
            userId,
            title: fallbackTitle,
            content: fallbackContent,
            textContent: fallbackContent.replace(/<[^>]*>/g, '').trim(), // Remove HTML tags
            imageUrls: [], // No images in fallback content
            keywords: contentRequest.keywords,
            creditsUsed: creditsNeeded,
            status: 'draft' // Lưu với status = 'draft'
          });
          
          console.log('✓ Fallback Article saved to database with ID:', article.id);
          
          const fallbackResponse = {
            success: true,
            data: {
              title: fallbackTitle,
              content: fallbackContent,
              keywords: contentRequest.keywords.split(',').map(k => k.trim()),
              creditsUsed: creditsNeeded,
              articleId: article.id, // Trả về articleId cho frontend
              metrics: {
                generationTimeMs: 1500,
                wordCount: 350
              }
            }
          };
          
          return res.json(fallbackResponse);
        } catch (dbError) {
          console.error('✗ Failed to save fallback article to database:', dbError);
          // Vẫn trả về content nhưng không có articleId (chưa lưu)
          const fallbackResponse = {
            success: true,
            data: {
              title: fallbackTitle,
              content: fallbackContent,
              keywords: contentRequest.keywords.split(',').map(k => k.trim()),
              creditsUsed: creditsNeeded,
              articleId: null, // Không có articleId vì lưu thất bại
              saveError: true, // Flag để frontend biết có lỗi khi lưu
              metrics: {
                generationTimeMs: 1500,
                wordCount: 350
              }
            }
          };
          
          return res.json(fallbackResponse);
        }
      }
    } catch (error) {
      console.error('Error generating content:', error);
      
      // Log credit usage history for general error
      try {
        await logCreditUsage(
          req.user.id,
          'content_generation',
          null,
          null,
          false,
          0,
          0, // No credits charged for error
          {},
          req.body,
          null,
          null,
          false,
          `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      } catch (logError) {
        console.error('Failed to log credit usage for error:', logError);
      }
      
      res.status(500).json({ success: false, error: 'Failed to generate content' });
    }
  });

  // Generate SEO articles - unified endpoint
  app.post('/api/dashboard/articles/generate', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const { title, keywords, topic, type, complexity } = req.body;
      
      // Check if user has enough credits
      const userCredits = await storage.getUserCredits(userId);
      if (userCredits < 1) {
        return res.status(400).json({ 
          success: false, 
          error: 'Insufficient credits' 
        });
      }

      // Get webhook URL for social content generation
      const socialSettings = await storage.getSystemSettings('social_content');
      const webhookUrl = socialSettings?.socialContentWebhookUrl;

      if (!webhookUrl) {
        return res.status(500).json({ 
          success: false, 
          error: 'Webhook URL not configured' 
        });
      }

      // Create unified payload format
      const webhookPayload = {
        content: `Từ khóa: ${Array.isArray(keywords) ? keywords.join(', ') : keywords}\nChủ đề: ${topic || title}`,
        url: "",
        extract_content: "false",
        post_to_linkedin: "false",
        post_to_facebook: "false", 
        post_to_x: "false",
        post_to_instagram: "false",
        genSEO: "true",
        approve_extract: "false"
      };

      console.log('SEO Article Generation - Webhook payload:', JSON.stringify(webhookPayload, null, 2));

      try {
        const controller = new AbortController();
        const webhookTimeout = parseInt(process.env.WEBHOOK_TIMEOUT || '30000', 10);
        const timeoutId = setTimeout(() => controller.abort(), webhookTimeout);
        
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(webhookPayload),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!webhookResponse.ok) {
          return res.status(webhookResponse.status).json({
            success: false,
            error: `Webhook error: ${webhookResponse.status}`
          });
        }
        
        const responseText = await webhookResponse.text();
        console.log('Webhook response:', responseText);
        
        let webhookResult;
        try {
          webhookResult = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse webhook response:', parseError);
          return res.status(500).json({
            success: false,
            error: 'Invalid webhook response format'
          });
        }

        // Process webhook result and create article
        if (webhookResult && webhookResult.success && Array.isArray(webhookResult.data) && webhookResult.data.length > 0) {
          const firstResult = webhookResult.data[0];
          
          if (firstResult.articleContent && firstResult.aiTitle) {
            // Extract images from content
            const imageRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
            const imageUrls = [];
            let match;
            
            while ((match = imageRegex.exec(firstResult.articleContent)) !== null) {
              imageUrls.push(match[1]);
            }
            
            // Remove img tags to get text content
            const textContent = firstResult.articleContent.replace(/<img[^>]*>/g, '').trim();
            
            // Create article in database
            const article = await storage.createArticle({
              userId,
              title: firstResult.aiTitle.replace(/[\r\n\t]+/g, ' ').trim(),
              content: firstResult.articleContent,
              textContent,
              imageUrls,
              keywords: Array.isArray(keywords) ? keywords.join(',') : keywords,
              creditsUsed: 1,
              status: 'draft'
            });
            
            // Subtract credits
            await storage.subtractUserCredits(userId, 1, `SEO article generation: ${article.title}`);
            
            return res.json({ 
              success: true, 
              data: {
                id: article.id,
                title: article.title,
                content: article.content,
                keywords: keywords,
                creditsUsed: 1
              }
            });
          }
        }
        
        return res.status(500).json({
          success: false,
          error: 'Invalid webhook response structure'
        });
        
      } catch (webhookError: any) {
        console.error('Webhook error:', webhookError);
        return res.status(500).json({
          success: false,
          error: 'Failed to generate content via webhook'
        });
      }
      
    } catch (error) {
      console.error('Error generating SEO article:', error);
      res.status(500).json({ success: false, error: 'Failed to generate article' });
    }
  });

  // Get user's connections
  app.get('/api/dashboard/connections', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const connections = await storage.getConnections(userId);
      
      res.json({ success: true, data: connections });
    } catch (error) {
      console.error('Error fetching connections:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch connections' });
    }
  });

  // Add WordPress connection
  app.post('/api/dashboard/connections/wordpress', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const { url, username, appPassword } = req.body;
      
      if (!url || !username || !appPassword) {
        return res.status(400).json({ 
          success: false, 
          error: 'URL, username and appPassword are required' 
        });
      }
      
      // In a real implementation, we would validate the WordPress credentials
      // by making a test request to the WordPress REST API
      
      const connection = await storage.createConnection({
        userId,
        type: 'wordpress',
        name: url,
        config: { url, username, appPassword },
        isActive: true
      });
      
      res.status(201).json({ success: true, data: connection });
    } catch (error) {
      console.error('Error adding WordPress connection:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to add WordPress connection' 
      });
    }
  });

  // ========== Facebook OAuth Routes ==========
  
  // Initiate Facebook OAuth
  app.get('/api/auth/facebook', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    try {
      // Get Facebook OAuth settings from database
      const socialOAuthSettings = await storage.getSettingsByCategory('social');
      const facebookAppId = socialOAuthSettings.facebookAppId;
      const enableFacebookOAuth = socialOAuthSettings.enableFacebookOAuth === 'true';
      
      if (!enableFacebookOAuth) {
        return res.status(503).json({
          success: false,
          error: 'Facebook OAuth is not enabled. Please contact administrator.'
        });
      }
      
      if (!facebookAppId) {
        return res.status(500).json({
          success: false,
          error: 'Facebook App ID not configured. Please contact administrator.'
        });
      }

      const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/facebook/callback`;

      const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=${facebookAppId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=public_profile,email&` +
        `response_type=code&` +
        `state=${req.user.id}`;
      
      console.log('Facebook OAuth Debug:');
      console.log('- Facebook App ID:', facebookAppId);
      console.log('- Redirect URI:', redirectUri);
      console.log('- Auth URL:', authUrl);
      
      res.redirect(authUrl);
    } catch (error) {
      console.error('Error initiating Facebook OAuth:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to initialize Facebook OAuth'
      });
    }
  });

  // Handle data deletion requests
  app.post('/api/data-deletion-request', async (req, res) => {
    try {
      const { email, reason, facebookUserId } = req.body;

      if (!email || !reason) {
        return res.status(400).json({
          success: false,
          error: 'Email and reason are required'
        });
      }

      // In a real implementation, you would:
      // 1. Store the deletion request in a database
      // 2. Send notification to admin
      // 3. Create a tracking ticket
      // 4. Send confirmation email to user

      console.log('Data deletion request received:', {
        email,
        reason: reason.substring(0, 100) + '...',
        facebookUserId,
        timestamp: new Date().toISOString(),
        ip: req.ip
      });

      // For now, just return success
      res.json({
        success: true,
        data: {
          requestId: `DDR-${Date.now()}`,
          message: 'Your data deletion request has been received and will be processed within 30 days',
          estimatedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      });

    } catch (error) {
      console.error('Error processing data deletion request:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process deletion request'
      });
    }
  });

  // Get current Facebook OAuth redirect URI for configuration
  app.get('/api/auth/facebook/redirect-uri', async (req, res) => {
    try {
      const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/facebook/callback`;
      res.json({
        success: true,
        data: {
          redirectUri,
          instructions: [
            "1. Vào Facebook Developers Console",
            "2. Chọn app của bạn",
            "3. Vào Settings → Basic",
            "4. Tìm mục 'Valid OAuth Redirect URIs'",
            "5. Thêm URI này vào danh sách"
          ]
        }
      });
    } catch (error) {
      console.error('Error getting redirect URI:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get redirect URI'
      });
    }
  });

  // Handle Facebook OAuth callback
  app.get('/api/auth/facebook/callback', async (req, res) => {
    try {
      const { code, state, error: fbError } = req.query;
      
      if (fbError) {
        console.error('Facebook OAuth error:', fbError);
        return res.redirect('/dashboard/social-connections?error=facebook_denied');
      }

      if (!code || !state) {
        return res.redirect('/dashboard/social-connections?error=invalid_callback');
      }

      const userId = parseInt(state as string);
      
      // Get Facebook OAuth settings from database
      const socialOAuthSettings = await storage.getSettingsByCategory('social');
      const facebookAppId = socialOAuthSettings.facebookAppId;
      const facebookAppSecret = socialOAuthSettings.facebookAppSecret;
      const enableFacebookOAuth = socialOAuthSettings.enableFacebookOAuth === 'true';
      
      const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/facebook/callback`;

      if (!enableFacebookOAuth) {
        return res.redirect('/dashboard/social-connections?error=oauth_disabled');
      }

      if (!facebookAppId || !facebookAppSecret) {
        return res.redirect('/dashboard/social-connections?error=app_not_configured');
      }

      // Exchange code for access token
      const tokenResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?` +
        `client_id=${facebookAppId}&` +
        `client_secret=${facebookAppSecret}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `code=${code}`);

      const tokenData = await tokenResponse.json();
      
      if (tokenData.error) {
        console.error('Facebook token exchange error:', tokenData.error);
        return res.redirect('/dashboard/social-connections?error=token_exchange_failed');
      }

      let accessToken = tokenData.access_token;
      let expiresIn = tokenData.expires_in;
      
      // Exchange for long-lived token (60 days)
      try {
        const longLivedResponse = await fetch(
          `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${facebookAppId}&client_secret=${facebookAppSecret}&fb_exchange_token=${accessToken}`
        );

        if (longLivedResponse.ok) {
          const longLivedData = await longLivedResponse.json();
          accessToken = longLivedData.access_token;
          expiresIn = longLivedData.expires_in || 5184000; // 60 days default
          console.log('Successfully exchanged for long-lived token, expires in:', expiresIn, 'seconds');
        } else {
          console.warn('Failed to get long-lived token, using short-lived token');
        }
      } catch (error) {
        console.warn('Error exchanging for long-lived token:', error);
      }

      // Get user's Facebook pages
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
      );
      const pagesData = await pagesResponse.json();

      if (pagesData.error) {
        console.error('Facebook pages fetch error:', pagesData.error);
        return res.redirect('/dashboard/social-connections?error=pages_fetch_failed');
      }

      // Get user info
      const userResponse = await fetch(
        `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${accessToken}`
      );
      const userData = await userResponse.json();

      // If user has pages, create connections for each page
      if (pagesData.data && pagesData.data.length > 0) {
        for (const page of pagesData.data) {
          // Use page access token for posting
          await storage.createConnection({
            userId,
            type: 'facebook',
            name: page.name,
            config: {
              accountName: page.name,
              accountId: page.id,
              userId: userData.id,
              userName: userData.name
            },
            accessToken: page.access_token, // Page access token
            pageId: page.id,
            pageName: page.name,
            expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
            isActive: true
          });
        }
      } else {
        // Create personal account connection (limited functionality)
        await storage.createConnection({
          userId,
          type: 'facebook',
          name: userData.name || 'Facebook Account',
          config: {
            accountName: userData.name,
            accountId: userData.id,
            userId: userData.id,
            userName: userData.name
          },
          accessToken,
          expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
          isActive: true
        });
      }

      res.redirect('/dashboard/social-connections?success=facebook_connected');
    } catch (error) {
      console.error('Facebook OAuth callback error:', error);
      res.redirect('/dashboard/social-connections?error=callback_failed');
    }
  });

  // Get Facebook pages for connected user
  app.get('/api/facebook/pages', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const facebookConnections = await db.select()
        .from(schema.connections)
        .where(
          sql`${schema.connections.userId} = ${userId} 
              AND ${schema.connections.type} = 'facebook'
              AND ${schema.connections.isActive} = true`
        );

      if (facebookConnections.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No Facebook connection found'
        });
      }

      const connection = facebookConnections[0];
      if (!connection.accessToken) {
        return res.status(400).json({
          success: false,
          error: 'No access token available'
        });
      }

      // Get fresh pages data
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${connection.accessToken}`
      );
      const pagesData = await pagesResponse.json();

      if (pagesData.error) {
        return res.status(400).json({
          success: false,
          error: pagesData.error.message || 'Failed to fetch pages'
        });
      }

      res.json({
        success: true,
        data: {
          pages: pagesData.data || []
        }
      });
    } catch (error) {
      console.error('Error fetching Facebook pages:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch Facebook pages' 
      });
    }
  });

  // Add social media connection (legacy method - still supported)
  app.post('/api/dashboard/connections/social', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const { platform, accessToken, accountName, accountId } = req.body;
      
      if (!platform || !accessToken || !accountName || !accountId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Platform, accessToken, accountName and accountId are required' 
        });
      }
      
      // Create connection
      const connection = await storage.createConnection({
        userId,
        type: platform as schema.Connection['type'],
        name: accountName,
        config: { accessToken, accountName, accountId },
        accessToken, // Store in dedicated field as well
        isActive: true
      });
      
      res.status(201).json({ success: true, data: connection });
    } catch (error) {
      console.error('Error adding social media connection:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to add social media connection' 
      });
    }
  });

  // Get credit history
  app.get('/api/dashboard/credits/history', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const page = parseInt(req.query.page as string || '1');
      const limit = parseInt(req.query.limit as string || '10');
      
      const { transactions, total } = await storage.getCreditHistory(userId, page, limit);
      
      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching credit history:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch credit history' });
    }
  });

  // Purchase credits
  app.post('/api/dashboard/credits/purchase', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const { planId } = req.body;
      
      if (!planId) {
        return res.status(400).json({ success: false, error: 'Plan ID is required' });
      }
      
      // Get plan details
      const plan = await storage.getPlan(planId);
      if (!plan || plan.type !== 'credit') {
        return res.status(400).json({ success: false, error: 'Invalid plan ID' });
      }
      
      // In a real implementation, we would integrate with a payment gateway here
      // For now, just add the credits to the user's account
      
      const newCreditBalance = await storage.addUserCredits(
        userId, 
        plan.value, 
        planId, 
        `Purchased ${plan.value} credits (${plan.name})`
      );
      
      res.json({
        success: true,
        data: {
          credits: newCreditBalance,
          plan: plan.name,
          amount: plan.value,
        }
      });
    } catch (error) {
      console.error('Error purchasing credits:', error);
      res.status(500).json({ success: false, error: 'Failed to purchase credits' });
    }
  });

  // Purchase storage plan
  app.post('/api/dashboard/plans/purchase', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const { planId } = req.body;
      
      if (!planId) {
        return res.status(400).json({ success: false, error: 'Plan ID is required' });
      }
      
      // Get plan details
      const plan = await storage.getPlan(planId);
      if (!plan || plan.type !== 'storage') {
        return res.status(400).json({ success: false, error: 'Invalid plan ID' });
      }
      
      // Calculate end date
      const startDate = new Date();
      let endDate = null;
      if (plan.duration) {
        endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.duration);
      }
      
      // In a real implementation, we would integrate with a payment gateway here
      // For now, just create the user plan
      
      const userPlan = await storage.createUserPlan({
        userId,
        planId,
        startDate,
        endDate,
        isActive: true,
        usedStorage: 0
      });
      
      res.status(201).json({
        success: true,
        data: {
          ...userPlan,
          plan
        }
      });
    } catch (error) {
      console.error('Error purchasing storage plan:', error);
      res.status(500).json({ success: false, error: 'Failed to purchase storage plan' });
    }
  });

  // Update user profile
  app.patch('/api/dashboard/profile', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const { fullName, email, language } = req.body;
      
      // Update user
      const updatedUser = await storage.updateUser(userId, {
        fullName,
        email,
        language
      });
      
      if (!updatedUser) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      
      // Don't include password in response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json({ success: true, data: userWithoutPassword });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ success: false, error: 'Failed to update profile' });
    }
  });

  // Change password
  app.post('/api/dashboard/change-password', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          success: false, 
          error: 'Current password and new password are required' 
        });
      }
      
      // Get user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      
      // Verify current password
      const scryptAsync = promisify(scrypt);
      const [hashed, salt] = user.password.split(".");
      const hashedBuf = Buffer.from(hashed, "hex");
      const suppliedBuf = (await scryptAsync(currentPassword, salt, 64)) as Buffer;
      
      const passwordMatches = timingSafeEqual(hashedBuf, suppliedBuf);
      if (!passwordMatches) {
        return res.status(400).json({ success: false, error: 'Current password is incorrect' });
      }
      
      // Hash new password
      const newSalt = randomBytes(16).toString("hex");
      const newHashedBuf = (await scryptAsync(newPassword, newSalt, 64)) as Buffer;
      const newHashedPassword = `${newHashedBuf.toString("hex")}.${newSalt}`;
      
      // Update user
      await storage.updateUser(userId, {
        password: newHashedPassword
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ success: false, error: 'Failed to change password' });
    }
  });

  // ========== Workspace API ==========
  // Get user's workspaces
  app.get('/api/workspaces', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const workspaces = await storage.getUserWorkspaces(userId);
      res.json({ success: true, workspaces });
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch workspaces' });
    }
  });

  // Create new workspace
  app.post('/api/workspaces', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const { name, description, isPublic, maxMembers } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, error: 'Workspace name is required' });
      }

      const workspace = await storage.createWorkspace({
        name,
        description,
        ownerId: userId,
        isPublic: isPublic || false,
        maxMembers: maxMembers || 10,
        status: 'active',
        inviteCode: Math.random().toString(36).substring(2, 15)
      });

      // Add creator as owner member
      await storage.addWorkspaceMember({
        workspaceId: workspace.id,
        userId: userId,
        role: 'owner',
        invitedBy: userId
      });

      res.json({ success: true, workspace });
    } catch (error) {
      console.error('Error creating workspace:', error);
      res.status(500).json({ success: false, error: 'Failed to create workspace' });
    }
  });

  // Get workspace details
  app.get('/api/workspaces/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const workspaceId = parseInt(req.params.id);
      const userId = req.user.id;

      // Check if user is member of workspace
      const isMember = await storage.isWorkspaceMember(workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace) {
        return res.status(404).json({ success: false, error: 'Workspace not found' });
      }

      res.json({ success: true, workspace });
    } catch (error) {
      console.error('Error fetching workspace:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch workspace' });
    }
  });

  // Get workspace members
  app.get('/api/workspaces/:id/members', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const workspaceId = parseInt(req.params.id);
      const userId = req.user.id;

      // Check if user is member of workspace
      const isMember = await storage.isWorkspaceMember(workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      const members = await storage.getWorkspaceMembers(workspaceId);
      res.json({ success: true, members });
    } catch (error) {
      console.error('Error fetching workspace members:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch workspace members' });
    }
  });

  // Get workspace sessions
  app.get('/api/workspaces/:id/sessions', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const workspaceId = parseInt(req.params.id);
      const userId = req.user.id;

      // Check if user is member of workspace
      const isMember = await storage.isWorkspaceMember(workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      const sessions = await storage.getWorkspaceSessions(workspaceId);
      res.json({ success: true, sessions });
    } catch (error) {
      console.error('Error fetching workspace sessions:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch workspace sessions' });
    }
  });

  // Create new collaborative session
  app.post('/api/workspaces/:id/sessions', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const workspaceId = parseInt(req.params.id);
      const userId = req.user.id;
      const { name, description, prompt, imageStyle, targetImageCount } = req.body;

      // Check if user has editor/admin/owner permissions
      const memberRole = await storage.getWorkspaceMemberRole(workspaceId, userId);
      if (!memberRole || !['owner', 'admin', 'editor'].includes(memberRole)) {
        return res.status(403).json({ success: false, error: 'Insufficient permissions' });
      }

      if (!name) {
        return res.status(400).json({ success: false, error: 'Session name is required' });
      }

      const session = await storage.createCollaborativeSession({
        workspaceId,
        name,
        description,
        createdBy: userId,
        status: 'active',
        prompt,
        imageStyle: imageStyle || 'realistic',
        targetImageCount: targetImageCount || 1
      });

      res.json({ success: true, session });
    } catch (error) {
      console.error('Error creating session:', error);
      res.status(500).json({ success: false, error: 'Failed to create session' });
    }
  });

  // ========== Social Media Content API ==========
  
  // Extract content for social media
  app.post('/api/social/extract-content', (req, res, next) => {
    console.log('=== REQUEST RECEIVED TO /api/social/extract-content ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    next();
  }, isAuthenticated, async (req: any, res) => {
    try {
      console.log('=== SOCIAL EXTRACT CONTENT REQUEST ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));

      const { contentSource, briefDescription, selectedArticleId, referenceLink, platforms } = req.body;
      const userId = req.user.id;

      console.log('Extract content request:', req.body);

      if (!platforms || platforms.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Platforms are required' 
        });
      }

      // For existing article source, briefDescription is optional
      if (contentSource === 'manual' && !briefDescription) {
        return res.status(400).json({ 
          success: false, 
          error: 'Brief description is required for manual content' 
        });
      }

      let sourceContent = briefDescription;
      
      // If using existing article, get its content
      if (contentSource === 'existing-article' && selectedArticleId) {
        const article = await storage.getArticle(selectedArticleId);
        if (!article || article.userId !== userId) {
          return res.status(404).json({ success: false, error: 'Article not found' });
        }
        sourceContent = `${article.title}\n\n${article.content}`;
      }

      // Get webhook configuration from admin settings
      const socialSettings = await storage.getSettingsByCategory('social_content');
      console.log('Social settings found:', socialSettings);
      const socialContentWebhookUrl = socialSettings?.socialContentWebhookUrl;
      console.log('Social content webhook URL:', socialContentWebhookUrl);

      if (!socialContentWebhookUrl) {
        console.log('ERROR: Social content webhook URL not configured');
        return res.status(500).json({ success: false, error: 'Social content webhook URL not configured' });
      }

      // Extract key points using webhook
      const webhookPayload = {
        content: sourceContent,
        url: referenceLink || '',
        extract_content: 'true',
        extracted_data: '',
        post_to_linkedin: 'false',
        post_to_facebook: 'false',
        post_to_x: 'false',
        post_to_instagram: 'false',
        genSEO: false,
        approve_extract: false
      };

      const fetch = (await import('node-fetch')).default;
      
      const webhookResponse = await fetch(socialContentWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      });

      if (!webhookResponse.ok) {
        throw new Error('Failed to extract content');
      }

      const extractedContent = await webhookResponse.text();
      
      console.log('Webhook response status:', webhookResponse.status);
      console.log('Extracted content length:', extractedContent?.length || 0);
      console.log('Extracted content preview:', extractedContent?.substring(0, 200) + '...');

      // Parse JSON response and extract the "output" field
      let finalContent = extractedContent;
      try {
        const parsed = JSON.parse(extractedContent);
        if (parsed.output) {
          finalContent = parsed.output;
          console.log('Parsed output content:', finalContent.substring(0, 200) + '...');
        }
      } catch (parseError) {
        console.log('Response is not JSON, using as plain text');
      }

      res.json({ 
        success: true, 
        data: { extractedContent: finalContent } 
      });

    } catch (error) {
      console.error('Error extracting content:', error);
      res.status(500).json({ success: false, error: 'Failed to extract content' });
    }
  });

  // Generate social media content
  app.post('/api/social/generate-content', (req, res, next) => {
    console.log('=== INCOMING REQUEST TO /api/social/generate-content ===');
    console.log('Request received at:', new Date().toISOString());
    console.log('Request headers:', req.headers);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Is authenticated:', req.isAuthenticated());
    next();
  }, isAuthenticated, async (req: any, res) => {
    try {
      console.log('=== SOCIAL CONTENT GENERATION REQUEST START ===');
      console.log('User:', req.user);

      const userId = req.user.id;
      console.log('User ID:', userId);
      const { 
        contentSource, 
        briefDescription, 
        selectedArticleId, 
        referenceLink, 
        platforms, 
        includeImage, 
        imageSource, 
        imagePrompt,
        approveExtract,
        seoTopic,
        seoKeywords,
        // Handle direct webhook format
        content,
        topic,
        keywords,
        url,
        extract_content,
        post_to_linkedin,
        post_to_facebook,
        post_to_x,
        post_to_instagram,
        genSEO,
        approve_extract
      } = req.body;

      // Handle direct webhook format (from frontend generateSocialContentMutation)
      if ((content || (topic && keywords)) && (post_to_linkedin || post_to_facebook || post_to_x || post_to_instagram)) {
        // Direct webhook format - validate and forward to webhook
        const webhookPayload = {
          topic: topic,
          keywords: keywords,
          url: url || "",
          extract_content,
          post_to_linkedin,
          post_to_facebook,
          post_to_x,
          post_to_instagram,
          genSEO,
          approve_extract
        };
        
        // Get webhook configuration
        const socialSettings = await storage.getSettingsByCategory('social_content');
        const socialContentWebhookUrl = socialSettings?.socialContentWebhookUrl;
        
        if (!socialContentWebhookUrl) {
          return res.status(400).json({ 
            success: false, 
            error: 'Social content webhook URL not configured' 
          });
        }

        // Send to webhook and return response
        const fetch = (await import('node-fetch')).default;
        const webhookResponse = await fetch(socialContentWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload)
        });

        const webhookResult = await webhookResponse.text();
        let parsedResult;
        
        try {
          parsedResult = JSON.parse(webhookResult);
        } catch {
          parsedResult = { output: webhookResult };
        }

        // Get social content credit configuration
        const socialCreditConfigRes = await db.query.systemSettings.findFirst({
          where: eq(systemSettings.key, 'credit_config')
        });
        
        let socialCredits = 5; // Default
        if (socialCreditConfigRes?.value) {
          try {
            const parsedConfig = typeof socialCreditConfigRes.value === 'string' 
              ? JSON.parse(socialCreditConfigRes.value) 
              : socialCreditConfigRes.value;
            socialCredits = parsedConfig?.socialContent?.perGeneration || 5;
          } catch (error) {
            console.log('Using default social content credits:', error);
          }
        }

        // Deduct credits for webhook usage
        await storage.subtractUserCredits(userId, socialCredits, `Tạo nội dung social media`);

        return res.json({ 
          success: true, 
          data: Object.assign(parsedResult || {}, { creditsUsed: socialCredits })
        });
      }

      // Validate required fields for structured form data
      if (!platforms || platforms.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'At least one platform must be selected' 
        });
      }

      // Validate based on content source
      if (contentSource === 'existing-article' && !selectedArticleId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Article selection is required when using existing article' 
        });
      }

      if (contentSource === 'create-new-seo' && (!seoTopic || !seoKeywords)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Topic and keywords are required for SEO article creation' 
        });
      }

      if (contentSource === 'manual' && !briefDescription) {
        return res.status(400).json({ 
          success: false, 
          error: 'Brief description is required for manual content' 
        });
      }

      // Get social content credit requirement
      const socialCreditConfigRes = await db.query.systemSettings.findFirst({
        where: eq(systemSettings.key, 'credit_config')
      });
      
      let socialCreditsRequired = 5; // Default
      if (socialCreditConfigRes?.value) {
        try {
          const parsedConfig = typeof socialCreditConfigRes.value === 'string' 
            ? JSON.parse(socialCreditConfigRes.value) 
            : socialCreditConfigRes.value;
          socialCreditsRequired = parsedConfig?.socialContent?.perGeneration || 5;
        } catch (error) {
          console.log('Using default social content credits requirement:', error);
        }
      }

      // Check user credits
      const user = await storage.getUser(userId);
      if (!user || user.credits < socialCreditsRequired) {
        return res.status(400).json({ 
          success: false, 
          error: `Insufficient credits. Need at least ${socialCreditsRequired} credits.` 
        });
      }

      // Get webhook configuration from admin settings
      const socialSettings = await storage.getSettingsByCategory('social_content');
      const socialContentWebhookUrl = socialSettings?.socialContentWebhookUrl;
      const enableSocialContentGeneration = socialSettings?.enableSocialContentGeneration === "true";
      
      console.log('Social content settings retrieved:', {
        socialContentWebhookUrl,
        enableSocialContentGeneration,
        allSettings: socialSettings
      });

      if (!enableSocialContentGeneration || !socialContentWebhookUrl) {
        return res.status(400).json({ 
          success: false, 
          error: 'Social content generation is not configured. Please contact administrator.' 
        });
      }

      // Prepare article data if using existing article
      let articleData = null;
      if (contentSource === 'existing-article' && selectedArticleId) {
        const article = await storage.getArticle(selectedArticleId);
        if (!article) {
          return res.status(404).json({ 
            success: false, 
            error: 'Article not found' 
          });
        }
        articleData = {
          id: article.id,
          title: article.title,
          content: article.textContent || article.content,
          imageUrls: article.imageUrls
        };
      }

      // Debug content source
      console.log('Content source:', contentSource);
      console.log('genSEO will be:', contentSource === 'ai-keyword');
      
      // Prepare webhook payload with the correct keys
      let webhookPayload;
      
      if (contentSource === 'create-new-seo') {
        // Special handling for SEO article creation
        webhookPayload = {
          topic: seoTopic,
          keywords: seoKeywords,
          url: referenceLink || "",
          extract_content: "false",
          post_to_linkedin: platforms.includes('linkedin') ? "true" : "false",
          post_to_facebook: platforms.includes('facebook') ? "true" : "false",
          post_to_x: platforms.includes('twitter') ? "true" : "false",
          post_to_instagram: platforms.includes('instagram') ? "true" : "false",
          genSEO: true,
          approve_extract: "false"
        };
      } else {
        // Standard handling for other content sources
        webhookPayload = {
          content: contentSource === 'existing-article' ? 
            (articleData ? `${articleData.title}\n\n${articleData.content}` : briefDescription) : 
            briefDescription,
          url: referenceLink || "",
          extract_content: contentSource === 'existing-article' ? "true" : "false",
          post_to_linkedin: platforms.includes('linkedin') ? "true" : "false",
          post_to_facebook: platforms.includes('facebook') ? "true" : "false",
          post_to_x: platforms.includes('twitter') ? "true" : "false",
          post_to_instagram: platforms.includes('instagram') ? "true" : "false",
          genSEO: "false",
          approve_extract: contentSource === 'existing-article' ? (approveExtract ? "true" : "false") : "false"
        };
      }

      // Send data to webhook
      const fetch = (await import('node-fetch')).default;
      
      console.log('Sending webhook request to:', socialContentWebhookUrl);
      console.log('Webhook payload:', JSON.stringify(webhookPayload, null, 2));
      
      // Add timeout and better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      let webhookResponse;
      try {
        webhookResponse = await fetch(socialContentWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('Webhook request timed out after 15 seconds');
          return res.status(500).json({ 
            success: false, 
            error: 'Webhook service is not responding (timeout after 15 seconds). Please check webhook URL configuration.' 
          });
        }
        console.error('Webhook request failed:', fetchError);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to connect to webhook service. Please check webhook URL configuration.' 
        });
      }

      if (!webhookResponse.ok) {
        console.error('Webhook request failed:', webhookResponse.status, webhookResponse.statusText);
        const errorText = await webhookResponse.text();
        console.error('Webhook error response:', errorText);
        return res.status(500).json({ 
          success: false, 
          error: `Webhook request failed: ${webhookResponse.status} ${webhookResponse.statusText}` 
        });
      }

      let webhookResult;
      try {
        const responseText = await webhookResponse.text();
        console.log('Raw webhook response:', responseText.substring(0, 500)); // Log first 500 chars
        
        // Check if response is HTML (error page)
        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
          console.error('Webhook returned HTML instead of JSON - likely an error page');
          console.error('Response was:', responseText.substring(0, 500));
          
          return res.status(500).json({ 
            success: false, 
            error: 'Webhook service is not responding correctly. Please check webhook URL configuration.' 
          });
        }
        
        // Try to parse as JSON
        const parsedResponse = JSON.parse(responseText);
        
        // Handle the webhook response format {"output": "content"}
        if (parsedResponse && parsedResponse.output) {
          webhookResult = {
            success: true,
            content: parsedResponse.output,
            message: 'Social media content generated successfully'
          };
        } else {
          webhookResult = parsedResponse;
        }
      } catch (parseError) {
        console.error('Failed to parse webhook response as JSON:', parseError);
        console.error('Response content type:', webhookResponse.headers.get('content-type'));
        console.error('Response was:', responseText.substring(0, 200));
        
        return res.status(500).json({ 
          success: false, 
          error: 'Webhook returned invalid JSON response. Please check webhook configuration.' 
        });
      }

      // Get social content credit configuration and deduct credits
      const regularSocialCreditConfigRes = await db.query.systemSettings.findFirst({
        where: eq(systemSettings.key, 'credit_config')
      });
      
      let regularSocialCredits = 5; // Default
      if (regularSocialCreditConfigRes?.value) {
        try {
          const parsedConfig = typeof regularSocialCreditConfigRes.value === 'string' 
            ? JSON.parse(regularSocialCreditConfigRes.value) 
            : regularSocialCreditConfigRes.value;
          regularSocialCredits = parsedConfig?.socialContent?.perGeneration || 5;
        } catch (error) {
          console.log('Using default regular social content credits:', error);
        }
      }

      // Deduct credits after successful webhook call
      await storage.subtractUserCredits(userId, regularSocialCredits, `Tạo nội dung social media cho ${platforms.length} nền tảng`);

      // Log credit usage for social media content generation
      await logCreditUsage(
        userId,
        'social_content',
        null, // no specific content length
        null, // no specific AI model
        false, // not image generation
        0, // no images
        regularSocialCredits, // social media content costs from config
        { social_content: regularSocialCredits, total: regularSocialCredits },
        { contentSource, platforms, briefDescription, seoTopic, seoKeywords },
        contentSource === 'create-new-seo' ? seoTopic : briefDescription?.substring(0, 100) || 'Social Media Content',
        webhookResult?.content ? webhookResult.content.split(/\s+/).length : 0,
        true // success
      );

      // Return webhook response to frontend
      res.json({ 
        success: true, 
        data: Object.assign(webhookResult || {}, { creditsUsed: regularSocialCredits })
      });
    } catch (error) {
      console.error('Error generating social media content:', error);
      res.status(500).json({ success: false, error: 'Failed to generate social media content' });
    }
  });

  // Generate social media content using the configured webhook (for "Tạo bài viết SEO mới" flow)
  app.post('/api/social/generate-content', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const { 
        contentSource, 
        briefDescription, 
        selectedArticleId, 
        referenceLink, 
        platforms,
        seoKeywords,
        seoTopic
      } = req.body;

      console.log('Social generate content request:', req.body);

      if (!platforms || platforms.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Platforms are required' 
        });
      }

      // Get the Social Media Content Generation webhook URL from admin settings
      const socialSettings = await storage.getSettingsByCategory('social_content');
      console.log('Social settings found:', socialSettings);
      // Force use working webhook URL
      const socialContentWebhookUrl = 'https://workflows-in.matbao.com/webhook/80808e9c-a56a-4b4f-83da-7710fae0bda7';
      console.log('Using working webhook URL:', socialContentWebhookUrl);

      if (!socialContentWebhookUrl) {
        console.log('ERROR: Social content webhook URL not configured');
        return res.status(500).json({ 
          success: false, 
          error: 'Social content webhook URL not configured. Please configure it in admin settings.' 
        });
      }

      let sourceContent = briefDescription;
      
      // If using existing article, get its content
      if (contentSource === 'existing-article' && selectedArticleId) {
        const article = await storage.getArticle(selectedArticleId);
        if (!article || article.userId !== userId) {
          return res.status(404).json({ success: false, error: 'Article not found' });
        }
        sourceContent = `${article.title}\n\n${article.content}`;
      }

      // Prepare webhook payload for Social Media Content Generation
      const webhookPayload = {
        content: sourceContent,
        url: referenceLink || "",
        extract_content: contentSource === 'existing-article' ? "true" : "false",
        post_to_linkedin: platforms.includes('linkedin') ? "true" : "false",
        post_to_facebook: platforms.includes('facebook') ? "true" : "false",
        post_to_x: platforms.includes('twitter') ? "true" : "false",
        post_to_instagram: platforms.includes('instagram') ? "true" : "false",
        genSEO: contentSource === 'create-new-seo' ? "true" : "false", // true when creating from keywords/topic
        approve_extract: "false"
      };

      const fetch = (await import('node-fetch')).default;
      
      console.log('Sending webhook request to:', socialContentWebhookUrl);
      console.log('Webhook payload:', JSON.stringify(webhookPayload, null, 2));
      
      // Add timeout and better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      let webhookResponse;
      try {
        webhookResponse = await fetch(socialContentWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('Webhook request timed out after 15 seconds');
          return res.status(500).json({ 
            success: false, 
            error: 'Webhook service is not responding (timeout after 15 seconds). Please check webhook URL configuration.' 
          });
        }
        console.error('Webhook request failed:', fetchError);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to connect to webhook service. Please check webhook URL configuration.' 
        });
      }

      if (!webhookResponse.ok) {
        console.error('Webhook request failed:', webhookResponse.status, webhookResponse.statusText);
        const errorText = await webhookResponse.text();
        console.error('Webhook error response:', errorText);
        return res.status(500).json({ 
          success: false, 
          error: `Webhook request failed: ${webhookResponse.status} ${webhookResponse.statusText}` 
        });
      }

      let webhookResult;
      try {
        const responseText = await webhookResponse.text();
        console.log('Raw webhook response:', responseText.substring(0, 500)); // Log first 500 chars
        
        // Check if response is HTML (error page)
        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
          console.error('Webhook returned HTML instead of JSON - likely an error page');
          console.error('Response was:', responseText.substring(0, 500));
          
          return res.status(500).json({ 
            success: false, 
            error: 'Webhook service is not responding correctly. Please check webhook URL configuration.' 
          });
        }
        
        // Try to parse as JSON
        const parsedResponse = JSON.parse(responseText);
        
        // Handle the webhook response format {"output": "content"}
        if (parsedResponse && parsedResponse.output) {
          webhookResult = {
            success: true,
            content: parsedResponse.output,
            message: 'Social media content generated successfully'
          };
        } else {
          webhookResult = parsedResponse;
        }
      } catch (parseError) {
        console.error('Failed to parse webhook response as JSON:', parseError);
        console.error('Response content type:', webhookResponse.headers.get('content-type'));
        console.error('Response was:', responseText.substring(0, 200));
        
        return res.status(500).json({ 
          success: false, 
          error: 'Webhook returned invalid JSON response. Please check webhook configuration.' 
        });
      }

      // Deduct credits after successful webhook call
      await storage.subtractUserCredits(userId, 5, `Tạo nội dung social media cho ${platforms.length} nền tảng`);

      // Log credit usage for social media content generation (SEO flow)
      await logCreditUsage(
        userId,
        'social_content',
        null, // no specific content length
        null, // no specific AI model
        false, // not image generation
        0, // no images
        5, // social media content costs 5 credits
        { social_content: 5, total: 5 },
        { contentSource, platforms, briefDescription, seoTopic, seoKeywords },
        seoTopic || briefDescription?.substring(0, 100) || 'Social Media Content (SEO)',
        webhookResult?.content ? webhookResult.content.split(/\s+/).length : 0,
        true // success
      );

      // Return webhook response to frontend
      res.json({ 
        success: true, 
        data: Object.assign(webhookResult || {}, { creditsUsed: 5 })
      });
    } catch (error) {
      console.error('Error generating social media content:', error);
      res.status(500).json({ success: false, error: 'Failed to generate social media content' });
    }
  });

  // Save social media content to "Nội dung đã tạo"
  app.post('/api/social/save-created-content', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const { 
        content, 
        title, 
        platforms, 
        contentSource, 
        selectedArticleId,
        imageData,
        extractedContent,
        sourceArticleId,
        referenceLink
      } = req.body;

      if (!content || !title) {
        return res.status(400).json({ 
          success: false, 
          error: 'Content and title are required' 
        });
      }

      console.log('Saving social content with data:', {
        title,
        platforms,
        contentSource,
        hasImageData: !!imageData,
        imageUrl: imageData?.imageUrl
      });

      // Format content for storage
      let formattedContent = '';
      if (Array.isArray(content)) {
        formattedContent = content.map(item => {
          const platform = item.output?.['Nền tảng đăng'] || 'Unknown';
          const text = item.output?.['Nội dung bài viết'] || '';
          return `**${platform}:**\n${text}`;
        }).join('\n\n');
      } else {
        formattedContent = JSON.stringify(content, null, 2);
      }

      // Note: Images are handled separately through article-image associations
      // Do not add image links to content to avoid duplication

      // Create article entry for social content
      const [savedContent] = await db.insert(schema.articles).values({
        userId: userId,
        title: title,
        content: formattedContent,
        textContent: formattedContent, // Same as content for social media posts
        keywords: platforms?.join(', ') || '',
        status: 'published',
        creditsUsed: 0, // No credits for saving already generated content
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      // If image is provided, associate it with the article
      if (imageData?.id && savedContent.id) {
        try {
          await db.update(schema.images)
            .set({ 
              articleId: savedContent.id,
              updatedAt: new Date()
            })
            .where(eq(schema.images.id, imageData.id));
          
          console.log(`Associated image ${imageData.id} with article ${savedContent.id}`);
        } catch (error) {
          console.error('Error associating image with article:', error);
          // Continue without failing the whole operation
        }
      }

      res.json({
        success: true,
        data: {
          ...savedContent,
          imageUrl: imageData?.imageUrl || null,
          hasImage: !!imageData?.imageUrl
        }
      });

    } catch (error) {
      console.error('Error saving social content:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save content'
      });
    }
  });

  // Create final social media content after approval
  app.post('/api/social/create-final-content', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const { 
        extractedContent,
        contentSource, 
        briefDescription, 
        selectedArticleId, 
        referenceLink, 
        platforms, 
        includeImage, 
        imageSource, 
        imagePrompt, 
        approveExtract,
        extracted_data,
        genSEO,
        approve_extract
      } = req.body;

      console.log('Final content creation request:', req.body);
      console.log('extractedContent value:', extractedContent);
      console.log('extractedContent type:', typeof extractedContent);
      console.log('contentSource:', contentSource);
      console.log('genSEO from frontend:', genSEO);

      // Get social content credit configuration and check user credits
      const finalSocialCreditCheckRes = await db.query.systemSettings.findFirst({
        where: eq(systemSettings.key, 'credit_config')
      });
      
      let requiredCredits = 5; // Default
      if (finalSocialCreditCheckRes?.value) {
        try {
          const parsedConfig = typeof finalSocialCreditCheckRes.value === 'string' 
            ? JSON.parse(finalSocialCreditCheckRes.value) 
            : finalSocialCreditCheckRes.value;
          requiredCredits = parsedConfig?.socialContent?.perGeneration || 5;
        } catch (error) {
          console.log('Using default social content credits for check:', error);
        }
      }

      // Check if user has enough credits
      const user = await storage.getUser(userId);
      if (!user || user.credits < requiredCredits) {
        return res.status(400).json({ 
          success: false, 
          error: `Insufficient credits. Need at least ${requiredCredits} credits.` 
        });
      }

      // Get webhook URL from settings
      const socialContentWebhookUrl = await storage.getSetting('socialContentWebhookUrl');
      if (!socialContentWebhookUrl) {
        return res.status(500).json({ 
          success: false, 
          error: 'Social content webhook URL not configured' 
        });
      }

      // Prepare webhook payload - let webhook generate platform-specific content
      // Don't send extracted_data - let webhook create fresh content for each platform
      
      // Force genSEO to false when using existing article
      const shouldGenSEO = contentSource === 'existing-article' ? false : (genSEO || false);
      console.log('shouldGenSEO calculated:', shouldGenSEO);
      
      // Create platform-specific content based on extracted content
      const baseDescription = extractedContent ? 
        extractedContent.replace(/<[^>]*>/g, '').substring(0, 200) + "..." : 
        "Tạo nội dung mạng xã hội về chủ đề được chọn";
      
      const finalWebhookPayload = {
        topic: baseDescription,
        keywords: "CNTT, công nghệ thông tin, AI, blockchain, IoT", 
        url: referenceLink || "",
        extract_content: "false", // Don't extract - generate new content
        extracted_data: "", // Empty - let webhook generate platform-specific content
        post_to_linkedin: platforms.includes('linkedin') ? "true" : "false",
        post_to_facebook: platforms.includes('facebook') ? "true" : "false",
        post_to_x: platforms.includes('twitter') ? "true" : "false",
        post_to_instagram: platforms.includes('instagram') ? "true" : "false",
        genSEO: shouldGenSEO,
        approve_extract: approve_extract || "false"
      };

      // Send final data to webhook
      const fetch = (await import('node-fetch')).default;
      
      console.log('Sending final webhook request to:', socialContentWebhookUrl);
      console.log('Final webhook payload:', JSON.stringify(finalWebhookPayload, null, 2));
      
      const payloadString = JSON.stringify(finalWebhookPayload);
      console.log('Payload string length:', payloadString.length);
      
      const webhookResponse = await fetch(socialContentWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(payloadString, 'utf8').toString(),
          'Accept': 'application/json',
          'User-Agent': 'SEO-Content-Generator/1.0'
        },
        body: payloadString
      });

      if (!webhookResponse.ok) {
        console.error('Final webhook request failed:', webhookResponse.status, webhookResponse.statusText);
        const errorText = await webhookResponse.text();
        console.error('Final webhook error response:', errorText);
        return res.status(500).json({ 
          success: false, 
          error: `Final webhook request failed: ${webhookResponse.status} ${webhookResponse.statusText}` 
        });
      }

      let webhookResult;
      try {
        webhookResult = await webhookResponse.json();
      } catch (parseError) {
        console.error('Failed to parse final webhook response as JSON:', parseError);
        webhookResult = { message: 'Final webhook executed successfully but returned non-JSON response' };
      }

      console.log('=== WEBHOOK RESPONSE DEBUG ===');
      console.log('Final webhook result:', webhookResult);
      console.log('Type:', typeof webhookResult);
      console.log('Is Array:', Array.isArray(webhookResult));
      if (Array.isArray(webhookResult)) {
        console.log('Array length:', webhookResult.length);
        webhookResult.forEach((item, index) => {
          console.log(`Item ${index}:`, item);
        });
      }
      console.log('=== END WEBHOOK DEBUG ===');

      // Get social content credit configuration and deduct credits
      const finalSocialCreditConfigRes = await db.query.systemSettings.findFirst({
        where: eq(systemSettings.key, 'credit_config')
      });
      
      let finalSocialCredits = 5; // Default
      if (finalSocialCreditConfigRes?.value) {
        try {
          const parsedConfig = typeof finalSocialCreditConfigRes.value === 'string' 
            ? JSON.parse(finalSocialCreditConfigRes.value) 
            : finalSocialCreditConfigRes.value;
          finalSocialCredits = parsedConfig?.socialContent?.perGeneration || 5;
        } catch (error) {
          console.log('Using default final social content credits:', error);
        }
      }

      // Deduct credits for successful social content generation
      await storage.subtractUserCredits(userId, finalSocialCredits, `Tạo nội dung social media hoàn chỉnh`);

      // Return webhook response to frontend - ensure it's the actual webhook data
      res.json({ 
        success: true, 
        data: Object.assign(webhookResult || { message: 'Content approved and sent to Social Media Content webhook' }, { creditsUsed: finalSocialCredits })
      });
    } catch (error) {
      console.error('Error creating final social media content:', error);
      res.status(500).json({ success: false, error: 'Failed to create final social media content' });
    }
  });

  // ========== Admin API ==========
  // Get all users
  app.get('/api/admin/users', async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }

      const page = parseInt(req.query.page as string || '1');
      const limit = parseInt(req.query.limit as string || '10');
      
      const { users, total } = await storage.listUsers(page, limit);
      
      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json({
        success: true,
        data: {
          users: usersWithoutPasswords,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
  });

  // Update user (admin)
  app.patch('/api/admin/users/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }

      const userId = parseInt(req.params.id);
      const { fullName, email, role, credits, language } = req.body;
      
      // Update user
      const updatedUser = await storage.updateUser(userId, {
        fullName,
        email,
        role,
        credits,
        language
      });
      
      if (!updatedUser) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      
      // Don't include password in response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json({ success: true, data: userWithoutPassword });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ success: false, error: 'Failed to update user' });
    }
  });

  // Get admin dashboard stats
  app.get('/api/admin/stats', async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }

      // Get total users
      const { total: totalUsers } = await storage.listUsers(1, 0);
      
      // Get total articles
      const [{ count: totalArticles }] = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(schema.articles);
      
      // Get total credits purchased (sum of positive credit transactions)
      const [{ sum: totalCredits }] = await db
        .select({ sum: sql`sum(amount)`.mapWith(Number) })
        .from(schema.creditTransactions)
        .where(sql`amount > 0`);
      
      // Get total revenue (sum of credit and storage plan purchases)
      // In a real implementation, this would come from actual payment records
      // For now, just estimate based on credit transactions
      const totalRevenue = totalCredits ? totalCredits * 10000 : 0; // Rough estimate
      
      res.json({
        success: true,
        data: {
          totalUsers,
          totalArticles,
          totalCredits: totalCredits || 0,
          totalRevenue
        }
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch admin stats' });
    }
  });
  
  // Get admin settings
  app.get('/api/admin/settings', async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }
      
      // Lấy tất cả cài đặt từ cơ sở dữ liệu
      // Phân loại theo danh mục
      const generalSettings = await storage.getSettingsByCategory('general');
      const aiSettings = await storage.getSettingsByCategory('ai');
      const emailSettings = await storage.getSettingsByCategory('smtp');
      
      // Lấy cài đặt webhook và thông báo
      const integrationSettings = await storage.getSettingsByCategory('integration');
      console.log('Integration settings retrieved:', integrationSettings);
      const apiSettings = await storage.getSettingsByCategory('api');
      const firebaseSettings = await storage.getSettingsByCategory('firebase');
      const imageSettings = await storage.getSettingsByCategory('image_generation');
      const socialSettings = await storage.getSettingsByCategory('social_content');
      const socialOAuthSettings = await storage.getSettingsByCategory('social');
      const themeSettings = await storage.getSettingsByCategory('theme');
      
      // Chuẩn bị đối tượng cài đặt
      const settings = {
        // General settings
        siteName: generalSettings.siteName || "SEO AI Writer",
        siteDescription: generalSettings.siteDescription || "AI-powered SEO content generator",
        contactEmail: generalSettings.contactEmail || "support@seoaiwriter.com",
        supportEmail: generalSettings.supportEmail || "support@seoaiwriter.com",
        
        // Feature flags
        enableNewUsers: generalSettings.enableNewUsers === "true",
        enableArticleCreation: generalSettings.enableArticleCreation === "true",
        enableAutoPublish: generalSettings.enableAutoPublish === "true",
        maintenanceMode: generalSettings.maintenanceMode === "true",
        offlineMode: generalSettings.offlineMode === "true",
        
        // AI settings
        aiModel: aiSettings.aiModel || "gpt-3.5-turbo",
        aiTemperature: parseFloat(aiSettings.aiTemperature || "0.7"),
        aiContextLength: parseInt(aiSettings.aiContextLength || "4000"),
        systemPromptPrefix: aiSettings.systemPromptPrefix || "",
        defaultUserCredits: parseInt(aiSettings.defaultUserCredits || "50"),
        creditCostPerArticle: parseInt(aiSettings.creditCostPerArticle || "10"),
        creditCostPerImage: parseInt(aiSettings.creditCostPerImage || "5"),
        
        // Email settings
        smtpServer: emailSettings.smtpServer || "",
        smtpPort: parseInt(emailSettings.smtpPort || "587"),
        smtpUsername: emailSettings.smtpUsername || "",
        smtpPassword: emailSettings.smtpPassword || "",
        emailSender: emailSettings.emailSender || "",
        appBaseUrl: emailSettings.appBaseUrl || "",
        
        // API integration settings
        openaiApiKey: apiSettings.openaiApiKey || "",
        claudeApiKey: apiSettings.claudeApiKey || "",
        wordpressApiUrl: apiSettings.wordpressApiUrl || "",
        wordpressApiUser: apiSettings.wordpressApiUser || "",
        wordpressApiKey: apiSettings.wordpressApiKey || "",
        
        // Webhook settings
        webhookSecret: integrationSettings.webhookSecret || "",
        notificationWebhookUrl: integrationSettings.notificationWebhookUrl || "",
        // Sử dụng notificationWebhookUrl thay cho webhook_url để thống nhất
        webhook_url: integrationSettings.notificationWebhookUrl || "",
        
        // Image generation settings
        imageWebhookUrl: imageSettings.imageWebhookUrl || "",
        imageCreditsPerGeneration: parseInt(imageSettings.imageCreditsPerGeneration || "1"),
        enableImageGeneration: imageSettings.enableImageGeneration === "true",
        
        // Social media content generation settings
        socialContentWebhookUrl: socialSettings.socialContentWebhookUrl || "",
        socialContentCreditsPerGeneration: parseInt(socialSettings.socialContentCreditsPerGeneration || "1"),
        enableSocialContentGeneration: socialSettings.enableSocialContentGeneration === "true",
        
        // Firebase settings
        firebaseApiKey: firebaseSettings.firebaseApiKey || "",
        firebaseProjectId: firebaseSettings.firebaseProjectId || "",
        firebaseAppId: firebaseSettings.firebaseAppId || "",
        enableGoogleAuth: firebaseSettings.enableGoogleAuth === "true",
        enableFacebookAuth: firebaseSettings.enableFacebookAuth === "true",
        
        // Social OAuth settings
        facebookAppId: socialOAuthSettings.facebookAppId || "",
        facebookAppSecret: socialOAuthSettings.facebookAppSecret || "",
        enableFacebookOAuth: socialOAuthSettings.enableFacebookOAuth === "true",
        
        // Theme settings
        defaultTheme: themeSettings.defaultTheme || "light",
        allowUserThemeChange: themeSettings.allowUserThemeChange === "true",
        
        // System info
        version: "1.0.0",
        lastBackup: generalSettings.lastBackup || "N/A",
        dbStatus: "online"
      };
      
      res.json({ success: true, data: settings });
    } catch (error) {
      console.error('Error fetching admin settings:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch admin settings' });
    }
  });
  
  // Admin settings API - General settings update
  app.patch('/api/admin/settings/general', async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }
      
      const { 
        siteName, 
        siteDescription, 
        contactEmail, 
        supportEmail,
        enableNewUsers,
        enableArticleCreation,
        enableAutoPublish,
        maintenanceMode,
        offlineMode
      } = req.body;
      
      console.log('General settings update request received:');
      console.log('- siteName:', siteName);
      console.log('- offlineMode:', offlineMode);
      
      // Update settings
      const updates = [
        storage.setSetting('siteName', siteName, 'general'),
        storage.setSetting('siteDescription', siteDescription, 'general'),
        storage.setSetting('contactEmail', contactEmail, 'general'),
        storage.setSetting('supportEmail', supportEmail, 'general'),
        storage.setSetting('enableNewUsers', enableNewUsers.toString(), 'general'),
        storage.setSetting('enableArticleCreation', enableArticleCreation.toString(), 'general'),
        storage.setSetting('enableAutoPublish', enableAutoPublish.toString(), 'general'),
        storage.setSetting('maintenanceMode', maintenanceMode.toString(), 'general'),
        storage.setSetting('offlineMode', offlineMode.toString(), 'general')
      ];
      
      await Promise.all(updates);
      
      // Xác nhận cài đặt đã được lưu
      const savedSettings = await storage.getSettingsByCategory('general');
      
      console.log('Verification after save:');
      console.log('- Saved siteName:', savedSettings.siteName);
      console.log('- Saved offlineMode:', savedSettings.offlineMode);
      
      res.json({ 
        success: true, 
        data: { 
          message: 'General settings updated successfully',
          settings: savedSettings
        } 
      });
    } catch (error) {
      console.error('Error updating general settings:', error);
      res.status(500).json({ success: false, error: 'Failed to update general settings' });
    }
  });
  
  // Admin settings API - Webhook settings update
  app.patch('/api/admin/settings/webhook', async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }
      
      const { 
        webhookSecret, 
        notificationWebhookUrl, 
        imageWebhookUrl, 
        imageCreditsPerGeneration, 
        enableImageGeneration,
        socialContentWebhookUrl,
        socialContentCreditsPerGeneration,
        enableSocialContentGeneration
      } = req.body;
      
      console.log('Webhook settings update request received:');
      console.log('- notificationWebhookUrl:', notificationWebhookUrl);
      console.log('- webhookSecret provided:', webhookSecret !== undefined);
      console.log('- imageWebhookUrl:', imageWebhookUrl);
      console.log('- imageCreditsPerGeneration:', imageCreditsPerGeneration);
      console.log('- enableImageGeneration:', enableImageGeneration);
      console.log('- socialContentWebhookUrl:', socialContentWebhookUrl);
      console.log('- socialContentCreditsPerGeneration:', socialContentCreditsPerGeneration);
      console.log('- enableSocialContentGeneration:', enableSocialContentGeneration);
      
      let webhookUrlResult = true;
      let webhookSecretResult = true;
      let imageWebhookResult = true;
      let imageCreditsResult = true;
      let enableImageResult = true;
      let socialWebhookResult = true;
      let socialCreditsResult = true;
      let enableSocialResult = true;
      
      // Update notification webhook URL if provided
      if (notificationWebhookUrl !== undefined) {
        webhookUrlResult = await storage.setSetting('notificationWebhookUrl', notificationWebhookUrl, 'integration');
        console.log('- notificationWebhookUrl update result:', webhookUrlResult);
      }
      
      // Update webhook secret if provided (now optional)
      if (webhookSecret !== undefined) {
        webhookSecretResult = await storage.setSetting('webhookSecret', webhookSecret, 'integration');
        console.log('- webhookSecret update result:', webhookSecretResult);
      }
      
      // Update image generation webhook URL if provided
      if (imageWebhookUrl !== undefined) {
        imageWebhookResult = await storage.setSetting('imageWebhookUrl', imageWebhookUrl, 'image_generation');
        console.log('- imageWebhookUrl update result:', imageWebhookResult);
      }
      
      // Update image credits per generation if provided
      if (imageCreditsPerGeneration !== undefined) {
        imageCreditsResult = await storage.setSetting('imageCreditsPerGeneration', String(imageCreditsPerGeneration), 'image_generation');
        console.log('- imageCreditsPerGeneration update result:', imageCreditsResult);
      }
      
      // Update enable image generation if provided
      if (enableImageGeneration !== undefined) {
        enableImageResult = await storage.setSetting('enableImageGeneration', String(enableImageGeneration), 'image_generation');
        console.log('- enableImageGeneration update result:', enableImageResult);
      }
      
      // Update social content webhook URL if provided
      if (socialContentWebhookUrl !== undefined) {
        socialWebhookResult = await storage.setSetting('socialContentWebhookUrl', socialContentWebhookUrl, 'social_content');
        console.log('- socialContentWebhookUrl update result:', socialWebhookResult);
      }
      
      // Update social content credits per generation if provided
      if (socialContentCreditsPerGeneration !== undefined) {
        socialCreditsResult = await storage.setSetting('socialContentCreditsPerGeneration', String(socialContentCreditsPerGeneration), 'social_content');
        console.log('- socialContentCreditsPerGeneration update result:', socialCreditsResult);
      }
      
      // Update enable social content generation if provided
      if (enableSocialContentGeneration !== undefined) {
        enableSocialResult = await storage.setSetting('enableSocialContentGeneration', String(enableSocialContentGeneration), 'social_content');
        console.log('- enableSocialContentGeneration update result:', enableSocialResult);
      }
      
      if (!webhookUrlResult || !webhookSecretResult || !imageWebhookResult || !imageCreditsResult || !enableImageResult || !socialWebhookResult || !socialCreditsResult || !enableSocialResult) {
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to save one or more webhook settings' 
        });
      }
      
      // Kiểm tra xem cài đặt đã được lưu thành công hay chưa
      const savedWebhookUrl = await storage.getSetting('notificationWebhookUrl');
      const savedWebhookSecret = await storage.getSetting('webhookSecret');
      const imageSettings = await storage.getSettingsByCategory('image_generation');
      const socialSettings = await storage.getSettingsByCategory('social_content');
      const savedImageWebhookUrl = imageSettings.imageWebhookUrl;
      const savedImageCredits = imageSettings.imageCreditsPerGeneration;
      const savedEnableImage = imageSettings.enableImageGeneration;
      const savedSocialWebhookUrl = socialSettings.socialContentWebhookUrl;
      const savedSocialCredits = socialSettings.socialContentCreditsPerGeneration;
      const savedEnableSocial = socialSettings.enableSocialContentGeneration;
      
      console.log('Verification after save:');
      console.log('- Saved notificationWebhookUrl:', savedWebhookUrl);
      console.log('- Saved webhookSecret exists:', savedWebhookSecret !== null);
      console.log('- Saved imageWebhookUrl:', savedImageWebhookUrl);
      console.log('- Saved imageCreditsPerGeneration:', savedImageCredits);
      console.log('- Saved enableImageGeneration:', savedEnableImage);
      console.log('- Saved socialContentWebhookUrl:', savedSocialWebhookUrl);
      console.log('- Saved socialContentCreditsPerGeneration:', savedSocialCredits);
      console.log('- Saved enableSocialContentGeneration:', savedEnableSocial);
      
      res.json({ 
        success: true, 
        data: { 
          message: 'Webhook settings updated successfully',
          webhookUrl: savedWebhookUrl,
          webhookSecretExists: savedWebhookSecret !== null,
          imageWebhookUrl: savedImageWebhookUrl,
          imageCreditsPerGeneration: savedImageCredits,
          enableImageGeneration: savedEnableImage,
          socialContentWebhookUrl: savedSocialWebhookUrl,
          socialContentCreditsPerGeneration: savedSocialCredits,
          enableSocialContentGeneration: savedEnableSocial
        } 
      });
    } catch (error) {
      console.error('Error updating webhook settings:', error);
      res.status(500).json({ success: false, error: 'Failed to update webhook settings' });
    }
  });

  // Get performance metrics for the admin dashboard
  app.get('/api/admin/performance', async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }
      
      const timeRange = req.query.timeRange || '24h';
      
      // In a real application, this would fetch actual data from monitoring systems
      // For now, we'll return mock data for demonstration purposes
      
      // Generate historical data points
      const now = new Date();
      const historyPoints = 24; // 24 hours of data
      
      const responseTimeHistory = Array.from({ length: historyPoints }, (_, i) => {
        const timestamp = new Date(now.getTime() - (historyPoints - 1 - i) * 3600000).toISOString();
        return {
          timestamp,
          average: 120 + Math.random() * 80,
          p95: 180 + Math.random() * 100,
          p99: 220 + Math.random() * 120,
        };
      });
      
      const requestsHistory = Array.from({ length: historyPoints }, (_, i) => {
        const timestamp = new Date(now.getTime() - (historyPoints - 1 - i) * 3600000).toISOString();
        return {
          timestamp,
          total: 1000 + Math.floor(Math.random() * 500),
          errors: Math.floor(Math.random() * 50),
        };
      });
      
      const resourceUsageHistory = Array.from({ length: historyPoints }, (_, i) => {
        const timestamp = new Date(now.getTime() - (historyPoints - 1 - i) * 3600000).toISOString();
        return {
          timestamp,
          cpu: 30 + Math.random() * 30,
          memory: 40 + Math.random() * 25,
          disk: 60 + Math.random() * 15,
        };
      });
      
      // Generate endpoint performance data
      const endpointPerformance = [
        { endpoint: "/api/articles", count: 5230, averageTime: 132, errorRate: 1.2 },
        { endpoint: "/api/user", count: 8450, averageTime: 88, errorRate: 0.8 },
        { endpoint: "/api/generate-content", count: 1820, averageTime: 2350, errorRate: 5.2 },
        { endpoint: "/api/admin/stats", count: 645, averageTime: 165, errorRate: 3.1 },
        { endpoint: "/api/plans", count: 1230, averageTime: 112, errorRate: 1.5 },
      ];
      
      res.json({
        success: true,
        data: {
          // Current stats
          averageResponseTime: 145,
          p95ResponseTime: 220,
          p99ResponseTime: 280,
          
          totalRequests: 24560,
          requestsPerMinute: 42,
          errorRate: 2.5,
          
          cpuUsage: 45,
          memoryUsage: 62,
          diskUsage: 72,
          
          // Historical data
          responseTimeHistory,
          requestsHistory,
          resourceUsageHistory,
          
          // Endpoint performance
          endpointPerformance,
        }
      });
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch performance metrics' });
    }
  });

  // Admin settings API - Social OAuth settings update
  app.patch('/api/admin/settings/social-oauth', async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }
      
      const { 
        facebookAppId,
        facebookAppSecret,
        enableFacebookOAuth
      } = req.body;
      
      console.log('Social OAuth settings update request received:');
      console.log('- facebookAppId provided:', facebookAppId !== undefined);
      console.log('- facebookAppSecret provided:', facebookAppSecret !== undefined);
      console.log('- enableFacebookOAuth:', enableFacebookOAuth);
      
      // Update settings
      const updates = [
        storage.setSetting('facebookAppId', facebookAppId, 'social'),
        storage.setSetting('facebookAppSecret', facebookAppSecret, 'social'),
        storage.setSetting('enableFacebookOAuth', enableFacebookOAuth.toString(), 'social')
      ];
      
      await Promise.all(updates);
      
      // Verification
      const savedSettings = await storage.getSettingsByCategory('social');
      console.log('Social OAuth settings saved successfully');
      
      res.json({ 
        success: true, 
        data: { 
          message: 'Social OAuth settings updated successfully',
          settings: savedSettings
        } 
      });
    } catch (error) {
      console.error('Error updating social OAuth settings:', error);
      res.status(500).json({ success: false, error: 'Failed to update social OAuth settings' });
    }
  });

  // ========== Feedback API ==========
  // Submit feedback
  app.post('/api/feedback', async (req, res) => {
    try {
      const { name, email, subject, message, page } = req.body;
      
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ 
          success: false, 
          error: 'Name, email, subject and message are required' 
        });
      }
      
      // Get user ID if authenticated
      const userId = req.isAuthenticated() ? req.user.id : null;
      
      // Insert feedback into database
      const [feedback] = await db.insert(schema.feedback).values({
        name,
        email,
        subject,
        message,
        page: page || 'unknown',
        userId,
        status: 'unread'
      }).returning();
      
      // Send email notification to admin
      try {
        const { sendEmail } = await import('./email-service');
        
        const adminEmail = 'admin@seoaiwriter.com'; // This should come from settings
        
        await sendEmail({
          to: adminEmail,
          subject: `New Feedback: ${subject}`,
          html: `
            <h3>New Feedback Received</h3>
            <p><strong>From:</strong> ${name} (${email})</p>
            <p><strong>Page:</strong> ${page || 'Unknown'}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
            <hr>
            <p><em>This feedback was submitted at ${new Date().toLocaleString()}</em></p>
          `
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the request if email fails
      }
      
      res.status(201).json({ success: true, data: feedback });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      res.status(500).json({ success: false, error: 'Failed to submit feedback' });
    }
  });

  // Get all feedback (admin only)
  app.get('/api/admin/feedback', async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }

      const page = parseInt(req.query.page as string || '1');
      const limit = parseInt(req.query.limit as string || '10');
      const status = req.query.status as string;
      
      let query = db.query.feedback.findMany({
        orderBy: [sql`created_at DESC`],
        limit,
        offset: (page - 1) * limit,
        with: {
          user: {
            columns: {
              id: true,
              username: true,
              fullName: true
            }
          }
        }
      });
      
      // Filter by status if provided
      if (status && status !== 'all') {
        query = db.query.feedback.findMany({
          where: eq(schema.feedback.status, status),
          orderBy: [sql`created_at DESC`],
          limit,
          offset: (page - 1) * limit,
          with: {
            user: {
              columns: {
                id: true,
                username: true,
                fullName: true
              }
            }
          }
        });
      }
      
      const feedbackList = await query;
      
      // Get total count
      const [{ count: total }] = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(schema.feedback)
        .where(status && status !== 'all' ? eq(schema.feedback.status, status) : undefined);
      
      res.json({
        success: true,
        data: {
          feedback: feedbackList,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching feedback:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch feedback' });
    }
  });

  // Update feedback status (admin only)
  app.patch('/api/admin/feedback/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }

      const feedbackId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !['unread', 'read', 'replied'].includes(status)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Valid status is required (unread, read, replied)' 
        });
      }
      
      const [updatedFeedback] = await db
        .update(schema.feedback)
        .set({ 
          status,
          updatedAt: new Date()
        })
        .where(eq(schema.feedback.id, feedbackId))
        .returning();
      
      if (!updatedFeedback) {
        return res.status(404).json({ success: false, error: 'Feedback not found' });
      }
      
      res.json({ success: true, data: updatedFeedback });
    } catch (error) {
      console.error('Error updating feedback:', error);
      res.status(500).json({ success: false, error: 'Failed to update feedback' });
    }
  });

  // Delete feedback (admin only)
  app.delete('/api/admin/feedback/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }

      const feedbackId = parseInt(req.params.id);
      
      const [deletedFeedback] = await db
        .delete(schema.feedback)
        .where(eq(schema.feedback.id, feedbackId))
        .returning();
      
      if (!deletedFeedback) {
        return res.status(404).json({ success: false, error: 'Feedback not found' });
      }
      
      res.json({ success: true, data: deletedFeedback });
    } catch (error) {
      console.error('Error deleting feedback:', error);
      res.status(500).json({ success: false, error: 'Failed to delete feedback' });
    }
  });

  // ========== Image Generation API ==========
  // TEMPORARY: Add sample images for testing
  app.post('/api/debug/add-sample-images', async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }

      const userId = req.user.id;
      
      const sampleImages = [
        {
          userId,
          title: "AI Generated Landscape",
          prompt: "Beautiful mountain landscape with sunrise, digital art style",
          imageUrl: "https://picsum.photos/800/600?random=1",
          sourceText: "Sample article content about nature and landscapes",
          creditsUsed: 1,
          status: "generated"
        },
        {
          userId,
          title: "Technology Concept Art", 
          prompt: "Futuristic city with flying cars, cyberpunk style",
          imageUrl: "https://picsum.photos/800/600?random=2",
          sourceText: "Article about future technology trends",
          creditsUsed: 1,
          status: "generated"
        },
        {
          userId,
          title: "Business Meeting",
          prompt: "Professional business meeting in modern office, realistic style", 
          imageUrl: "https://picsum.photos/800/600?random=3",
          sourceText: "Business strategy article content",
          creditsUsed: 1,
          status: "generated"
        }
      ];

      const insertedImages = [];
      for (const imageData of sampleImages) {
        const savedImage = await storage.createImage(imageData);
        insertedImages.push(savedImage);
      }

      res.json({
        success: true,
        data: { 
          count: insertedImages.length,
          images: insertedImages 
        },
        message: `Added ${insertedImages.length} sample images`
      });

    } catch (error) {
      console.error('Error adding sample images:', error);
      res.status(500).json({ success: false, error: 'Failed to add sample images' });
    }
  });

  // Get user's generated images
  app.get('/api/dashboard/images', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const page = parseInt(req.query.page as string || '1');
      const limit = parseInt(req.query.limit as string || '10');
      
      console.log(`[DEBUG] Fetching images for user ${userId}, page ${page}, limit ${limit}`);
      
      const { images, total } = await storage.getImagesByUser(userId, page, limit);
      
      console.log(`[DEBUG] Found ${total} total images, returning ${images.length} images`);
      
      res.json({
        success: true,
        data: {
          images,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching user images:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch images' });
    }
  });

  // Generate new image
  app.post('/api/dashboard/images/generate', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const { title, prompt, sourceText, articleId } = req.body;
      
      if (!title || !prompt) {
        return res.status(400).json({ 
          success: false, 
          error: 'Title and prompt are required' 
        });
      }
      
      // Get image generation settings
      const imageSettings = await storage.getSettingsByCategory('image_generation');
      const imageWebhookUrl = imageSettings.imageWebhookUrl;
      const enableImageGeneration = imageSettings.enableImageGeneration === 'true';
      
      // Get credit configuration from admin settings for consistency
      const creditConfigRes = await db.query.systemSettings.findFirst({
        where: eq(systemSettings.key, 'credit_config')
      });
      
      let creditsPerGeneration = 2; // Default from credit config
      if (creditConfigRes?.value) {
        try {
          const parsedConfig = typeof creditConfigRes.value === 'string' 
            ? JSON.parse(creditConfigRes.value) 
            : creditConfigRes.value;
          creditsPerGeneration = parsedConfig?.imageGeneration?.perImage || 2;
        } catch (error) {
          console.log('Using default image generation credits:', error);
        }
      } else {
        // Fallback to old settings method if credit config not found
        creditsPerGeneration = parseInt(imageSettings.imageCreditsPerGeneration || '2');
      }
      
      if (!enableImageGeneration) {
        return res.status(400).json({ 
          success: false, 
          error: 'Image generation is currently disabled' 
        });
      }
      
      if (!imageWebhookUrl) {
        return res.status(400).json({ 
          success: false, 
          error: 'Image generation webhook is not configured' 
        });
      }
      
      // Check if user has enough credits
      const userCredits = await storage.getUserCredits(userId);
      if (userCredits < creditsPerGeneration) {
        return res.status(400).json({ 
          success: false, 
          error: 'Insufficient credits' 
        });
      }
      
      // Generate unique request ID for tracking
      const requestId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      
      // Prepare webhook payload
      const webhookPayload = {
        requestId,
        title,
        prompt,
        sourceText,
        userId,
        articleId,
        timestamp: new Date().toISOString(),
        creditsUsed: creditsPerGeneration
      };
      
      console.log(`Image generation request ${requestId}:`, {
        userId,
        title,
        prompt: prompt.substring(0, 100) + '...',
        webhookUrl: imageWebhookUrl
      });
      
      try {
        // Call image generation webhook
        const webhookResponse = await fetch(imageWebhookUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'User-Agent': 'SEO-AI-Writer/1.0',
            'X-Request-ID': requestId
          },
          body: JSON.stringify(webhookPayload),
          signal: AbortSignal.timeout(60000) // 60 second timeout for image generation
        });
        
        console.log(`Webhook response for ${requestId}:`, {
          status: webhookResponse.status,
          statusText: webhookResponse.statusText,
          headers: Object.fromEntries(webhookResponse.headers.entries())
        });
        
        if (!webhookResponse.ok) {
          const errorText = await webhookResponse.text();
          console.error(`Webhook error for ${requestId}:`, errorText);
          throw new Error(`Webhook returned ${webhookResponse.status}: ${errorText}`);
        }
        
        const webhookResult = await webhookResponse.json();
        console.log(`Webhook result for ${requestId}:`, webhookResult);
        
        let imageUrl = null;
        let success = false;
        
        // Handle different webhook response formats
        if (webhookResult && typeof webhookResult === 'object') {
          // Format 1: Standard {success: true, imageUrl: "url"}
          if (webhookResult.success && webhookResult.imageUrl) {
            imageUrl = webhookResult.imageUrl;
            success = true;
          }
          // Format 2: Array format [{fileName: "file.jpg"}]
          else if (Array.isArray(webhookResult) && webhookResult.length > 0 && webhookResult[0].fileName) {
            const fileName = webhookResult[0].fileName;
            // Get image base URL from settings or use webhook URL domain
            const imageCdnUrl = await storage.getSetting('imageCdnUrl');
            if (imageCdnUrl) {
              imageUrl = `${imageCdnUrl}/${fileName}`;
            } else {
              // Extract domain from webhook URL and assume images are served from there
              const webhookDomain = new URL(imageWebhookUrl).origin;
              imageUrl = `${webhookDomain}/images/${fileName}`;
            }
            success = true;
            console.log(`Converted fileName ${fileName} to imageUrl: ${imageUrl}`);
          }
          // Format 2b: Array format [{imageUrl: "full_url"}]
          else if (Array.isArray(webhookResult) && webhookResult.length > 0 && webhookResult[0].imageUrl) {
            imageUrl = webhookResult[0].imageUrl;
            success = true;
            console.log(`Using imageUrl from array: ${imageUrl}`);
          }
          // Format 2c: Array format [{image1: "full_url"}] or other image field names
          else if (Array.isArray(webhookResult) && webhookResult.length > 0) {
            const firstItem = webhookResult[0];
            // Look for common image field names
            const imageFields = ['image1', 'image', 'url', 'src', 'path'];
            for (const field of imageFields) {
              if (firstItem[field]) {
                imageUrl = firstItem[field];
                success = true;
                console.log(`Using ${field} from array: ${imageUrl}`);
                break;
              }
            }
          }
          // Format 3: Single object {fileName: "file.jpg"}
          else if (webhookResult.fileName) {
            const fileName = webhookResult.fileName;
            // Get image base URL from settings or use webhook URL domain
            const imageCdnUrl = await storage.getSetting('imageCdnUrl');
            if (imageCdnUrl) {
              imageUrl = `${imageCdnUrl}/${fileName}`;
            } else {
              // Extract domain from webhook URL and assume images are served from there
              const webhookDomain = new URL(imageWebhookUrl).origin;
              imageUrl = `${webhookDomain}/images/${fileName}`;
            }
            success = true;
            console.log(`Converted single fileName ${fileName} to imageUrl: ${imageUrl}`);
          }
          // Format 4: Alternative formats
          else if (webhookResult.data?.imageUrl) {
            imageUrl = webhookResult.data.imageUrl;
            success = true;
          }
          else if (webhookResult.url) {
            imageUrl = webhookResult.url;
            success = true;
          }
          // Format 5: Error response
          else if (webhookResult.success === false) {
            throw new Error(`Webhook returned error: ${webhookResult.error || 'Unknown error'}`);
          }
        }
        
        if (!success || !imageUrl) {
          throw new Error(`Invalid webhook response format. Expected {success: true, imageUrl: "url"} or [{fileName: "file.jpg"}], got: ${JSON.stringify(webhookResult)}`);
        }
        
        // Deduct credits first
        await storage.subtractUserCredits(userId, creditsPerGeneration, 'Image generation');
        
        // Save generated image to database
        const image = await storage.createImage({
          userId,
          articleId: articleId || null,
          title,
          prompt,
          imageUrl,
          sourceText: sourceText || null,
          creditsUsed: creditsPerGeneration,
          status: 'generated'
        });
        
        // Log credit usage for image generation
        await logCreditUsage(
          userId,
          'image_generation',
          null, // no content length for images
          null, // no AI model for images
          false, // this is just image generation
          1, // 1 image generated
          creditsPerGeneration,
          { images: creditsPerGeneration, total: creditsPerGeneration },
          { title, prompt, imageUrl },
          title,
          0, // no word count for images
          true // success
        );
        
        console.log(`Image generation completed for ${requestId}:`, {
          imageId: image.id,
          imageUrl: imageUrl,
          creditsDeducted: creditsPerGeneration
        });
        
        res.json({ 
          success: true, 
          data: {
            ...image,
            requestId,
            webhookResponse: {
              success: webhookResult.success,
              message: webhookResult.message || 'Image generated successfully'
            }
          }
        });
        
      } catch (webhookError: any) {
        console.error(`Webhook error for ${requestId}:`, webhookError);
        
        if (webhookError.name === 'AbortError' || webhookError.name === 'TimeoutError') {
          return res.status(504).json({
            success: false,
            error: 'Image generation service timeout. Please try again.',
            details: 'Webhook request timed out after 60 seconds'
          });
        }
        
        // Parse webhook error message for more specific feedback
        let errorMessage = 'Image generation service is not available. Please check webhook configuration.';
        let errorDetails = webhookError.message;
        
        if (webhookError.message.includes('404')) {
          errorMessage = 'Webhook endpoint not found or not configured for POST requests.';
          errorDetails = 'The webhook URL may be incorrect or the endpoint is not set up to handle image generation requests.';
        } else if (webhookError.message.includes('403')) {
          errorMessage = 'Webhook access denied.';
          errorDetails = 'The webhook URL requires authentication or proper permissions.';
        } else if (webhookError.message.includes('500')) {
          errorMessage = 'Webhook server error.';
          errorDetails = 'The webhook service encountered an internal error.';
        } else if (webhookError.message.includes('ECONNREFUSED') || webhookError.message.includes('ENOTFOUND')) {
          errorMessage = 'Cannot connect to webhook service.';
          errorDetails = 'The webhook URL is unreachable. Please verify the URL is correct and the service is running.';
        }
        
        return res.status(500).json({
          success: false,
          error: errorMessage,
          details: errorDetails,
          webhookUrl: imageWebhookUrl,
          requestId
        });
      }
    } catch (error) {
      console.error('Error generating image:', error);
      res.status(500).json({ success: false, error: 'Failed to generate image' });
    }
  });

  // Get image by ID
  app.get('/api/dashboard/images/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }
      
      const userId = req.user.id;
      const imageId = parseInt(req.params.id, 10);
      
      if (isNaN(imageId)) {
        return res.status(400).json({ success: false, error: 'Invalid image ID' });
      }
      
      const image = await storage.getImageById(imageId);
      
      if (!image) {
        return res.status(404).json({ success: false, error: 'Image not found' });
      }
      
      // Check ownership
      if (image.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
      
      res.json({ success: true, data: image });
    } catch (error) {
      console.error('Error fetching image details:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch image details' });
    }
  });

  // Save image to user's library
  app.post('/api/dashboard/images/save', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const { title, prompt, imageUrl, sourceText, creditsUsed } = req.body;
      const userId = req.user.id;

      if (!title || !prompt || !imageUrl) {
        return res.status(400).json({ 
          success: false, 
          error: 'Title, prompt, and image URL are required' 
        });
      }

      // Create a new image record in the user's library
      const savedImage = await storage.createImage({
        userId,
        title,
        prompt,
        imageUrl,
        sourceText: sourceText || null,
        creditsUsed: creditsUsed || 0,
        status: 'saved',
        articleId: null
      });

      res.json({ 
        success: true, 
        data: savedImage,
        message: 'Image saved to library successfully'
      });
    } catch (error) {
      console.error('Error saving image:', error);
      res.status(500).json({ success: false, error: 'Failed to save image to library' });
    }
  });

  // Delete image
  app.delete('/api/dashboard/images/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }
      
      const userId = req.user.id;
      const imageId = parseInt(req.params.id, 10);
      
      if (isNaN(imageId)) {
        return res.status(400).json({ success: false, error: 'Invalid image ID' });
      }
      
      const image = await storage.getImageById(imageId);
      
      if (!image) {
        return res.status(404).json({ success: false, error: 'Image not found' });
      }
      
      // Check ownership
      if (image.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
      
      await storage.deleteImage(imageId);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).json({ success: false, error: 'Failed to delete image' });
    }
  });

  // ========== Demo Image Generation Webhook ==========
  // Demo webhook endpoint for testing image generation
  app.post('/api/demo/image-generation', async (req, res) => {
    try {
      console.log('Demo image generation webhook called with:', req.body);
      
      const { title, prompt, sourceText, userId, articleId } = req.body;
      
      if (!title || !prompt) {
        return res.status(400).json({
          success: false,
          error: 'Title and prompt are required'
        });
      }
      
      // Simulate image generation delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test both response formats randomly
      const useFileNameFormat = Math.random() > 0.5;
      
      if (useFileNameFormat) {
        // Return fileName format like your webhook
        const fileName = `${title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.jpg`;
        res.json([{
          fileName: fileName
        }]);
      } else {
        // Return standard format
        const demoImageUrl = `https://picsum.photos/800/600?random=${Date.now()}`;
        res.json({
          success: true,
          imageUrl: demoImageUrl,
          message: 'Demo image generated successfully'
        });
      }
    } catch (error) {
      console.error('Demo image generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Demo image generation failed'
      });
    }
  });

  // Test webhook connectivity endpoint
  app.post('/api/webhook/test', async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }

      const { webhookUrl } = req.body;
      
      if (!webhookUrl) {
        return res.status(400).json({ 
          success: false, 
          error: 'Webhook URL is required' 
        });
      }

      console.log('Testing webhook connectivity to:', webhookUrl);

      // Test payload
      const testPayload = {
        requestId: 'test_' + Date.now(),
        title: 'Test Image',
        prompt: 'A test image for webhook connectivity',
        userId: req.user.id,
        timestamp: new Date().toISOString(),
        creditsUsed: 1,
        test: true
      };

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'User-Agent': 'SEO-AI-Writer/1.0 (Test)',
            'X-Test-Request': 'true'
          },
          body: JSON.stringify(testPayload),
          signal: AbortSignal.timeout(30000)
        });

        const responseText = await response.text();
        let responseData;
        
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = { rawResponse: responseText };
        }

        console.log('Webhook test response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          data: responseData
        });

        res.json({
          success: true,
          data: {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries()),
            response: responseData,
            message: response.ok ? 'Webhook is reachable and responding' : 'Webhook returned an error'
          }
        });

      } catch (fetchError: any) {
        console.error('Webhook test error:', fetchError);
        
        let errorType = 'Unknown error';
        let suggestion = 'Please check the webhook URL and ensure the service is running.';
        
        if (fetchError.name === 'AbortError' || fetchError.name === 'TimeoutError') {
          errorType = 'Timeout';
          suggestion = 'The webhook took too long to respond. Check if the service is running and responsive.';
        } else if (fetchError.message.includes('ECONNREFUSED')) {
          errorType = 'Connection refused';
          suggestion = 'The webhook service is not accepting connections. Verify the URL and port.';
        } else if (fetchError.message.includes('ENOTFOUND')) {
          errorType = 'DNS resolution failed';
          suggestion = 'The webhook domain cannot be resolved. Check the URL spelling and DNS.';
        } else if (fetchError.message.includes('ECONNRESET')) {
          errorType = 'Connection reset';
          suggestion = 'The webhook service closed the connection. Check server logs.';
        }

        res.json({
          success: false,
          error: `Webhook test failed: ${errorType}`,
          details: fetchError.message,
          suggestion,
          webhookUrl
        });
      }

    } catch (error) {
      console.error('Error testing webhook:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to test webhook' 
      });
    }
  });

  // ========== API Keys Management ==========
  // Get user's API keys
  app.get('/api/keys', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const apiKeys = await storage.getApiKeys(userId);
      
      res.json({ success: true, data: apiKeys });
    } catch (error) {
      console.error('Error fetching API keys:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch API keys' });
    }
  });

  // Create new API key
  app.post('/api/keys', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const { name, scopes } = req.body;
      
      if (!name || !scopes || !Array.isArray(scopes)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Name and scopes are required' 
        });
      }

      const apiKey = await storage.createApiKey(userId, name, scopes);
      
      res.status(201).json({ success: true, data: apiKey });
    } catch (error) {
      console.error('Error creating API key:', error);
      res.status(500).json({ success: false, error: 'Failed to create API key' });
    }
  });

  // Update API key
  app.patch('/api/keys/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const keyId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      const apiKey = await storage.updateApiKey(keyId, userId, { isActive });
      
      if (!apiKey) {
        return res.status(404).json({ success: false, error: 'API key not found' });
      }
      
      res.json({ success: true, data: apiKey });
    } catch (error) {
      console.error('Error updating API key:', error);
      res.status(500).json({ success: false, error: 'Failed to update API key' });
    }
  });

  // Delete API key
  app.delete('/api/keys/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const keyId = parseInt(req.params.id);
      
      const deleted = await storage.deleteApiKey(keyId, userId);
      
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'API key not found' });
      }
      
      res.json({ success: true, message: 'API key deleted successfully' });
    } catch (error) {
      console.error('Error deleting API key:', error);
      res.status(500).json({ success: false, error: 'Failed to delete API key' });
    }
  });

  // ========== AI API Keys Management ==========
  // Get AI API keys for current user
  app.get('/api/ai-api-keys', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const keys = await db.query.aiApiKeys.findMany({
        where: eq(schema.aiApiKeys.userId, userId),
        orderBy: [schema.aiApiKeys.createdAt],
      });

      // Mask API keys for security
      const maskedKeys = keys.map(key => ({
        ...key,
        apiKey: key.apiKey.substring(0, 4) + '***' + key.apiKey.substring(key.apiKey.length - 4),
      }));

      res.json({ success: true, data: maskedKeys });
    } catch (error) {
      console.error('Error fetching AI API keys:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch AI API keys' });
    }
  });

  // Create new AI API key
  app.post('/api/ai-api-keys', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const { name, provider, apiKey } = req.body;

      if (!name || !provider || !apiKey) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }

      if (!['openai', 'claude', 'gemini'].includes(provider)) {
        return res.status(400).json({ success: false, error: 'Invalid provider' });
      }

      // Encrypt API key (simple encryption for demo - use proper encryption in production)
      const encryptedApiKey = Buffer.from(apiKey).toString('base64');

      const [newKey] = await db.insert(schema.aiApiKeys).values({
        userId,
        name,
        provider,
        apiKey: encryptedApiKey,
        isActive: true,
      }).returning();

      res.json({ success: true, data: newKey });
    } catch (error) {
      console.error('Error creating AI API key:', error);
      res.status(500).json({ success: false, error: 'Failed to create AI API key' });
    }
  });

  // Update AI API key
  app.patch('/api/ai-api-keys/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const keyId = parseInt(req.params.id);
      const { isActive } = req.body;

      if (isNaN(keyId)) {
        return res.status(400).json({ success: false, error: 'Invalid key ID' });
      }

      const [updatedKey] = await db.update(schema.aiApiKeys)
        .set({ isActive, updatedAt: new Date() })
        .where(sql`${schema.aiApiKeys.id} = ${keyId} AND ${schema.aiApiKeys.userId} = ${userId}`)
        .returning();

      if (!updatedKey) {
        return res.status(404).json({ success: false, error: 'API key not found' });
      }

      res.json({ success: true, data: updatedKey });
    } catch (error) {
      console.error('Error updating AI API key:', error);
      res.status(500).json({ success: false, error: 'Failed to update AI API key' });
    }
  });

  // Delete AI API key
  app.delete('/api/ai-api-keys/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const keyId = parseInt(req.params.id);

      if (isNaN(keyId)) {
        return res.status(400).json({ success: false, error: 'Invalid key ID' });
      }

      const [deletedKey] = await db.delete(schema.aiApiKeys)
        .where(sql`${schema.aiApiKeys.id} = ${keyId} AND ${schema.aiApiKeys.userId} = ${userId}`)
        .returning();

      if (!deletedKey) {
        return res.status(404).json({ success: false, error: 'API key not found' });
      }

      res.json({ success: true, data: deletedKey });
    } catch (error) {
      console.error('Error deleting AI API key:', error);
      res.status(500).json({ success: false, error: 'Failed to delete AI API key' });
    }
  });

  // ========== Social Media & Scheduling API ==========
  
  // Get user's social connections
  app.get('/api/social-connections', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const connections = await storage.getSocialConnections(userId);
      
      // Cập nhật thông tin kết nối WordPress nếu chưa có settings đầy đủ
      for (const connection of connections) {
        if (connection.platform === 'wordpress') {
          const settings = connection.settings || {};
          if (!settings.websiteUrl || !settings.username || !settings.appPassword) {
            console.log(`Cập nhật thông tin kết nối WordPress ID ${connection.id}`);
            await storage.updateSocialConnection(connection.id, {
              settings: {
                websiteUrl: 'https://astra.support247.top',
                username: 'admin',
                appPassword: 'eAcb w1Gx Hzxv t5Ps jPiQ xV6v',
                authType: 'app-password'
              },
              isActive: true
            });
          }
        }
      }
      
      // Lấy lại danh sách connections sau khi cập nhật
      const updatedConnections = await storage.getSocialConnections(userId);
      res.json({ success: true, data: updatedConnections });
    } catch (error) {
      console.error('Error fetching social connections:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch social connections' });
    }
  });

  // Add social connection
  app.post('/api/social-connections', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const { type, name, config, platform, accountName, accessToken, refreshToken, accountId, settings } = req.body;

      // Validation based on platform type
      if (!platform || !accountName) {
        return res.status(400).json({ 
          success: false, 
          error: 'Platform and account name are required' 
        });
      }

      // Non-WordPress platforms require accessToken and accountId
      if (platform !== 'wordpress' && (!accessToken || !accountId)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Access token and account ID are required for social media platforms' 
        });
      }

      // WordPress requires specific settings
      if (platform === 'wordpress') {
        if (!settings || !settings.websiteUrl || !settings.username) {
          return res.status(400).json({ 
            success: false, 
            error: 'Website URL and username are required for WordPress connections' 
          });
        }

        if (!settings.authType || (settings.authType === 'api-token' && !settings.apiToken) || 
            (settings.authType === 'application-password' && !settings.applicationPassword)) {
          return res.status(400).json({ 
            success: false, 
            error: 'Authentication type and corresponding credentials are required for WordPress' 
          });
        }
      }

      const connection = await storage.createSocialConnection({
        userId,
        platform: platform || type,
        accountName: accountName || name,
        accessToken: accessToken || '', 
        refreshToken: refreshToken || '',
        accountId: accountId || accountName || name,
        settings: settings || config || {}
      });

      res.json({ success: true, data: connection });
    } catch (error) {
      console.error('Error creating social connection:', error);
      res.status(500).json({ success: false, error: 'Failed to create social connection' });
    }
  });

  // Update social connection
  app.put('/api/social-connections/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const connectionId = parseInt(req.params.id);
      const userId = req.user.id;
      const { accountName, accessToken, refreshToken, isActive, settings } = req.body;

      // Verify connection belongs to user
      const connection = await storage.getSocialConnection(connectionId);
      if (!connection || connection.userId !== userId) {
        return res.status(404).json({ success: false, error: 'Connection not found' });
      }

      const updatedConnection = await storage.updateSocialConnection(connectionId, {
        accountName,
        accessToken,
        refreshToken,
        isActive,
        settings
      });

      res.json({ success: true, data: updatedConnection });
    } catch (error) {
      console.error('Error updating social connection:', error);
      res.status(500).json({ success: false, error: 'Failed to update social connection' });
    }
  });

  // Delete social connection
  app.delete('/api/social-connections/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const connectionId = parseInt(req.params.id);
      const userId = req.user.id;

      // Verify connection belongs to user
      const connection = await storage.getSocialConnection(connectionId);
      if (!connection || connection.userId !== userId) {
        return res.status(404).json({ success: false, error: 'Connection not found' });
      }

      // For Facebook connections, revoke the access token for security
      if (connection.platform === 'facebook' && connection.accessToken) {
        try {
          // Revoke access token on Facebook's side
          const revokeUrl = `https://graph.facebook.com/me/permissions?access_token=${connection.accessToken}`;
          await fetch(revokeUrl, { method: 'DELETE' });
          console.log('Facebook access token revoked for connection:', connectionId);
        } catch (error) {
          console.warn('Failed to revoke Facebook token:', error);
          // Continue with deletion even if revoke fails
        }
      }

      await storage.deleteSocialConnection(connectionId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting social connection:', error);
      res.status(500).json({ success: false, error: 'Failed to delete social connection' });
    }
  });

  // Test social connection
  app.post('/api/social-connections/:id/test', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const connectionId = parseInt(req.params.id);

      const connection = await storage.getSocialConnection(connectionId);
      if (!connection || connection.userId !== userId) {
        return res.status(404).json({ success: false, error: 'Connection not found' });
      }

      let testResult = { success: false, message: '' };

      if (connection.platform === 'wordpress') {
        // Test WordPress connection
        try {
          const settings = connection.settings as any;
          const baseUrl = settings.websiteUrl?.replace(/\/$/, '');
          const testUrl = `${baseUrl}/wp-json/wp/v2/posts?per_page=1`;
          
          // Debug logging
          console.log('Testing WordPress connection:', {
            baseUrl,
            username: settings.username,
            authType: settings.authType,
            hasAppPassword: !!settings.appPassword,
            hasApiToken: !!settings.apiToken
          });

          let authHeader = '';
          if (settings.authType === 'app-password') {
            // Clean app password - remove spaces and normalize
            const cleanAppPassword = settings.appPassword?.replace(/\s+/g, '');
            const credentials = Buffer.from(`${settings.username}:${cleanAppPassword}`).toString('base64');
            authHeader = `Basic ${credentials}`;
            console.log('DEBUG: WordPress Auth Details:');
            console.log('- Username:', settings.username);
            console.log('- App Password length:', cleanAppPassword?.length || 0);
            console.log('- App Password first 4 chars:', cleanAppPassword?.substring(0, 4) + '***');
            console.log('- Base64 credentials length:', credentials?.length || 0);
          } else if (settings.authType === 'api-token') {
            authHeader = `Bearer ${settings.apiToken}`;
            console.log('Using Bearer token auth');
          }

          if (!authHeader) {
            testResult = { 
              success: false, 
              message: 'Thiếu thông tin xác thực. Vui lòng kiểm tra username và application password.' 
            };
          } else {
            console.log('DEBUG: Making request to WordPress:');
            console.log('- URL:', testUrl);
            console.log('- Auth header type:', authHeader.split(' ')[0]);
            console.log('- Request headers:', {
              'Authorization': authHeader.substring(0, 20) + '***',
              'Content-Type': 'application/json',
              'User-Agent': 'SEO-Content-Generator/1.0'
            });

            const response = await fetch(testUrl, {
              method: 'GET',
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
                'User-Agent': 'SEO-Content-Generator/1.0'
              }
            });

            console.log('WordPress API response:', response.status, response.statusText);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            if (response.ok) {
              const data = await response.json();
              testResult = { 
                success: true, 
                message: `Kết nối WordPress thành công! Website: ${baseUrl}. Tìm thấy ${data.length || 0} bài viết.` 
              };
            } else {
              let errorText = '';
              try {
                const errorData = await response.json();
                errorText = errorData.message || errorData.code || 'Unknown error';
              } catch {
                errorText = await response.text();
              }
              
              testResult = { 
                success: false, 
                message: `Lỗi kết nối WordPress: ${response.status} ${response.statusText}. ${errorText}` 
              };
            }
          }
        } catch (error: any) {
          console.error('WordPress connection test error:', error);
          testResult = { 
            success: false, 
            message: `Lỗi kết nối WordPress: ${error.message}` 
          };
        }
      } else if (connection.platform === 'facebook') {
        // Test Facebook connection
        try {
          const accessToken = connection.accessToken;
          if (!accessToken) {
            testResult = { 
              success: false, 
              message: 'Không tìm thấy Access Token cho Facebook' 
            };
          } else {
            // Test Facebook Graph API
            const testUrl = `https://graph.facebook.com/me?access_token=${accessToken}`;
            const response = await fetch(testUrl);
            
            if (response.ok) {
              const data = await response.json();
              testResult = { 
                success: true, 
                message: `Kết nối Facebook thành công! Tài khoản: ${data.name || 'Unknown'}` 
              };
            } else {
              const errorData = await response.json();
              let errorMessage = errorData.error?.message || 'Token không hợp lệ';
              
              // Check if it's an expired token error
              if (errorMessage.includes('expired') || errorMessage.includes('Session has expired')) {
                errorMessage = 'Access Token đã hết hạn. Vui lòng tạo token mới từ Facebook Developer Console và cập nhật kết nối.';
              }
              
              testResult = { 
                success: false, 
                message: `Lỗi kết nối Facebook: ${errorMessage}` 
              };
            }
          }
        } catch (error: any) {
          testResult = { 
            success: false, 
            message: `Lỗi kết nối Facebook: ${error.message}` 
          };
        }
      } else if (connection.platform === 'linkedin') {
        // Test LinkedIn connection
        try {
          const accessToken = connection.accessToken;
          if (!accessToken) {
            testResult = { 
              success: false, 
              message: 'Không tìm thấy Access Token cho LinkedIn' 
            };
          } else {
            // Test LinkedIn API
            const testUrl = 'https://api.linkedin.com/v2/me';
            const response = await fetch(testUrl, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              const name = `${data.localizedFirstName || ''} ${data.localizedLastName || ''}`.trim();
              testResult = { 
                success: true, 
                message: `Kết nối LinkedIn thành công! Tài khoản: ${name || 'Unknown'}` 
              };
            } else {
              const errorData = await response.json();
              testResult = { 
                success: false, 
                message: `Lỗi kết nối LinkedIn: ${errorData.message || 'Token không hợp lệ'}` 
              };
            }
          }
        } catch (error: any) {
          testResult = { 
            success: false, 
            message: `Lỗi kết nối LinkedIn: ${error.message}` 
          };
        }
      } else if (connection.platform === 'twitter') {
        // Test Twitter connection
        try {
          const accessToken = connection.accessToken;
          if (!accessToken) {
            testResult = { 
              success: false, 
              message: 'Không tìm thấy Access Token cho Twitter' 
            };
          } else {
            // Test Twitter API v2
            const testUrl = 'https://api.twitter.com/2/users/me';
            const response = await fetch(testUrl, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              testResult = { 
                success: true, 
                message: `Kết nối Twitter thành công! Tài khoản: @${data.data?.username || 'Unknown'}` 
              };
            } else {
              const errorData = await response.json();
              testResult = { 
                success: false, 
                message: `Lỗi kết nối Twitter: ${errorData.title || 'Token không hợp lệ'}` 
              };
            }
          }
        } catch (error: any) {
          testResult = { 
            success: false, 
            message: `Lỗi kết nối Twitter: ${error.message}` 
          };
        }
      } else if (connection.platform === 'instagram') {
        // Test Instagram connection (via Facebook Graph API)
        try {
          const accessToken = connection.accessToken;
          if (!accessToken) {
            testResult = { 
              success: false, 
              message: 'Không tìm thấy Access Token cho Instagram' 
            };
          } else {
            // First try Facebook Graph API (for Instagram Business)
            let testUrl = `https://graph.facebook.com/me?access_token=${accessToken}`;
            let response = await fetch(testUrl);
            
            if (response.ok) {
              const fbData = await response.json();
              
              // Try to get Instagram accounts connected to this Facebook account
              const igAccountsUrl = `https://graph.facebook.com/me/accounts?fields=instagram_business_account{id,username}&access_token=${accessToken}`;
              const igResponse = await fetch(igAccountsUrl);
              
              if (igResponse.ok) {
                const igData = await igResponse.json();
                const igAccounts = igData.data?.filter(page => page.instagram_business_account) || [];
                
                if (igAccounts.length > 0) {
                  const igAccount = igAccounts[0].instagram_business_account;
                  testResult = { 
                    success: true, 
                    message: `Kết nối Instagram Business thành công! Tài khoản: @${igAccount.username || 'Unknown'} (qua Facebook: ${fbData.name})` 
                  };
                } else {
                  testResult = { 
                    success: true, 
                    message: `Token Facebook hợp lệ nhưng không tìm thấy Instagram Business account được kết nối. Đảm bảo Instagram Business đã được liên kết với Facebook Page.` 
                  };
                }
              } else {
                testResult = { 
                  success: true, 
                  message: `Token Facebook hợp lệ (${fbData.name}) nhưng không thể truy cập Instagram accounts. Kiểm tra quyền instagram_basic.` 
                };
              }
            } else {
              // If Facebook API fails, try Instagram Basic Display API
              testUrl = `https://graph.instagram.com/me?fields=id,username,account_type&access_token=${accessToken}`;
              response = await fetch(testUrl);
              
              if (response.ok) {
                const data = await response.json();
                const accountType = data.account_type || 'PERSONAL';
                testResult = { 
                  success: true, 
                  message: `Kết nối Instagram ${accountType} thành công! Tài khoản: @${data.username || 'Unknown'}${accountType === 'PERSONAL' ? ' (Lưu ý: Chỉ Business account mới có thể đăng bài qua API)' : ''}` 
                };
              } else {
                const errorData = await response.json();
                
                // Provide specific guidance based on error type
                let errorMessage = errorData.error?.message || 'Token không hợp lệ';
                if (errorMessage.includes('OAuth')) {
                  errorMessage = 'Access Token không hợp lệ. Vui lòng tạo token mới từ Facebook Developer Console với quyền instagram_basic và pages_show_list.';
                } else if (errorMessage.includes('expired')) {
                  errorMessage = 'Access Token đã hết hạn. Tokens Instagram thường có thời hạn 60 ngày, vui lòng tạo token mới.';
                }
                
                testResult = { 
                  success: false, 
                  message: `Lỗi kết nối Instagram: ${errorMessage}` 
                };
              }
            }
          }
        } catch (error: any) {
          testResult = { 
            success: false, 
            message: `Lỗi kết nối Instagram: ${error.message}` 
          };
        }
      } else {
        // Unsupported platform
        testResult = { 
          success: false, 
          message: `Test kết nối cho ${connection.platform} chưa được hỗ trợ` 
        };
      }

      res.json({
        success: testResult.success,
        message: testResult.message
      });

    } catch (error: any) {
      console.error('Error testing social connection:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Lỗi khi test kết nối: ' + (error?.message || 'Unknown error')
      });
    }
  });

  // Publish post immediately to social media
  app.post('/api/social/publish-now', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const { platform, content, imageUrls, connectionId, articleId } = req.body;
      const userId = req.user.id;

      if (!platform || !content || !connectionId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Platform, content, and connection ID are required' 
        });
      }

      // Get images from original article if articleId exists
      let finalImageUrls = Array.isArray(imageUrls) ? imageUrls : [];
      
      if (articleId && finalImageUrls.length === 0) {
        try {
          console.log(`Lấy hình ảnh từ bài viết articleId: ${articleId} cho Đăng ngay`);
          // Get images directly from images table
          const articleImages = await db.query.images.findMany({
            where: eq(schema.images.articleId, articleId),
            orderBy: (images, { desc }) => [desc(images.createdAt)]
          });
          
          if (articleImages && articleImages.length > 0) {
            finalImageUrls = articleImages.map(img => img.imageUrl);
            console.log(`Tìm thấy ${finalImageUrls.length} hình ảnh từ bài viết:`, finalImageUrls);
          }
        } catch (error) {
          console.error('Error fetching article images for publish-now:', error);
        }
      }

      // Get the social connection
      const connection = await storage.getSocialConnection(connectionId, userId);
      if (!connection) {
        return res.status(404).json({ 
          success: false, 
          error: 'Social connection not found' 
        });
      }

      if (!connection.isActive) {
        return res.status(400).json({ 
          success: false, 
          error: 'Social connection is not active' 
        });
      }

      let publishResult;

      if (platform === 'wordpress') {
        // WordPress publishing
        const settings = connection.settings as any;
        if (!settings?.websiteUrl || !settings?.username || !settings?.appPassword) {
          return res.status(400).json({ 
            success: false, 
            error: 'WordPress connection not properly configured' 
          });
        }

        try {
          const wpApiUrl = `${settings.websiteUrl.replace(/\/$/, '')}/wp-json/wp/v2/posts`;
          const auth = Buffer.from(`${settings.username}:${settings.appPassword}`).toString('base64');
          
          const postData = {
            title: `Social Media Post - ${new Date().toLocaleDateString('vi-VN')}`,
            content: content,
            status: 'publish'
          };

          const response = await fetch(wpApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Basic ${auth}`
            },
            body: JSON.stringify(postData)
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`WordPress API error: ${response.status} - ${errorText}`);
          }

          const result = await response.json();
          publishResult = {
            success: true,
            url: result.link,
            postId: result.id
          };

        } catch (error: any) {
          throw new Error(`WordPress publishing failed: ${error.message}`);
        }

      } else if (platform === 'facebook') {
        // Facebook publishing
        try {
          const accessToken = connection.accessToken;
          if (!accessToken) {
            throw new Error('Facebook Access Token không được tìm thấy trong kết nối');
          }

          // Check if token is expired
          if (connection.expiresAt && new Date() > new Date(connection.expiresAt)) {
            throw new Error('Facebook Access Token đã hết hạn. Vui lòng vào "Kết nối mạng xã hội" để kết nối lại Facebook.');
          }

          // Get Facebook user/page info first
          const meResponse = await fetch(`https://graph.facebook.com/me?access_token=${accessToken}`);
          if (!meResponse.ok) {
            const errorData = await meResponse.json();
            throw new Error(`Facebook authentication failed: ${errorData.error?.message || 'Invalid token'}`);
          }

          const userData = await meResponse.json();
          const images = finalImageUrls;
          console.log(`Facebook publish-now: Sử dụng ${images.length} hình ảnh`, images);
          
          if (images.length > 0) {
            // Upload photo to Facebook
            const imageUrl = images[0];
            
            try {
              // Upload the photo to Facebook
              const uploadData = new FormData();
              
              // Fetch the image and upload it
              const imageResponse = await fetch(imageUrl);
              if (!imageResponse.ok) {
                throw new Error('Failed to fetch image from URL');
              }
              
              const imageBuffer = await imageResponse.arrayBuffer();
              const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' });
              
              uploadData.append('source', imageBlob);
              uploadData.append('message', htmlToPlainText(content));
              uploadData.append('access_token', accessToken);

              const photoResponse = await fetch(`https://graph.facebook.com/${userData.id}/photos`, {
                method: 'POST',
                body: uploadData
              });

              if (!photoResponse.ok) {
                const errorData = await photoResponse.json();
                throw new Error(`Facebook photo upload failed: ${errorData.error?.message || 'Unknown error'}`);
              }

              const photoResult = await photoResponse.json();
              publishResult = {
                success: true,
                postId: photoResult.id,
                url: `https://facebook.com/${photoResult.post_id || photoResult.id}`,
                message: 'Đăng Facebook thành công với hình ảnh'
              };
              
            } catch (photoError: any) {
              console.error('Photo upload failed, trying link post:', photoError);
              
              // Fallback: post with image URL
              const postData = {
                message: htmlToPlainText(content),
                link: imageUrl,
                access_token: accessToken
              };

              const response = await fetch(`https://graph.facebook.com/${userData.id}/feed`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(postData)
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Facebook post failed: ${errorData.error?.message || 'Unknown error'}`);
              }

              const result = await response.json();
              publishResult = {
                success: true,
                postId: result.id,
                url: `https://facebook.com/${result.id}`,
                message: 'Đăng Facebook thành công với link hình ảnh'
              };
            }
            
          } else {
            // Text-only post
            const postData = {
              message: htmlToPlainText(content),
              access_token: accessToken
            };

            const response = await fetch(`https://graph.facebook.com/${userData.id}/feed`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(postData)
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(`Facebook post failed: ${errorData.error?.message || 'Unknown error'}`);
            }

            const result = await response.json();
            publishResult = {
              success: true,
              postId: result.id,
              url: `https://facebook.com/${result.id}`,
              message: 'Đăng Facebook thành công'
            };
          }

        } catch (error: any) {
          throw new Error(`Lỗi đăng Facebook: ${error.message}`);
        }

      } else if (platform === 'instagram') {
        // Instagram publishing
        try {
          const accessToken = connection.accessToken;
          if (!accessToken) {
            throw new Error('Instagram Access Token không được tìm thấy trong kết nối');
          }

          // First get Instagram account info
          const accountInfoUrl = `https://graph.instagram.com/me?fields=id,username,account_type&access_token=${accessToken}`;
          const accountResponse = await fetch(accountInfoUrl);
          
          if (!accountResponse.ok) {
            const errorData = await accountResponse.json();
            throw new Error(`Instagram account verification failed: ${errorData.error?.message || 'Token không hợp lệ'}`);
          }
          
          const accountData = await accountResponse.json();
          console.log('Instagram account data:', accountData);
          
          // Check if we have images to post
          const images = finalImageUrls;
          if (images.length === 0) {
            throw new Error('Instagram yêu cầu ít nhất một hình ảnh để đăng bài');
          }

          // Check account type
          if (accountData.account_type !== 'BUSINESS') {
            throw new Error('Instagram cá nhân không hỗ trợ đăng bài qua API. Vui lòng sử dụng Instagram Business account.');
          }

          // Instagram Business API flow
          const imageUrl = images[0]; // Use first image
          
          // Step 1: Create media container
          const containerData = {
            image_url: imageUrl,
            caption: content,
            access_token: accessToken
          };
          
          const containerResponse = await fetch(`https://graph.facebook.com/v18.0/${accountData.id}/media`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(containerData)
          });
          
          if (!containerResponse.ok) {
            const errorData = await containerResponse.json();
            throw new Error(`Instagram container creation failed: ${errorData.error?.message || 'Unknown error'}`);
          }
          
          const containerResult = await containerResponse.json();
          const containerId = containerResult.id;
          
          // Step 2: Publish the container
          const publishData = {
            creation_id: containerId,
            access_token: accessToken
          };
          
          const publishResponse = await fetch(`https://graph.facebook.com/v18.0/${accountData.id}/media_publish`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(publishData)
          });
          
          if (!publishResponse.ok) {
            const errorData = await publishResponse.json();
            throw new Error(`Instagram publish failed: ${errorData.error?.message || 'Unknown error'}`);
          }
          
          const publishResponseData = await publishResponse.json();
          
          publishResult = {
            success: true,
            postId: publishResponseData.id,
            url: `https://instagram.com/p/${publishResponseData.id}`,
            message: 'Đăng Instagram thành công'
          };

        } catch (error: any) {
          throw new Error(`Lỗi đăng Instagram: ${error.message}`);
        }

      } else {
        // For other platforms not yet implemented
        throw new Error(`Platform ${platform} chưa được hỗ trợ`);
      }

      // Log the publishing action
      await storage.createPublishingLog({
        userId,
        connectionId,
        platform,
        content,
        imageUrls: imageUrls || [],
        status: 'published',
        publishedAt: new Date(),
        result: publishResult
      });

      res.json({ 
        success: true, 
        data: publishResult 
      });

    } catch (error: any) {
      console.error('Error publishing post:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to publish post' 
      });
    }
  });



  // Get user's scheduled posts
  app.get('/api/scheduled-posts', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const page = parseInt(req.query.page as string || '1');
      const limit = parseInt(req.query.limit as string || '10');
      const status = req.query.status as string;

      const { posts, total } = await storage.getScheduledPosts(userId, { page, limit, status });
      res.json({ 
        success: true, 
        data: {
          posts,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch scheduled posts' });
    }
  });

  // Create scheduled post
  app.post('/api/scheduled-posts', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const { 
        articleId, 
        connectionId,
        title, 
        content, 
        scheduledTime,
        imageUrls
      } = req.body;

      if (!title || !content || !connectionId || !scheduledTime) {
        return res.status(400).json({ 
          success: false, 
          error: 'Title, content, connection ID, and scheduled time are required' 
        });
      }

      // Validate scheduled time is in the future
      const scheduledDate = new Date(scheduledTime);
      if (scheduledDate <= new Date()) {
        return res.status(400).json({ 
          success: false, 
          error: 'Scheduled time must be in the future' 
        });
      }

      // Get connection information
      const connection = await storage.getSocialConnection(connectionId);
      if (!connection || connection.userId !== userId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid connection ID' 
        });
      }

      const scheduledPost = await storage.createScheduledPost({
        userId,
        articleId: articleId || null,
        title,
        content,
        featuredImage: imageUrls && imageUrls.length > 0 ? imageUrls[0] : null,
        platforms: [{
          platform: connection.platform,
          connectionId: connectionId,
          accountName: connection.accountName,
          imageUrls: imageUrls || []
        }],
        scheduledTime: scheduledDate,
        status: 'pending'
      });

      res.json({ success: true, data: scheduledPost });
    } catch (error) {
      console.error('Error creating scheduled post:', error);
      res.status(500).json({ success: false, error: 'Failed to create scheduled post' });
    }
  });

  // Update scheduled post
  app.patch('/api/scheduled-posts/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const postId = parseInt(req.params.id);
      const userId = req.user.id;
      const { title, content, excerpt, featuredImage, platforms, scheduledTime } = req.body;

      // Verify post belongs to user
      const post = await storage.getScheduledPost(postId);
      if (!post || post.userId !== userId) {
        return res.status(404).json({ success: false, error: 'Scheduled post not found' });
      }

      // Don't allow editing posts that are processing or completed
      if (['processing', 'completed'].includes(post.status)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Cannot edit posts that are processing or completed' 
        });
      }

      const updatedPost = await storage.updateScheduledPost(postId, {
        title,
        content,
        excerpt,
        featuredImage,
        platforms,
        scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined
      });

      res.json({ success: true, data: updatedPost });
    } catch (error) {
      console.error('Error updating scheduled post:', error);
      res.status(500).json({ success: false, error: 'Failed to update scheduled post' });
    }
  });

  // Cancel scheduled post
  app.patch('/api/scheduled-posts/:id/cancel', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const postId = parseInt(req.params.id);
      const userId = req.user.id;

      // Verify post belongs to user
      const post = await storage.getScheduledPost(postId);
      if (!post || post.userId !== userId) {
        return res.status(404).json({ success: false, error: 'Scheduled post not found' });
      }

      // Only allow cancelling pending posts
      if (post.status !== 'pending') {
        return res.status(400).json({ 
          success: false, 
          error: 'Can only cancel pending posts' 
        });
      }

      const cancelledPost = await storage.updateScheduledPost(postId, {
        status: 'cancelled'
      });

      res.json({ success: true, data: cancelledPost });
    } catch (error) {
      console.error('Error cancelling scheduled post:', error);
      res.status(500).json({ success: false, error: 'Failed to cancel scheduled post' });
    }
  });

  // Delete scheduled post
  app.delete('/api/scheduled-posts/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const postId = parseInt(req.params.id);
      const userId = req.user.id;

      // Verify post belongs to user
      const post = await storage.getScheduledPost(postId);
      if (!post || post.userId !== userId) {
        return res.status(404).json({ success: false, error: 'Scheduled post not found' });
      }

      await storage.deleteScheduledPost(postId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting scheduled post:', error);
      res.status(500).json({ success: false, error: 'Failed to delete scheduled post' });
    }
  });

  // Get publishing logs for a scheduled post
  app.get('/api/scheduled-posts/:id/logs', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const postId = parseInt(req.params.id);
      const logs = await storage.getPublishingLogs(postId);
      
      res.json({ success: true, data: logs });
    } catch (error) {
      console.error('Error fetching publishing logs:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch logs' });
    }
  });

  // Publish post immediately
  app.post('/api/scheduled-posts/:id/publish-now', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const postId = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Get the scheduled post
      const post = await storage.getScheduledPost(postId);
      
      if (!post || post.userId !== userId) {
        return res.status(404).json({ success: false, error: 'Bài đăng không tìm thấy' });
      }

      // Import scheduler and publish immediately
      const { PostScheduler } = await import('./scheduler');
      const scheduler = new PostScheduler();
      
      // Process the post immediately
      const jobData = {
        ...post,
        platforms: Array.isArray(post.platforms) ? post.platforms : []
      };
      await scheduler.processPost(jobData as any);
      
      // Return result
      res.json({ 
        success: true, 
        message: 'Đã thử đăng bài ngay lập tức. Kiểm tra logs để xem kết quả.' 
      });
      
    } catch (error: any) {
      console.error('Error publishing post immediately:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Lỗi khi đăng bài ngay lập tức: ' + (error?.message || 'Unknown error') 
      });
    }
  });

  // Get post templates
  app.get('/api/post-templates', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const platform = req.query.platform as string;

      const templates = await storage.getPostTemplates(userId, platform);
      res.json({ success: true, data: templates });
    } catch (error) {
      console.error('Error fetching post templates:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch post templates' });
    }
  });

  // Create post template
  app.post('/api/post-templates', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const { name, description, platform, template, isDefault } = req.body;

      if (!name || !platform || !template) {
        return res.status(400).json({ 
          success: false, 
          error: 'Name, platform, and template are required' 
        });
      }

      const postTemplate = await storage.createPostTemplate({
        userId,
        name,
        description,
        platform,
        template,
        isDefault: isDefault || false
      });

      res.json({ success: true, data: postTemplate });
    } catch (error) {
      console.error('Error creating post template:', error);
      res.status(500).json({ success: false, error: 'Failed to create post template' });
    }
  });

  // ========== REFERRAL SYSTEM API ENDPOINTS ==========
  
  // Get user's referral information
  app.get('/api/dashboard/referral', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Get or generate referral code
      let referralInfo = await storage.getUserReferralInfo(userId);
      
      if (!referralInfo) {
        // Generate referral code if user doesn't have one
        const code = await storage.generateReferralCode(userId);
        referralInfo = {
          code,
          totalReferrals: 0,
          totalCreditsEarned: 0
        };
      }
      
      // Get referral settings
      const settings = await storage.getReferralSettings();
      
      res.json({
        success: true,
        data: {
          ...referralInfo,
          referralLink: `${req.protocol}://${req.get('host')}/register?ref=${referralInfo.code}`,
          settings: {
            referrerReward: settings.referrerReward,
            referredReward: settings.referredReward,
            enabled: settings.enabled
          }
        }
      });
    } catch (error) {
      console.error('Error fetching referral info:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch referral information' });
    }
  });

  // Get referral transactions history
  app.get('/api/dashboard/referral/transactions', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await storage.getReferralTransactions(userId, page, limit);
      
      res.json({
        success: true,
        data: result.transactions,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching referral transactions:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch referral transactions' });
    }
  });

  // Validate referral code (public endpoint)
  app.get('/api/referral/validate/:code', async (req, res) => {
    try {
      const { code } = req.params;
      
      if (!code) {
        return res.status(400).json({ success: false, error: 'Referral code is required' });
      }
      
      const referrer = await storage.validateReferralCode(code);
      
      if (!referrer) {
        return res.status(404).json({ success: false, error: 'Invalid referral code' });
      }
      
      const settings = await storage.getReferralSettings();
      
      if (!settings.enabled) {
        return res.status(400).json({ success: false, error: 'Referral system is currently disabled' });
      }
      
      res.json({
        success: true,
        data: {
          referrerUsername: referrer.username,
          referredReward: settings.referredReward,
          valid: true
        }
      });
    } catch (error) {
      console.error('Error validating referral code:', error);
      res.status(500).json({ success: false, error: 'Failed to validate referral code' });
    }
  });

  // Process referral (called during user registration)
  app.post('/api/referral/process', async (req, res) => {
    try {
      const { referralCode, newUserId } = req.body;
      
      if (!referralCode || !newUserId) {
        return res.status(400).json({ success: false, error: 'Referral code and new user ID are required' });
      }
      
      // Validate referral code and get referrer
      const referrer = await storage.validateReferralCode(referralCode);
      
      if (!referrer) {
        return res.status(404).json({ success: false, error: 'Invalid referral code' });
      }
      
      // Process the referral (give credits to both users)
      const success = await storage.processReferral(referrer.userId, newUserId, referralCode);
      
      if (!success) {
        return res.status(500).json({ success: false, error: 'Failed to process referral' });
      }
      
      const settings = await storage.getReferralSettings();
      
      res.json({
        success: true,
        data: {
          referrerCredits: settings.referrerReward,
          referredCredits: settings.referredReward,
          message: 'Referral processed successfully'
        }
      });
    } catch (error) {
      console.error('Error processing referral:', error);
      res.status(500).json({ success: false, error: 'Failed to process referral' });
    }
  });

  // Admin: Get referral statistics
  app.get('/api/admin/referrals/stats', isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }
      
      // Get overall referral statistics
      const [totalReferrals] = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(schema.referralTransactions)
        .where(eq(schema.referralTransactions.status, 'completed'));
      
      const [totalCreditsAwarded] = await db
        .select({ 
          total: sql`sum(${schema.referralTransactions.referrerCredits} + ${schema.referralTransactions.referredCredits})`.mapWith(Number) 
        })
        .from(schema.referralTransactions)
        .where(eq(schema.referralTransactions.status, 'completed'));
      
      const [activeReferrers] = await db
        .select({ count: sql`count(distinct ${schema.referralTransactions.referrerId})`.mapWith(Number) })
        .from(schema.referralTransactions)
        .where(eq(schema.referralTransactions.status, 'completed'));
      
      // Get top referrers
      const topReferrers = await db
        .select({
          userId: schema.referrals.userId,
          username: schema.users.username,
          totalReferrals: schema.referrals.totalReferrals,
          totalCreditsEarned: schema.referrals.totalCreditsEarned
        })
        .from(schema.referrals)
        .leftJoin(schema.users, eq(schema.referrals.userId, schema.users.id))
        .orderBy(desc(schema.referrals.totalReferrals))
        .limit(10);
      
      res.json({
        success: true,
        data: {
          totalReferrals: totalReferrals.count,
          totalCreditsAwarded: totalCreditsAwarded.total || 0,
          activeReferrers: activeReferrers.count,
          topReferrers
        }
      });
    } catch (error) {
      console.error('Error fetching referral stats:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch referral statistics' });
    }
  });

  // Admin: Update referral settings
  app.patch('/api/admin/referrals/settings', isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }
      
      const { referrerReward, referredReward, enabled } = req.body;
      
      const updates = [];
      
      if (referrerReward !== undefined) {
        updates.push(storage.setSetting('referrer_credit_reward', String(referrerReward), 'referral'));
      }
      
      if (referredReward !== undefined) {
        updates.push(storage.setSetting('referred_credit_reward', String(referredReward), 'referral'));
      }
      
      if (enabled !== undefined) {
        updates.push(storage.setSetting('referral_system_enabled', String(enabled), 'referral'));
      }
      
      await Promise.all(updates);
      
      res.json({
        success: true,
        data: { message: 'Referral settings updated successfully' }
      });
    } catch (error) {
      console.error('Error updating referral settings:', error);
      res.status(500).json({ success: false, error: 'Failed to update referral settings' });
    }
  });

  // ========== Referral Settings API (Admin Only) ==========
  
  // Get referral settings
  app.get('/api/admin/referral-settings', async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }

      // Get referral settings from system_settings table
      const referralSettings = await storage.getSettingsByCategory('referral');
      
      // Parse the settings into the expected format
      const settings = {
        referrer_credit_reward: parseInt(referralSettings.referrer_credit_reward || '50'),
        referred_credit_reward: parseInt(referralSettings.referred_credit_reward || '20'),
        referral_system_enabled: referralSettings.referral_system_enabled === 'true'
      };

      res.json({ success: true, data: settings });
    } catch (error) {
      console.error('Error fetching referral settings:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch referral settings' });
    }
  });

  // Update referral settings
  app.put('/api/admin/referral-settings', async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }

      const { referrer_credit_reward, referred_credit_reward, referral_system_enabled } = req.body;

      // Validate input
      if (typeof referrer_credit_reward !== 'number' || referrer_credit_reward < 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'referrer_credit_reward must be a non-negative number' 
        });
      }

      if (typeof referred_credit_reward !== 'number' || referred_credit_reward < 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'referred_credit_reward must be a non-negative number' 
        });
      }

      if (typeof referral_system_enabled !== 'boolean') {
        return res.status(400).json({ 
          success: false, 
          error: 'referral_system_enabled must be a boolean' 
        });
      }

      // Update settings in the database
      await storage.setSetting('referrer_credit_reward', referrer_credit_reward.toString(), 'referral');
      await storage.setSetting('referred_credit_reward', referred_credit_reward.toString(), 'referral');
      await storage.setSetting('referral_system_enabled', referral_system_enabled.toString(), 'referral');

      console.log('Referral settings updated by admin:', {
        referrer_credit_reward,
        referred_credit_reward,
        referral_system_enabled,
        adminId: req.user.id
      });

      res.json({ 
        success: true, 
        data: {
          referrer_credit_reward,
          referred_credit_reward,
          referral_system_enabled
        },
        message: 'Referral settings updated successfully'
      });
    } catch (error) {
      console.error('Error updating referral settings:', error);
      res.status(500).json({ success: false, error: 'Failed to update referral settings' });
    }
  });

  // ========== ZALO OAUTH ENDPOINTS ==========
  // Helper function to generate random string (like PHP randomString)
  function randomString(length = 32) {
    const crypto = require('crypto');
    return crypto.randomBytes(length / 2).toString('hex');
  }

  // Test endpoint
  app.get('/api/zalo-oauth/test', (req, res) => {
    console.log('Zalo OAuth test endpoint called');
    res.json({ 
      success: true, 
      message: 'Zalo OAuth endpoints working!',
      timestamp: new Date().toISOString()
    });
  });

  // Login endpoint - starts OAuth flow (based on login.php)  
  app.get('/api/auth/zalo/login', async (req, res) => {
    console.log('=== ZALO OAUTH LOGIN START ===');
    
    try {
      const settings = await storage.getSettingsByCategory('zalo_oauth');
      
      if (!settings.zaloAppId || !settings.zaloAppSecret) {
        return res.status(400).json({
          success: false,
          error: 'Zalo OAuth chưa được cấu hình trong admin panel'
        });
      }
      
      if (settings.enableZaloOAuth !== 'true') {
        return res.status(400).json({
          success: false,
          error: 'Tính năng đăng nhập Zalo đang tạm khóa'
        });
      }
      
      // Generate PKCE parameters (like PHP code)
      const crypto = require('crypto');
      const codeVerifier = randomString(64); // 64 chars like PHP
      const codeChallenge = crypto.createHash('sha256')
        .update(codeVerifier)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      const state = randomString(16); // 16 chars like PHP
      
      // Store in session (PHP equivalent: $_SESSION)  
      if (req.session) {
        (req.session as any).zaloOAuth = {
          codeVerifier,
          state,
          timestamp: Date.now()
        };
      }
      
      // Build redirect URI based on environment
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://toolbox.vn' 
        : 'http://localhost:5000';
      const redirectUri = `${baseUrl}/api/auth/zalo/callback`;
      
      // Build Zalo authorization URL (exactly like PHP)
      const authUrl = new URL('https://oauth.zaloapp.com/v4/permission');
      authUrl.searchParams.set('app_id', settings.zaloAppId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('scope', 'phone'); // Request phone permission like PHP
      authUrl.searchParams.set('prompt', 'consent'); // Force consent like PHP
      
      console.log('Generated Zalo OAuth URL:', authUrl.toString());
      console.log('Code verifier stored in session:', codeVerifier.substring(0, 10) + '...');
      
      // Redirect to Zalo (like PHP header("Location: $auth_url"))
      res.redirect(authUrl.toString());
      
    } catch (error) {
      console.error('Zalo OAuth login error:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi khởi tạo đăng nhập Zalo. Vui lòng thử lại.'
      });
    }
  });

  // Callback endpoint (based on callback.php)
  app.get('/api/auth/zalo/callback', async (req, res) => {
    console.log('=== ZALO OAUTH CALLBACK ===');
    console.log('Query parameters:', req.query);
    console.log('Session data:', req.session?.zaloOAuth);
    
    try {
      const { code, state } = req.query;
      
      // Validate required parameters
      if (!code || !state) {
        console.log('Missing required parameters');
        return res.send(createErrorPage('Thiếu thông tin xác thực từ Zalo'));
      }
      
      // Verify state parameter (CSRF protection like PHP)
      const sessionData = (req.session as any)?.zaloOAuth;
      if (!sessionData || sessionData.state !== state) {
        console.log('Invalid state parameter');
        return res.send(createErrorPage('Phiên đăng nhập không hợp lệ hoặc đã hết hạn'));
      }
      
      // Get Zalo settings
      const settings = await storage.getSettingsByCategory('zalo_oauth');
      
      // Exchange authorization code for access token (like PHP curl)
      console.log('Exchanging authorization code for access token...');
      
      const fetch = require('node-fetch');
      const tokenResponse = await fetch('https://oauth.zaloapp.com/v4/access_token', {
        method: 'POST',
        headers: {
          'secret_key': settings.zaloAppSecret,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          app_id: settings.zaloAppId,
          grant_type: 'authorization_code',
          code: code as string,
          code_verifier: sessionData.codeVerifier
        })
      });
      
      const tokenData = await tokenResponse.json();
      console.log('Token exchange response:', tokenData);
      
      if (!tokenData.access_token) {
        console.log('Failed to obtain access token:', tokenData);
        return res.send(createErrorPage('Không thể lấy thông tin xác thực từ Zalo'));
      }
      
      // Get user information from Zalo (including phone like PHP)
      console.log('Fetching user information from Zalo...');
      
      const fields = 'id,name,picture,phone'; // Same fields as PHP
      const userResponse = await fetch(`https://graph.zalo.me/v2.0/me?fields=${encodeURIComponent(fields)}`, {
        headers: {
          'access_token': tokenData.access_token
        }
      });
      
      const zaloUser = await userResponse.json();
      console.log('Zalo user information:', zaloUser);
      
      if (!zaloUser.id) {
        console.log('Failed to fetch user information:', zaloUser);
        return res.send(createErrorPage('Không thể lấy thông tin người dùng từ Zalo'));
      }
      
      // Clean up session data
      if (req.session) {
        delete (req.session as any).zaloOAuth;
      }
      
      // SUCCESS: Process user login/registration
      await processZaloLogin(zaloUser, req, res);
      
    } catch (error) {
      console.error('Zalo OAuth callback error:', error);
      return res.send(createErrorPage('Có lỗi xảy ra trong quá trình xử lý đăng nhập'));
    }
  });

  // Helper function to create error pages
  function createErrorPage(message: string) {
    return `<!DOCTYPE html>
      <html>
      <head>
        <title>Lỗi đăng nhập Zalo</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px;
            background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            color: white;
            min-height: 100vh;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container { 
            background: rgba(0,0,0,0.2); 
            padding: 40px; 
            border-radius: 20px; 
            max-width: 500px;
          }
          h1 { margin-bottom: 20px; font-size: 28px; }
          p { font-size: 16px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ Lỗi đăng nhập</h1>
          <p>${message}</p>
          <p style="opacity: 0.8; font-size: 14px;">Cửa sổ sẽ tự động đóng sau 3 giây...</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'ZALO_LOGIN_ERROR',
              message: '${message}'
            }, '*');
            setTimeout(() => window.close(), 3000);
          }
        </script>
      </body>
      </html>`;
  }

  // Process Zalo login/registration
  async function processZaloLogin(zaloUser: any, req: any, res: any) {
    try {
      console.log('Processing Zalo login for user:', zaloUser.id);
      
      // Check if user exists by zaloId
      const existingUser = await storage.getUserByZaloId(zaloUser.id);
      
      let user;
      if (existingUser) {
        // Update existing user info
        user = await storage.updateUserZaloInfo(existingUser.id, {
          zaloId: zaloUser.id,
          fullName: zaloUser.name || existingUser.fullName,
          avatar: zaloUser.picture?.data?.url || existingUser.avatar
        });
        console.log('Updated existing user:', user.id);
      } else {
        // Create new user account
        const username = `zalo_${zaloUser.id}`;
        user = await storage.createUser({
          username,
          email: null,
          password: null,
          fullName: zaloUser.name || 'Zalo User',
          zaloId: zaloUser.id,
          avatar: zaloUser.picture?.data?.url || null,
          isVerified: true, // Zalo users are considered verified
          credits: 50 // Default credits
        });
        console.log('Created new user:', user.id);
      }
      
      // Create user session (login)
      if (req.session) {
        (req.session as any).userId = user.id;
        (req.session as any).user = user;
      }
      
      // Success page
      res.send(createSuccessPage(zaloUser, user));
      
    } catch (error) {
      console.error('Error processing Zalo login:', error);
      res.send(createErrorPage('Lỗi hệ thống khi xử lý đăng nhập'));
    }
  }

  // Helper function to create success page
  function createSuccessPage(zaloUser: any, user: any) {
    return `<!DOCTYPE html>
      <html>
      <head>
        <title>Đăng nhập thành công</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px;
            background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
            color: white;
            min-height: 100vh;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container { 
            background: rgba(255,255,255,0.1); 
            padding: 40px; 
            border-radius: 20px; 
            max-width: 500px;
          }
          .user-info { 
            background: rgba(255,255,255,0.2); 
            padding: 20px; 
            border-radius: 10px; 
            margin: 20px 0; 
          }
          .avatar { 
            width: 80px; 
            height: 80px; 
            border-radius: 50%; 
            margin: 10px;
            border: 3px solid rgba(255,255,255,0.5);
          }
          h1 { margin-bottom: 20px; font-size: 28px; }
          p { margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ Đăng nhập Zalo thành công!</h1>
          <div class="user-info">
            ${zaloUser.picture?.data?.url ? `<img src="${zaloUser.picture.data.url}" alt="Avatar" class="avatar">` : ''}
            <p><strong>Tên:</strong> ${zaloUser.name || 'Chưa cung cấp'}</p>
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Zalo ID:</strong> ${zaloUser.id}</p>
            ${zaloUser.phone ? `<p><strong>Số điện thoại:</strong> ${zaloUser.phone}</p>` : '<p><strong>Số điện thoại:</strong> Người dùng không chia sẻ</p>'}
            <p><strong>Credits:</strong> ${user.credits}</p>
          </div>
          <p style="opacity: 0.8;">Đang chuyển hướng về trang chủ...</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'ZALO_LOGIN_SUCCESS',
              user: {
                id: ${user.id},
                username: '${user.username}',
                name: '${zaloUser.name || 'Zalo User'}',
                zaloId: '${zaloUser.id}',
                picture: '${zaloUser.picture?.data?.url || ''}',
                phone: '${zaloUser.phone || ''}'
              }
            }, '*');
            
            // Redirect parent window to dashboard
            setTimeout(() => {
              window.opener.location.href = '/dashboard';
              window.close();
            }, 2000);
          } else {
            // Direct navigation
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 2000);
          }
        </script>
      </body>
      </html>`;
  }

  return httpServer;
}

import { Request, Response, Express } from "express";
import { storage } from "./storage";
import { pool, db } from "../db";
import { z } from "zod";
import { format, subHours, subDays } from "date-fns";
import * as schema from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import * as nodemailer from "nodemailer";

/**
 * Registers admin routes for admin panel functionality
 */
export function registerAdminRoutes(app: Express) {
  // FAQ Management Routes
  
  // Get all FAQs
  app.get("/api/admin/faqs", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Unauthorized. Only admin users can perform this action." 
      });
    }

    try {
      const faqs = await db.select().from(schema.faqs).orderBy(schema.faqs.order, schema.faqs.id);
      return res.status(200).json({
        success: true,
        data: faqs
      });
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  });

  // Create new FAQ
  app.post("/api/admin/faqs", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Unauthorized. Only admin users can perform this action." 
      });
    }

    try {
      const faqData = schema.insertFaqSchema.parse(req.body);
      const [newFaq] = await db.insert(schema.faqs).values(faqData).returning();
      return res.status(201).json({
        success: true,
        data: newFaq
      });
    } catch (error) {
      console.error("Error creating FAQ:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validation error",
          details: error.errors
        });
      }
      return res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  });

  // Update FAQ
  app.patch("/api/admin/faqs/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Unauthorized. Only admin users can perform this action." 
      });
    }

    try {
      const faqId = parseInt(req.params.id);
      if (isNaN(faqId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid FAQ ID"
        });
      }

      const updateData = req.body;
      const [updatedFaq] = await db
        .update(schema.faqs)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(schema.faqs.id, faqId))
        .returning();

      if (!updatedFaq) {
        return res.status(404).json({
          success: false,
          error: "FAQ not found"
        });
      }

      return res.status(200).json({
        success: true,
        data: updatedFaq
      });
    } catch (error) {
      console.error("Error updating FAQ:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  });

  // Delete FAQ
  app.delete("/api/admin/faqs/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Unauthorized. Only admin users can perform this action." 
      });
    }

    try {
      const faqId = parseInt(req.params.id);
      if (isNaN(faqId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid FAQ ID"
        });
      }

      const [deletedFaq] = await db
        .delete(schema.faqs)
        .where(eq(schema.faqs.id, faqId))
        .returning();

      if (!deletedFaq) {
        return res.status(404).json({
          success: false,
          error: "FAQ not found"
        });
      }

      return res.status(200).json({
        success: true,
        message: "FAQ deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  });

  // Lấy cấu hình gói dùng thử
  app.get("/api/admin/trial-plan", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Unauthorized. Only admin users can perform this action." 
      });
    }

    try {
      const trialPlanIdSetting = await storage.getSetting('trial_plan_id');
      if (!trialPlanIdSetting) {
        return res.status(404).json({
          success: false,
          error: "Trial plan configuration not found"
        });
      }

      const trialPlanId = parseInt(trialPlanIdSetting);
      const trialPlan = await storage.getPlan(trialPlanId);

      if (!trialPlan) {
        return res.status(404).json({
          success: false,
          error: "Trial plan not found"
        });
      }

      return res.status(200).json({
        success: true,
        data: trialPlan
      });
    } catch (error) {
      console.error("Error getting trial plan:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  });

  // Cập nhật cấu hình gói dùng thử
  app.patch("/api/admin/trial-plan", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Unauthorized. Only admin users can perform this action." 
      });
    }

    try {
      const { planId } = req.body;
      
      if (!planId || isNaN(parseInt(planId))) {
        return res.status(400).json({
          success: false,
          error: "Invalid plan ID"
        });
      }

      const plan = await storage.getPlan(parseInt(planId));
      if (!plan) {
        return res.status(404).json({
          success: false,
          error: "Plan not found"
        });
      }

      // Cập nhật cấu hình
      await storage.setSetting('trial_plan_id', planId.toString(), 'plans');

      return res.status(200).json({
        success: true,
        data: {
          message: "Trial plan configuration updated successfully",
          plan
        }
      });
    } catch (error) {
      console.error("Error updating trial plan configuration:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  });

  // ========== Credit Configuration API ==========
  // Get credit configuration
  app.get("/api/admin/credit-config", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Admin access required" 
      });
    }

    try {
      const setting = await storage.getSetting('credit_config');
      let config = null;
      
      if (setting) {
        try {
          config = JSON.parse(setting);
        } catch (parseError) {
          console.error('Error parsing credit config:', parseError);
          config = null;
        }
      }

      return res.status(200).json({
        success: true,
        data: { config }
      });
    } catch (error) {
      console.error("Error fetching credit configuration:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch credit configuration"
      });
    }
  });

  // Save credit configuration  
  app.post("/api/admin/credit-config", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Admin access required" 
      });
    }

    try {
      const { config } = req.body;
      
      if (!config) {
        return res.status(400).json({
          success: false,
          error: "Configuration is required"
        });
      }

      // Validate config structure
      const requiredFields = [
        'contentGeneration.short',
        'contentGeneration.medium', 
        'contentGeneration.long',
        'contentGeneration.extraLong',
        'imageGeneration.perImage',
        'aiModels.chatgpt',
        'aiModels.gemini',
        'aiModels.claude'
      ];

      for (const field of requiredFields) {
        const keys = field.split('.');
        let current = config;
        for (const key of keys) {
          if (!current || typeof current[key] === 'undefined') {
            return res.status(400).json({
              success: false,
              error: `Missing required field: ${field}`
            });
          }
          current = current[key];
        }
      }

      // Save configuration to system settings
      await storage.setSetting('credit_config', JSON.stringify(config), 'credit');

      return res.status(200).json({
        success: true,
        data: {
          message: "Credit configuration saved successfully",
          config
        }
      });
    } catch (error) {
      console.error("Error saving credit configuration:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to save credit configuration"
      });
    }
  });

  // Credit adjustment
  app.post("/api/admin/users/:id/credits", async (req: Request, res: Response) => {
    // Set proper headers
    res.setHeader('Content-Type', 'application/json');
    
    console.log("Credit adjustment request received:", {
      params: req.params,
      body: req.body,
      authenticated: req.isAuthenticated(),
      userRole: req.user?.role
    });

    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Unauthorized. Only admin users can perform this action." 
      });
    }

    try {
      const userId = parseInt(req.params.id);
      const { amount, description } = req.body;
      
      console.log("Processing credit adjustment:", { userId, amount, description });
      
      // Validate input
      if (typeof amount !== "number" || amount === 0) {
        return res.status(400).json({ 
          success: false, 
          error: "Invalid amount. Must be a non-zero number." 
        });
      }

      // Add or subtract credits
      let newBalance;
      if (amount > 0) {
        newBalance = await storage.addUserCredits(userId, amount, undefined, description || "Admin adjustment");
      } else {
        newBalance = await storage.subtractUserCredits(userId, Math.abs(amount), description || "Admin adjustment");
      }

      const response = { 
        success: true, 
        data: { 
          userId, 
          adjustmentAmount: amount,
          currentCredits: newBalance
        } 
      };
      
      console.log("Credit adjustment successful:", response);
      return res.status(200).json(response);
    } catch (error) {
      console.error("Error adjusting user credits:", error);
      const errorResponse = { 
        success: false, 
        error: "Failed to adjust user credits" 
      };
      return res.status(500).json(errorResponse);
    }
  });

  // Plan assignment
  app.post("/api/admin/users/:id/plans", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Unauthorized. Only admin users can perform this action." 
      });
    }

    try {
      const userId = parseInt(req.params.id);
      const { planId, duration } = req.body;
      
      // Validate input
      if (!planId || typeof planId !== "number") {
        return res.status(400).json({ 
          success: false, 
          error: "Invalid plan ID. Must provide a valid plan ID." 
        });
      }

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          error: "User not found" 
        });
      }

      // Check if plan exists
      const plan = await storage.getPlan(planId);
      if (!plan) {
        return res.status(404).json({ 
          success: false, 
          error: "Plan not found" 
        });
      }

      // Create user plan
      const userPlan = await storage.createUserPlan({
        userId,
        planId,
        startDate: new Date(),
        endDate: duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : undefined,
        isActive: true
      });

      // If it's a credit plan, add credits
      if (plan.type === "credit") {
        await storage.addUserCredits(userId, plan.value || plan.credits, planId, `Credits from plan: ${plan.name}`);
      }

      return res.status(200).json({ 
        success: true, 
        data: { 
          userPlan
        } 
      });
    } catch (error) {
      console.error("Error assigning plan to user:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to assign plan to user" 
      });
    }
  });

  // Get all plans (for admin only)
  app.get("/api/admin/plans", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Unauthorized. Only admin users can perform this action." 
      });
    }

    try {
      const plans = await storage.getPlans();
      return res.status(200).json({ 
        success: true, 
        data: plans 
      });
    } catch (error) {
      console.error("Error getting plans:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to get plans" 
      });
    }
  });
  
  // Create a new plan
  app.post("/api/admin/plans", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Unauthorized. Only admin users can perform this action." 
      });
    }

    try {
      const { name, description, type, price, value, duration } = req.body;
      
      // Basic validation
      if (!name || !type || price === undefined || value === undefined) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields. Name, type, price and value are required."
        });
      }
      
      // Create plan
      const plan = await storage.createPlan({
        name,
        description,
        type,
        price,
        credits: value, // Use value as credits
        value,
        duration
      });
      
      return res.status(201).json({
        success: true,
        data: plan
      });
    } catch (error) {
      console.error("Error creating plan:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to create plan"
      });
    }
  });
  
  // Update plan endpoint with different path to avoid Vite conflicts
  app.post("/admin-api/update-plan", async (req: Request, res: Response) => {
    // Ensure JSON response at the beginning
    res.setHeader('Content-Type', 'application/json');
    
    try {
      console.log("=== UPDATE PLAN REQUEST START ===");
      console.log("Request body:", req.body);
      console.log("User authenticated:", req.isAuthenticated());
      console.log("User role:", req.user?.role);
      
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        console.log("Authorization failed");
        return res.status(403).json({ 
          success: false, 
          error: "Unauthorized" 
        });
      }

      const { id, name, description, type, price, value } = req.body;
      const planId = parseInt(id);
      
      console.log("Parsed plan ID:", planId);
      console.log("Update data:", { name, description, type, price, value });
      
      // Direct database update using raw SQL
      const query = `
        UPDATE plans 
        SET name = $1, description = $2, type = $3, price = $4, credits = $5, updated_at = NOW()
        WHERE id = $6 
        RETURNING *
      `;
      
      console.log("Executing SQL query...");
      const result = await pool.query(query, [
        name, 
        description, 
        type, 
        String(price), 
        Number(value), 
        planId
      ]);
      
      console.log("SQL result:", result.rows);
      
      if (result.rows.length === 0) {
        console.log("No plan found with ID:", planId);
        return res.status(404).json({
          success: false,
          error: "Plan not found"
        });
      }
      
      const response = {
        success: true,
        data: result.rows[0]
      };
      
      console.log("Sending success response:", response);
      console.log("=== UPDATE PLAN REQUEST END ===");
      
      return res.status(200).json(response);
      
    } catch (error) {
      console.error("=== UPDATE PLAN ERROR ===");
      console.error("Error details:", error);
      console.error("Error stack:", error.stack);
      
      const errorResponse = {
        success: false,
        error: "Failed to update plan"
      };
      
      console.log("Sending error response:", errorResponse);
      return res.status(500).json(errorResponse);
    }
  });

  // Keep the old PATCH endpoint for backward compatibility
  app.patch("/api/admin/plans/:id", async (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.json({ 
          success: false, 
          error: "Unauthorized" 
        });
      }

      const planId = parseInt(req.params.id);
      const { name, description, type, price, value } = req.body;
      
      console.log("Updating plan:", planId, { name, description, type, price, value });
      
      // Direct database update using raw SQL to avoid any ORM issues
      const query = `
        UPDATE plans 
        SET name = $1, description = $2, type = $3, price = $4, credits = $5, updated_at = NOW()
        WHERE id = $6 
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        name, 
        description, 
        type, 
        String(price), 
        Number(value), 
        planId
      ]);
      
      if (result.rows.length === 0) {
        return res.json({
          success: false,
          error: "Plan not found"
        });
      }
      
      console.log("Plan updated successfully");
      
      return res.json({
        success: true,
        data: result.rows[0]
      });
      
    } catch (error) {
      console.error("Update plan error:", error);
      return res.json({
        success: false,
        error: "Failed to update plan"
      });
    }
  });
  
  // Delete a plan
  app.delete("/api/admin/plans/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Unauthorized. Only admin users can perform this action." 
      });
    }

    try {
      const planId = parseInt(req.params.id);
      
      // Check if plan exists
      const existingPlan = await storage.getPlan(planId);
      if (!existingPlan) {
        return res.status(404).json({
          success: false,
          error: "Plan not found"
        });
      }
      
      // Check if this is the trial plan
      const trialPlanIdSetting = await storage.getSetting('trial_plan_id');
      if (trialPlanIdSetting && parseInt(trialPlanIdSetting) === planId) {
        return res.status(400).json({
          success: false,
          error: "Cannot delete the plan that is currently set as the trial plan. Please change the trial plan first."
        });
      }
      
      // Delete plan
      await storage.deletePlan(planId);
      
      return res.status(200).json({
        success: true,
        data: {
          message: "Plan deleted successfully"
        }
      });
    } catch (error) {
      console.error("Error deleting plan:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to delete plan"
      });
    }
  });

  // Get performance metrics for admin dashboard
  app.get("/api/admin/performance", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Unauthorized. Only admin users can perform this action." 
      });
    }

    try {
      const timeRange = req.query.timeRange as string || "24h";
      
      // Create a simple response with static data
      const performanceData = {
        averageResponseTime: 145,
        p95ResponseTime: 210,
        p99ResponseTime: 350,
        totalRequests: 12500,
        requestsPerMinute: 35,
        errorRate: 1.2,
        cpuUsage: 45,
        memoryUsage: 62,
        diskUsage: 38,
        
        responseTimeHistory: Array(24).fill(0).map((_, i) => ({
          timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
          average: 100 + Math.floor(Math.random() * 100),
          p95: 150 + Math.floor(Math.random() * 100),
          p99: 200 + Math.floor(Math.random() * 150)
        })),
        
        requestsHistory: Array(24).fill(0).map((_, i) => ({
          timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
          total: 400 + Math.floor(Math.random() * 200),
          errors: 2 + Math.floor(Math.random() * 8)
        })),
        
        resourceUsageHistory: Array(24).fill(0).map((_, i) => ({
          timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
          cpu: 30 + Math.floor(Math.random() * 30),
          memory: 40 + Math.floor(Math.random() * 30),
          disk: 30 + Math.floor(Math.random() * 20)
        })),
        
        endpointPerformance: [
          {
            endpoint: "/api/content/generate",
            count: 324,
            averageTime: 180,
            errorRate: 0.5
          },
          {
            endpoint: "/api/auth",
            count: 1253,
            averageTime: 45,
            errorRate: 0.2
          },
          {
            endpoint: "/api/articles",
            count: 856,
            averageTime: 120,
            errorRate: 1.1
          },
          {
            endpoint: "/api/users",
            count: 231,
            averageTime: 90,
            errorRate: 0.4
          },
          {
            endpoint: "/api/webhooks",
            count: 176,
            averageTime: 320,
            errorRate: 4.2
          }
        ],
        
        timeRange: timeRange
      };

      return res.status(200).json({
        success: true,
        data: performanceData
      });
    } catch (error) {
      console.error("Error getting performance metrics:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to get performance metrics" 
      });
    }
  });

  // Translations management
  // Get all translations with pagination and filtering
  app.get("/api/admin/translations", async (req: Request, res: Response) => {
    // Disable HTTP caching completely
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('ETag', Math.random().toString());
    
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Unauthorized. Only admin users can perform this action." 
      });
    }

    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const category = req.query.category as string;
      const search = req.query.search as string;
      const offset = (page - 1) * limit;

      let query = `
        SELECT * FROM translations 
        WHERE 1=1
      `;
      let countQuery = `
        SELECT COUNT(*) as total FROM translations 
        WHERE 1=1
      `;
      const params: any[] = [];
      const countParams: any[] = [];

      if (category && category !== 'all') {
        query += ` AND category = $${params.length + 1}`;
        countQuery += ` AND category = $${countParams.length + 1}`;
        params.push(category);
        countParams.push(category);
      }

      if (search) {
        query += ` AND (key ILIKE $${params.length + 1} OR vi ILIKE $${params.length + 2} OR en ILIKE $${params.length + 3})`;
        countQuery += ` AND (key ILIKE $${countParams.length + 1} OR vi ILIKE $${countParams.length + 2} OR en ILIKE $${countParams.length + 3})`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
        countParams.push(searchPattern, searchPattern, searchPattern);
      }

      query += ` ORDER BY category, key LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const { rows: translations } = await pool.query(query, params);
      const { rows: countResult } = await pool.query(countQuery, countParams);
      const total = parseInt(countResult[0].total);

      return res.status(200).json({
        success: true,
        data: {
          translations,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          }
        }
      });
    } catch (error) {
      console.error("Error getting translations:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to get translations" 
      });
    }
  });

  // Add new translation
  app.post("/api/admin/translations", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Unauthorized. Only admin users can perform this action." 
      });
    }

    try {
      const { key, vi, en, category } = req.body;

      if (!key || !vi || !en || !category) {
        return res.status(400).json({
          success: false,
          error: "Key, Vietnamese text, English text, and category are required"
        });
      }

      const { rows } = await pool.query(
        `INSERT INTO translations (key, vi, en, category) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [key, vi, en, category]
      );

      return res.status(201).json({
        success: true,
        data: rows[0]
      });
    } catch (error: any) {
      console.error("Error adding translation:", error);
      if (error.constraint === 'translations_key_key') {
        return res.status(400).json({
          success: false,
          error: "Translation key already exists"
        });
      }
      return res.status(500).json({ 
        success: false, 
        error: "Failed to add translation" 
      });
    }
  });

  // Update translation
  app.patch("/api/admin/translations/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Unauthorized. Only admin users can perform this action." 
      });
    }

    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      const allowedFields = ['key', 'vi', 'en', 'category'];
      const updateFields = Object.keys(updates).filter(field => allowedFields.includes(field));
      
      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No valid fields to update"
        });
      }

      const setClause = updateFields.map((field, index) => `${field} = $${index + 1}`).join(', ');
      const values = updateFields.map(field => updates[field]);
      values.push(id);

      const { rows } = await pool.query(
        `UPDATE translations 
         SET ${setClause}, updated_at = NOW() 
         WHERE id = $${values.length} 
         RETURNING *`,
        values
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Translation not found"
        });
      }

      return res.status(200).json({
        success: true,
        data: rows[0]
      });
    } catch (error: any) {
      console.error("Error updating translation:", error);
      if (error.constraint === 'translations_key_key') {
        return res.status(400).json({
          success: false,
          error: "Translation key already exists"
        });
      }
      return res.status(500).json({ 
        success: false, 
        error: "Failed to update translation" 
      });
    }
  });

  // Delete translation
  app.delete("/api/admin/translations/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Unauthorized. Only admin users can perform this action." 
      });
    }

    try {
      const id = parseInt(req.params.id);

      const { rows } = await pool.query(
        `DELETE FROM translations WHERE id = $1 RETURNING *`,
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Translation not found"
        });
      }

      return res.status(200).json({
        success: true,
        message: "Translation deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting translation:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to delete translation" 
      });
    }
  });

  // ========== Sidebar Menu Management ==========
  // Get all sidebar menu items
  app.get("/api/admin/sidebar-menu", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Unauthorized. Only admin users can perform this action." 
      });
    }

    try {
      const menuItems = await db.select().from(schema.sidebarMenuItems).orderBy(schema.sidebarMenuItems.sortOrder);

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

  // Create new sidebar menu item
  app.post("/api/admin/sidebar-menu", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Unauthorized. Only admin users can perform this action." 
      });
    }

    try {
      const validatedData = schema.insertSidebarMenuItemSchema.parse(req.body);
      
      const [newMenuItem] = await db.insert(schema.sidebarMenuItems)
        .values(validatedData)
        .returning();

      return res.status(201).json({
        success: true,
        data: newMenuItem
      });
    } catch (error) {
      console.error("Error creating sidebar menu item:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to create sidebar menu item" 
      });
    }
  });

  // Update sidebar menu item
  app.patch("/api/admin/sidebar-menu/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Unauthorized. Only admin users can perform this action." 
      });
    }

    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;

      const [updatedMenuItem] = await db.update(schema.sidebarMenuItems)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(schema.sidebarMenuItems.id, id))
        .returning();

      if (!updatedMenuItem) {
        return res.status(404).json({
          success: false,
          error: "Sidebar menu item not found"
        });
      }

      return res.status(200).json({
        success: true,
        data: updatedMenuItem
      });
    } catch (error) {
      console.error("Error updating sidebar menu item:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to update sidebar menu item" 
      });
    }
  });

  // Delete sidebar menu item
  app.delete("/api/admin/sidebar-menu/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Unauthorized. Only admin users can perform this action." 
      });
    }

    try {
      const id = parseInt(req.params.id);

      const [deletedMenuItem] = await db.delete(schema.sidebarMenuItems)
        .where(eq(schema.sidebarMenuItems.id, id))
        .returning();

      if (!deletedMenuItem) {
        return res.status(404).json({
          success: false,
          error: "Sidebar menu item not found"
        });
      }

      return res.status(200).json({
        success: true,
        message: "Sidebar menu item deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting sidebar menu item:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to delete sidebar menu item" 
      });
    }
  });

  // Admin Email Settings API endpoints
  // Get email settings
  app.get("/api/admin/settings/email", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Admin access required" 
      });
    }

    try {
      const emailSettings = await storage.getSettingsByCategory('email');
      
      return res.status(200).json({
        success: true,
        data: {
          smtpServer: emailSettings.smtpServer || '',
          smtpPort: emailSettings.smtpPort || '587',
          smtpUsername: emailSettings.smtpUsername || '',
          smtpPassword: emailSettings.smtpPassword || '',
          emailSender: emailSettings.emailSender || '',
          appBaseUrl: emailSettings.appBaseUrl || ''
        }
      });
    } catch (error) {
      console.error("Error getting email settings:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to get email settings"
      });
    }
  });

  // Update email settings  
  app.patch("/api/admin/settings/email", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Admin access required" 
      });
    }

    try {
      const { 
        smtpServer, 
        smtpPort, 
        smtpUsername, 
        smtpPassword, 
        emailSender, 
        appBaseUrl 
      } = req.body;

      // Validate required fields
      if (!smtpServer || !smtpPort || !smtpUsername || !smtpPassword || !emailSender) {
        return res.status(400).json({
          success: false,
          error: "All email configuration fields are required"
        });
      }

      // Update email settings
      await storage.setSetting('smtpServer', smtpServer, 'email');
      await storage.setSetting('smtpPort', smtpPort.toString(), 'email');
      await storage.setSetting('smtpUsername', smtpUsername, 'email');
      await storage.setSetting('smtpPassword', smtpPassword, 'email');
      await storage.setSetting('emailSender', emailSender, 'email');
      if (appBaseUrl) {
        await storage.setSetting('appBaseUrl', appBaseUrl, 'email');
      }

      console.log('Email settings updated by admin:', {
        smtpServer,
        smtpPort,
        smtpUsername,
        emailSender,
        appBaseUrl,
        adminId: req.user.id
      });

      return res.status(200).json({
        success: true,
        message: "Email settings updated successfully"
      });
    } catch (error) {
      console.error("Error updating email settings:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to update email settings"
      });
    }
  });

  // Test email settings
  app.post("/api/admin/settings/email/test", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Admin access required" 
      });
    }

    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          error: "Test email address is required"
        });
      }

      // Get current email settings
      const smtpSettings = await storage.getSmtpSettings();
      
      if (!smtpSettings) {
        return res.status(400).json({
          success: false,
          error: "Email settings not configured"
        });
      }

      // Create nodemailer transporter and send test email
      
      const transporter = nodemailer.createTransport({
        host: smtpSettings.smtpServer,
        port: smtpSettings.smtpPort,
        secure: smtpSettings.smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpSettings.smtpUsername,
          pass: smtpSettings.smtpPassword,
        },
      });

      // Send test email (use SMTP username as sender for compatibility)
      const senderEmail = smtpSettings.emailSender || smtpSettings.smtpUsername;
      const info = await transporter.sendMail({
        from: smtpSettings.smtpUsername, // Use SMTP username to avoid SendAsDenied errors
        to: email,
        subject: 'Test Email từ SEO AI Writer',
        html: `
          <h2>Test Email thành công!</h2>
          <p>Cài đặt SMTP của bạn đã được cấu hình đúng.</p>
          <p><strong>Máy chủ SMTP:</strong> ${smtpSettings.smtpServer}</p>
          <p><strong>Cổng:</strong> ${smtpSettings.smtpPort}</p>
          <p><strong>Người gửi:</strong> ${smtpSettings.smtpUsername}</p>
          <p>Thời gian gửi: ${new Date().toLocaleString('vi-VN')}</p>
        `,
      });

      console.log('Test email sent successfully:', {
        messageId: info.messageId,
        to: email,
        smtpServer: smtpSettings.smtpServer
      });

      return res.status(200).json({
        success: true,
        message: `Email test đã được gửi thành công đến ${email}`,
        data: {
          messageId: info.messageId,
          accepted: info.accepted,
          rejected: info.rejected
        }
      });
    } catch (error: any) {
      console.error("Error testing email settings:", error);
      
      let errorMessage = "Failed to test email settings";
      if (error.code === 'ECONNREFUSED') {
        errorMessage = "Không thể kết nối đến SMTP server. Kiểm tra lại host và port.";
      } else if (error.code === 'EAUTH') {
        errorMessage = "Xác thực SMTP thất bại. Kiểm tra lại username và password.";
      } else if (error.code === 'ESOCKET') {
        errorMessage = "Lỗi kết nối socket. Kiểm tra lại cấu hình SMTP.";
      } else if (error.message && error.message.includes('SendAsDenied')) {
        errorMessage = "Lỗi Microsoft SMTP: Không được phép gửi email với địa chỉ khác tài khoản SMTP. Hệ thống đã tự động sử dụng địa chỉ SMTP làm sender.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return res.status(500).json({
        success: false,
        error: errorMessage,
        details: error.code || error.name || 'Unknown error'
      });
    }
  });

  // Get all users endpoint  
  app.get("/api/admin/users", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Admin access required" 
      });
    }

    try {
      const users = await storage.getAllUsers();
      return res.status(200).json({
        success: true,
        data: { users }
      });
    } catch (error) {
      console.error("Error getting users:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to get users"
      });
    }
  });

  // Update user endpoint
  app.patch("/api/admin/users/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Admin access required" 
      });
    }

    try {
      const userId = parseInt(req.params.id);
      const { username, email, fullName, role, credits } = req.body;

      const updatedUser = await storage.updateUser(userId, {
        username,
        email, 
        fullName,
        role,
        credits: credits ? Number(credits) : undefined
      });

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }

      return res.status(200).json({
        success: true,
        data: updatedUser
      });
    } catch (error) {
      console.error("Error updating user:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to update user"
      });
    }
  });

  // Delete user endpoint
  app.delete("/api/admin/users/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Admin access required" 
      });
    }

    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid user ID"
        });
      }

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }

      // Don't allow deleting admin users
      if (user.role === 'admin') {
        return res.status(400).json({
          success: false,
          error: "Cannot delete admin users"
        });
      }

      // Delete the user
      const deleted = await storage.deleteUser(userId);
      
      if (!deleted) {
        return res.status(400).json({
          success: false,
          error: "Failed to delete user"
        });
      }

      return res.status(200).json({
        success: true,
        message: "User deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  });

  // Get admin stats endpoint
  app.get("/api/admin/stats", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Admin access required" 
      });
    }

    try {
      const stats = await storage.getAdminStats();
      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error("Error getting admin stats:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to get admin stats"
      });
    }
  });

  // Get recent users
  app.get("/api/admin/recent-users", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Admin access required" 
      });
    }

    try {
      const { limit = 5 } = req.query;
      const users = await db
        .select({
          id: schema.users.id,
          username: schema.users.username,
          email: schema.users.email,
          fullName: schema.users.fullName,
          credits: schema.users.credits,
          createdAt: schema.users.createdAt
        })
        .from(schema.users)
        .orderBy(desc(schema.users.createdAt))
        .limit(parseInt(limit as string) || 5);

      return res.status(200).json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error("Error getting recent users:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to get recent users"
      });
    }
  });

  // Get recent transactions (credit usage history)
  app.get("/api/admin/recent-transactions", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Admin access required" 
      });
    }

    try {
      const { limit = 5 } = req.query;
      // Since creditHistory table doesn't exist, use articles and images to simulate transactions
      const articleTransactions = await db
        .select({
          id: schema.articles.id,
          userId: schema.articles.userId,
          username: schema.users.username,
          createdAt: schema.articles.createdAt
        })
        .from(schema.articles)
        .leftJoin(schema.users, eq(schema.articles.userId, schema.users.id))
        .orderBy(desc(schema.articles.createdAt))
        .limit(parseInt(limit as string) || 5);
      
      // Transform the result to match interface
      const transactions = articleTransactions.map(article => ({
        id: article.id,
        userId: article.userId,
        username: article.username || `User ${article.userId}`,
        amount: 10,
        type: 'article_creation',
        description: 'Article created',
        createdAt: article.createdAt
      }));

      return res.status(200).json({
        success: true,
        data: transactions
      });
    } catch (error) {
      console.error("Error getting recent transactions:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to get recent transactions"
      });
    }
  });

  // Get user distribution by plan
  app.get("/api/admin/user-plan-distribution", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Admin access required" 
      });
    }

    try {
      // Since user_plans table may be empty, show default distribution
      const totalUsersResult = await db.select({ count: sql<number>`count(*)` }).from(schema.users);
      const totalUsers = totalUsersResult[0]?.count || 0;
      
      // For now, show all users as "Free" since we don't have active plan assignments
      const distributionWithPercentage = [{
        name: "Free",
        count: totalUsers,
        percentage: 100
      }];

      return res.status(200).json({
        success: true,
        data: distributionWithPercentage
      });
    } catch (error) {
      console.error("Error getting plan distribution:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to get plan distribution"
      });
    }
  });

  // Analytics routes
  app.get("/api/admin/analytics/overview", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Admin access required" 
      });
    }

    try {
      const { from, to, period = '1m' } = req.query;
      let startDate: Date;
      let endDate: Date;

      // Use from/to dates if provided, otherwise fallback to period
      if (from && to) {
        startDate = new Date(from as string);
        endDate = new Date(to as string);
      } else {
        endDate = new Date();
        switch (period) {
          case '1d':
            startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
            break;
          case '7d':
            startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '1m':
            startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '12m':
            startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        }
      }

      const overview = await storage.getAnalyticsOverview(startDate, endDate);
      return res.status(200).json({
        success: true,
        data: overview
      });
    } catch (error) {
      console.error("Error getting analytics overview:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to get analytics overview"
      });
    }
  });

  app.get("/api/admin/analytics/registered-accounts", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Admin access required" 
      });
    }

    try {
      const { from, to, period = '1m' } = req.query;
      let startDate: Date;
      let endDate: Date;

      // Use from/to dates if provided, otherwise fallback to period
      if (from && to) {
        startDate = new Date(from as string);
        endDate = new Date(to as string);
      } else {
        endDate = new Date();
        switch (period) {
          case '1d':
            startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
            break;
          case '7d':
            startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '1m':
            startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '12m':
            startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        }
      }

      const stats = await storage.getRegisteredAccountsStats(period as string, startDate, endDate);
      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error("Error getting registered accounts stats:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to get registered accounts stats"
      });
    }
  });

  app.get("/api/admin/analytics/active-users", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Admin access required" 
      });
    }

    try {
      const { from, to, period = '1m' } = req.query;
      let startDate: Date;
      let endDate: Date;

      // Use from/to dates if provided, otherwise fallback to period
      if (from && to) {
        startDate = new Date(from as string);
        endDate = new Date(to as string);
      } else {
        endDate = new Date();
        switch (period) {
          case '1d':
            startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
            break;
          case '7d':
            startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '1m':
            startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '12m':
            startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        }
      }

      const stats = await storage.getActiveUsersStats(period as string, startDate, endDate);
      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error("Error getting active users stats:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to get active users stats"
      });
    }
  });

  // ========== Appearance Management ==========
  
  // Get appearance settings
  app.get("/api/admin/appearance/settings", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Admin access required" 
      });
    }

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
      console.error("Error getting appearance settings:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to get appearance settings"
      });
    }
  });

  // Update appearance setting
  app.patch("/api/admin/appearance/settings", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Admin access required" 
      });
    }

    try {
      const { type, key, value, language = 'vi' } = req.body;
      
      if (!type || !key || value === undefined) {
        return res.status(400).json({
          success: false,
          error: "Type, key, and value are required"
        });
      }

      const setting = await storage.updateAppearanceSetting(
        type, 
        key, 
        value, 
        req.user.id, 
        language
      );

      return res.status(200).json({
        success: true,
        data: setting,
        message: "Setting updated successfully"
      });
    } catch (error) {
      console.error("Error updating appearance setting:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to update appearance setting"
      });
    }
  });

  // Get appearance history
  app.get("/api/admin/appearance/history", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Admin access required" 
      });
    }

    try {
      const { settingId, limit = 50 } = req.query;
      const history = await storage.getAppearanceHistory(
        settingId ? parseInt(settingId as string) : undefined,
        parseInt(limit as string)
      );

      return res.status(200).json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error("Error getting appearance history:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to get appearance history"
      });
    }
  });

  // Restore appearance setting from history
  app.post("/api/admin/appearance/restore/:historyId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Admin access required" 
      });
    }

    try {
      const historyId = parseInt(req.params.historyId);
      
      if (isNaN(historyId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid history ID"
        });
      }

      const success = await storage.restoreAppearanceSetting(historyId, req.user.id);

      if (!success) {
        return res.status(404).json({
          success: false,
          error: "History record not found or restore failed"
        });
      }

      return res.status(200).json({
        success: true,
        message: "Setting restored successfully"
      });
    } catch (error) {
      console.error("Error restoring appearance setting:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to restore appearance setting"
      });
    }
  });

  // Upload asset (logo, images, etc.)
  app.post("/api/admin/appearance/upload", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Admin access required" 
      });
    }

    try {
      const assetData = schema.insertUploadedAssetSchema.parse({
        ...req.body,
        uploadedBy: req.user.id
      });

      const asset = await storage.uploadAsset(assetData);

      return res.status(201).json({
        success: true,
        data: asset,
        message: "Asset uploaded successfully"
      });
    } catch (error) {
      console.error("Error uploading asset:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to upload asset"
      });
    }
  });

  // Get uploaded assets
  app.get("/api/admin/appearance/assets", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Admin access required" 
      });
    }

    try {
      const { usageType } = req.query;
      const assets = await storage.getUploadedAssets(usageType as string);

      return res.status(200).json({
        success: true,
        data: assets
      });
    } catch (error) {
      console.error("Error getting uploaded assets:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to get uploaded assets"
      });
    }
  });

  // Email Template Management Routes
  
  // Get all email templates
  app.get("/api/admin/email-templates", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Unauthorized. Only admin users can perform this action." 
      });
    }

    try {
      const templates = await storage.getEmailTemplates();
      return res.status(200).json({
        success: true,
        data: templates
      });
    } catch (error) {
      console.error("Error fetching email templates:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch email templates"
      });
    }
  });

  // Get specific email template
  app.get("/api/admin/email-templates/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Unauthorized. Only admin users can perform this action." 
      });
    }

    try {
      const id = parseInt(req.params.id);
      const template = await storage.getEmailTemplate(id);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: "Email template not found"
        });
      }

      return res.status(200).json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error("Error fetching email template:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch email template"
      });
    }
  });

  // Create new email template
  app.post("/api/admin/email-templates", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Unauthorized. Only admin users can perform this action." 
      });
    }

    try {
      const templateData = schema.insertEmailTemplateSchema.parse(req.body);
      const newTemplate = await storage.createEmailTemplate(templateData);
      
      return res.status(201).json({
        success: true,
        data: newTemplate
      });
    } catch (error) {
      console.error("Error creating email template:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to create email template"
      });
    }
  });

  // Update email template
  app.patch("/api/admin/email-templates/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Unauthorized. Only admin users can perform this action." 
      });
    }

    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      const updatedTemplate = await storage.updateEmailTemplate(id, updateData);
      
      if (!updatedTemplate) {
        return res.status(404).json({
          success: false,
          error: "Email template not found"
        });
      }

      return res.status(200).json({
        success: true,
        data: updatedTemplate
      });
    } catch (error) {
      console.error("Error updating email template:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to update email template"
      });
    }
  });

  // Delete email template
  app.delete("/api/admin/email-templates/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Unauthorized. Only admin users can perform this action." 
      });
    }

    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteEmailTemplate(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: "Email template not found"
        });
      }

      return res.status(200).json({
        success: true,
        message: "Email template deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting email template:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to delete email template"
      });
    }
  });

  // ========== Theme Settings API ==========
  // Update theme settings
  app.patch("/api/admin/settings/theme", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Admin access required" 
      });
    }

    try {
      const { defaultTheme, allowUserThemeChange } = req.body;

      // Validate required fields
      if (!defaultTheme || typeof allowUserThemeChange !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: "All theme configuration fields are required"
        });
      }

      // Validate theme value
      if (!['light', 'dark', 'system'].includes(defaultTheme)) {
        return res.status(400).json({
          success: false,
          error: "Invalid theme value. Must be 'light', 'dark', or 'system'"
        });
      }

      // Update theme settings
      await storage.setSetting('defaultTheme', defaultTheme, 'theme');
      await storage.setSetting('allowUserThemeChange', allowUserThemeChange.toString(), 'theme');

      console.log('Theme settings updated by admin:', {
        defaultTheme,
        allowUserThemeChange,
        adminId: req.user.id
      });

      return res.status(200).json({
        success: true,
        message: "Theme settings updated successfully",
        data: {
          defaultTheme,
          allowUserThemeChange
        }
      });
    } catch (error) {
      console.error("Error updating theme settings:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to update theme settings"
      });
    }
  });
}
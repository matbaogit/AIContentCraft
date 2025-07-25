import { Request, Response, Express } from "express";
import { storage } from "./storage";
import { pool, db } from "../db";
import { z } from "zod";
import { format, subHours, subDays } from "date-fns";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import * as nodemailer from "nodemailer";

/**
 * Registers admin routes for admin panel functionality
 */
export function registerAdminRoutes(app: Express) {
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
        await storage.addUserCredits(userId, plan.value, planId, `Credits from plan: ${plan.name}`);
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

      // Send test email
      const info = await transporter.sendMail({
        from: smtpSettings.emailSender,
        to: email,
        subject: 'Test Email từ SEO AI Writer',
        html: `
          <h2>Test Email thành công!</h2>
          <p>Cài đặt SMTP của bạn đã được cấu hình đúng.</p>
          <p><strong>Máy chủ SMTP:</strong> ${smtpSettings.smtpServer}</p>
          <p><strong>Cổng:</strong> ${smtpSettings.smtpPort}</p>
          <p><strong>Người gửi:</strong> ${smtpSettings.emailSender}</p>
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
}
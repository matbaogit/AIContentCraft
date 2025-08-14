import { pgTable, text, serial, integer, bigint, boolean, timestamp, pgEnum, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum('role', ['admin', 'user']);
export const articleStatusEnum = pgEnum('article_status', ['draft', 'published', 'deleted']);
export const planTypeEnum = pgEnum('plan_type', ['credit', 'storage']);
export const connectionTypeEnum = pgEnum('connection_type', ['wordpress', 'facebook', 'tiktok', 'twitter']);
export const aiProviderEnum = pgEnum('ai_provider', ['openai', 'claude', 'gemini']);
export const postStatusEnum = pgEnum('post_status', ['pending', 'processing', 'completed', 'failed', 'cancelled']);
export const platformEnum = pgEnum('platform', ['wordpress', 'facebook', 'twitter', 'linkedin', 'instagram']);
export const referralStatusEnum = pgEnum('referral_status', ['pending', 'completed', 'failed']);
export const emailTemplateTypeEnum = pgEnum('email_template_type', ['verification', 'reset_password', 'welcome', 'notification']);

// Enum types for TypeScript
export type PlanType = 'credit' | 'storage';
export type ReferralTransactionStatus = 'pending' | 'completed' | 'failed';

// Users table
// FAQ table
export const faqs = pgTable('faqs', {
  id: serial('id').primaryKey(),
  questionVi: text('question_vi').notNull(),
  answerVi: text('answer_vi').notNull(),
  questionEn: text('question_en'),
  answerEn: text('answer_en'),
  order: integer('order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email'), // Nullable for Zalo users
  password: text('password'), // Nullable for Zalo users
  fullName: text('full_name'),
  role: roleEnum('role').notNull().default('user'),
  credits: integer('credits').notNull().default(0),
  language: text('language').notNull().default('vi'),
  isVerified: boolean('is_verified').notNull().default(false),
  verificationToken: text('verification_token'),
  verificationTokenExpiry: timestamp('verification_token_expiry'),
  resetPasswordToken: text('reset_password_token'),
  resetPasswordTokenExpiry: timestamp('reset_password_token_expiry'),
  referralCode: text('referral_code').unique(), // Mã giới thiệu của user này
  referredBy: integer('referred_by'), // ID người giới thiệu
  zaloId: text('zalo_id').unique(), // Zalo user ID
  avatar: text('avatar'), // Avatar URL from Zalo or other sources
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Plans table
export const plans = pgTable('plans', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').notNull(),
  price: text('price').notNull(), // Changed to match database numeric type
  credits: integer('credits').notNull(),
  durationDays: integer('duration_days'),
  features: jsonb('features'),
  isActive: boolean('is_active').notNull().default(true),
  value: bigint('value', { mode: 'number' }).default(0),
  duration: integer('duration'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User plans table
export const userPlans = pgTable('user_plans', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  planId: integer('plan_id').references(() => plans.id).notNull(),
  startDate: timestamp('start_date').defaultNow().notNull(),
  endDate: timestamp('end_date'),
  isActive: boolean('is_active').notNull().default(true),
  usedStorage: integer('used_storage').notNull().default(0), // in bytes
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Articles table
export const articles = pgTable('articles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  textContent: text('text_content'), // Pure text content without images
  imageUrls: jsonb('image_urls'), // Array of image URLs
  keywords: text('keywords'),
  status: articleStatusEnum('status').notNull().default('draft'),
  publishedUrl: text('published_url'),
  creditsUsed: integer('credits_used').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User connections table (WordPress, social media)
export const connections = pgTable('connections', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  type: connectionTypeEnum('type').notNull(),
  name: text('name').notNull(),
  config: jsonb('config').notNull(), // Store connection details like URLs, tokens, etc.
  accessToken: text('access_token'), // OAuth access token
  refreshToken: text('refresh_token'), // OAuth refresh token  
  expiresAt: timestamp('expires_at'), // Token expiration time
  pageId: text('page_id'), // Facebook Page ID
  pageName: text('page_name'), // Facebook Page name
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Credit transactions table
export const creditTransactions = pgTable('credit_transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  amount: integer('amount').notNull(), // Positive for purchases, negative for usage
  planId: integer('plan_id').references(() => plans.id),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Credit usage history table - detailed tracking of content generation usage
export const creditUsageHistory = pgTable('credit_usage_history', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  action: text('action').notNull(), // 'content_generation', 'image_generation', etc.
  contentLength: text('content_length'), // 'short', 'medium', 'long', 'extraLong'
  aiModel: text('ai_model'), // 'chatgpt', 'gemini', 'claude'
  generateImages: boolean('generate_images').default(false),
  imageCount: integer('image_count').default(0),
  totalCredits: integer('total_credits').notNull(),
  creditsBreakdown: jsonb('credits_breakdown'), // { contentLength: 1, aiModel: 1, images: 2 }
  requestData: jsonb('request_data'), // Full request parameters for debugging
  resultTitle: text('result_title'),
  resultWordCount: integer('result_word_count'),
  success: boolean('success').notNull().default(true),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// System settings table
export const systemSettings = pgTable('system_settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  value: text('value'),
  category: varchar('category', { length: 50 }).notNull().default('general'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations


export const plansRelations = relations(plans, ({ many }) => ({
  userPlans: many(userPlans),
  creditTransactions: many(creditTransactions),
}));

export const userPlansRelations = relations(userPlans, ({ one }) => ({
  user: one(users, { fields: [userPlans.userId], references: [users.id] }),
  plan: one(plans, { fields: [userPlans.planId], references: [plans.id] }),
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
  user: one(users, { fields: [articles.userId], references: [users.id] }),
  images: many(images),
}));

export const connectionsRelations = relations(connections, ({ one }) => ({
  user: one(users, { fields: [connections.userId], references: [users.id] }),
}));

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(users, { fields: [creditTransactions.userId], references: [users.id] }),
  plan: one(plans, { fields: [creditTransactions.planId], references: [plans.id] }),
}));

export const creditUsageHistoryRelations = relations(creditUsageHistory, ({ one }) => ({
  user: one(users, { fields: [creditUsageHistory.userId], references: [users.id] }),
}));

// Zod Schemas
export const insertUserSchema = createInsertSchema(users, {
  username: (schema) => schema.min(3, "Username must be at least 3 characters"),
  email: (schema) => schema.email("Must provide a valid email"),
  password: (schema) => schema.min(8, "Password must be at least 8 characters")
}).omit({ id: true, createdAt: true, updatedAt: true });

export const userLoginSchema = z.object({
  username: z.string().email("Must provide a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const insertArticleSchema = createInsertSchema(articles, {
  title: (schema) => schema.min(5, "Title must be at least 5 characters"),
  content: (schema) => schema.min(10, "Content must be at least 10 characters"),
});

export const insertConnectionSchema = createInsertSchema(connections);
export const insertPlanSchema = createInsertSchema(plans);
export const insertUserPlanSchema = createInsertSchema(userPlans);
export const insertCreditTransactionSchema = createInsertSchema(creditTransactions);
export const insertCreditUsageHistorySchema = createInsertSchema(creditUsageHistory);

export const selectUserSchema = createSelectSchema(users);
export const selectArticleSchema = createSelectSchema(articles);
export const selectCreditUsageHistorySchema = createSelectSchema(creditUsageHistory);
export const selectConnectionSchema = createSelectSchema(connections);
export const selectPlanSchema = createSelectSchema(plans);
export const selectUserPlanSchema = createSelectSchema(userPlans);
export const selectCreditTransactionSchema = createSelectSchema(creditTransactions);
export const selectSystemSettingSchema = createSelectSchema(systemSettings);
export const insertSystemSettingSchema = createInsertSchema(systemSettings, {
  key: (schema) => schema.min(1, "Key is required"),
  category: (schema) => schema.min(1, "Category is required"),
});

// Export types
export type User = z.infer<typeof selectUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;

export type Article = z.infer<typeof selectArticleSchema>;
export type InsertArticle = z.infer<typeof insertArticleSchema>;

export type Connection = z.infer<typeof selectConnectionSchema>;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;

export type Plan = z.infer<typeof selectPlanSchema>;
export type InsertPlan = z.infer<typeof insertPlanSchema>;

export type UserPlan = z.infer<typeof selectUserPlanSchema>;
export type InsertUserPlan = z.infer<typeof insertUserPlanSchema>;

export type CreditTransaction = z.infer<typeof selectCreditTransactionSchema>;
export type InsertCreditTransaction = z.infer<typeof insertCreditTransactionSchema>;

export type SystemSetting = z.infer<typeof selectSystemSettingSchema>;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;

// API Keys table for third-party integration
export const apiKeys = pgTable('api_keys', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  key: text('key').notNull().unique(),
  secret: text('secret').notNull(),
  scopes: text('scopes').array().notNull().default([]),
  isActive: boolean('is_active').notNull().default(true),
  expiresAt: timestamp('expires_at'),
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// API Keys relations
export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, { fields: [apiKeys.userId], references: [users.id] }),
}));

// Update user relations to include API keys and images
export const usersRelationsWithApiKeys = relations(users, ({ many }) => ({
  articles: many(articles),
  connections: many(connections),
  userPlans: many(userPlans),
  creditTransactions: many(creditTransactions),
  apiKeys: many(apiKeys),
  images: many(images),
}));

// API Keys schemas
export const selectApiKeySchema = createSelectSchema(apiKeys);
export const insertApiKeySchema = createInsertSchema(apiKeys);

// API Keys types
export type ApiKey = z.infer<typeof selectApiKeySchema>;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

// Images table
export const images = pgTable('images', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  articleId: integer('article_id').references(() => articles.id),
  title: text('title').notNull(),
  prompt: text('prompt').notNull(),
  imageUrl: text('image_url').notNull(),
  sourceText: text('source_text'), // Text content from SEO article
  creditsUsed: integer('credits_used').notNull().default(1),
  status: text('status').notNull().default('generated'), // generated, approved, rejected
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Feedback table
export const feedback = pgTable('feedback', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('unread'), // unread, read, replied
  page: text('page'), // Which page the feedback was submitted from
  userId: integer('user_id').references(() => users.id), // Optional if user is logged in
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Images relations
export const imagesRelations = relations(images, ({ one }) => ({
  user: one(users, { fields: [images.userId], references: [users.id] }),
  article: one(articles, { fields: [images.articleId], references: [articles.id] }),
}));

// Feedback relations
export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, { fields: [feedback.userId], references: [users.id] }),
}));

// Images schemas
export const selectImageSchema = createSelectSchema(images);
export const insertImageSchema = createInsertSchema(images, {
  title: (schema) => schema.min(1, "Title is required"),
  prompt: (schema) => schema.min(1, "Prompt is required"),
  imageUrl: (schema) => schema.url("Must be a valid URL"),
});

// Images types
export type Image = z.infer<typeof selectImageSchema>;
export type InsertImage = z.infer<typeof insertImageSchema>;

// Feedback schemas
export const selectFeedbackSchema = createSelectSchema(feedback);
export const insertFeedbackSchema = createInsertSchema(feedback, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
  email: (schema) => schema.email("Must provide a valid email"),
  subject: (schema) => schema.min(5, "Subject must be at least 5 characters"),
  message: (schema) => schema.min(10, "Message must be at least 10 characters"),
});

// Feedback types
export type Feedback = z.infer<typeof selectFeedbackSchema>;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

// Translations table
export const translations = pgTable('translations', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  vi: text('vi').notNull(),
  en: text('en').notNull(),
  category: text('category').notNull().default('common'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Translations schemas
export const selectTranslationSchema = createSelectSchema(translations);
export const insertTranslationSchema = createInsertSchema(translations, {
  key: (schema) => schema.min(1, "Key cannot be empty"),
  vi: (schema) => schema.min(1, "Vietnamese translation cannot be empty"),
  en: (schema) => schema.min(1, "English translation cannot be empty"),
  category: (schema) => schema.min(1, "Category cannot be empty"),
});

// Translation types
export type Translation = z.infer<typeof selectTranslationSchema>;
export type InsertTranslation = z.infer<typeof insertTranslationSchema>;

// AI API Keys table
export const aiApiKeys = pgTable('ai_api_keys', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  provider: aiProviderEnum('provider').notNull(),
  apiKey: text('api_key').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// AI API Keys relations
export const aiApiKeysRelations = relations(aiApiKeys, ({ one }) => ({
  user: one(users, { fields: [aiApiKeys.userId], references: [users.id] }),
}));

// AI API Keys schemas
export const selectAiApiKeySchema = createSelectSchema(aiApiKeys);
export const insertAiApiKeySchema = createInsertSchema(aiApiKeys, {
  name: (schema) => schema.min(1, "Name cannot be empty"),
  apiKey: (schema) => schema.min(1, "API key cannot be empty"),
});

// AI API Keys types
export type AiApiKey = z.infer<typeof selectAiApiKeySchema>;
export type InsertAiApiKey = z.infer<typeof insertAiApiKeySchema>;

// Collaborative Workspace Enums
export const workspaceRoleEnum = pgEnum('workspace_role', ['owner', 'admin', 'editor', 'viewer']);
export const workspaceStatusEnum = pgEnum('workspace_status', ['active', 'archived', 'deleted']);
export const sessionStatusEnum = pgEnum('session_status', ['active', 'completed', 'cancelled']);

// Workspaces table
export const workspaces = pgTable('workspaces', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  ownerId: integer('owner_id').references(() => users.id).notNull(),
  status: workspaceStatusEnum('status').notNull().default('active'),
  settings: jsonb('settings').default({}),
  inviteCode: text('invite_code').unique(),
  isPublic: boolean('is_public').notNull().default(false),
  maxMembers: integer('max_members').notNull().default(10),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Workspace Members table
export const workspaceMembers = pgTable('workspace_members', {
  id: serial('id').primaryKey(),
  workspaceId: integer('workspace_id').references(() => workspaces.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  role: workspaceRoleEnum('role').notNull().default('viewer'),
  invitedBy: integer('invited_by').references(() => users.id),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  lastActiveAt: timestamp('last_active_at').defaultNow(),
});

// Collaborative Sessions table
export const collaborativeSessions = pgTable('collaborative_sessions', {
  id: serial('id').primaryKey(),
  workspaceId: integer('workspace_id').references(() => workspaces.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  status: sessionStatusEnum('status').notNull().default('active'),
  prompt: text('prompt'),
  imageStyle: text('image_style').notNull().default('realistic'),
  targetImageCount: integer('target_image_count').notNull().default(1),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Session Images table
export const sessionImages = pgTable('session_images', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => collaborativeSessions.id).notNull(),
  imageId: integer('image_id').references(() => images.id).notNull(),
  contributedBy: integer('contributed_by').references(() => users.id).notNull(),
  version: integer('version').notNull().default(1),
  isApproved: boolean('is_approved').notNull().default(false),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  feedback: text('feedback'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Session Activity table
export const sessionActivity = pgTable('session_activity', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => collaborativeSessions.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  activityType: text('activity_type').notNull(), // joined, left, image_added, image_approved, etc.
  data: jsonb('data').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Sidebar Menu Items table
export const sidebarMenuItems = pgTable('sidebar_menu_items', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(), // unique identifier for menu item
  label: varchar('label', { length: 200 }).notNull(), // display name
  labelEn: varchar('label_en', { length: 200 }), // English label
  icon: varchar('icon', { length: 50 }), // icon name
  path: varchar('path', { length: 200 }), // route path
  parentKey: varchar('parent_key', { length: 100 }), // for nested menus
  sortOrder: integer('sort_order').notNull().default(0),
  isEnabled: boolean('is_enabled').notNull().default(true),
  requiredRole: roleEnum('required_role').default('user'), // minimum role required
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Workspace Relations
export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, { fields: [workspaces.ownerId], references: [users.id] }),
  members: many(workspaceMembers),
  sessions: many(collaborativeSessions),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, { fields: [workspaceMembers.workspaceId], references: [workspaces.id] }),
  user: one(users, { fields: [workspaceMembers.userId], references: [users.id] }),
  inviter: one(users, { fields: [workspaceMembers.invitedBy], references: [users.id] }),
}));

export const collaborativeSessionsRelations = relations(collaborativeSessions, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [collaborativeSessions.workspaceId], references: [workspaces.id] }),
  creator: one(users, { fields: [collaborativeSessions.createdBy], references: [users.id] }),
  sessionImages: many(sessionImages),
  activities: many(sessionActivity),
}));

export const sessionImagesRelations = relations(sessionImages, ({ one }) => ({
  session: one(collaborativeSessions, { fields: [sessionImages.sessionId], references: [collaborativeSessions.id] }),
  image: one(images, { fields: [sessionImages.imageId], references: [images.id] }),
  contributor: one(users, { fields: [sessionImages.contributedBy], references: [users.id] }),
  approver: one(users, { fields: [sessionImages.approvedBy], references: [users.id] }),
}));

export const sessionActivityRelations = relations(sessionActivity, ({ one }) => ({
  session: one(collaborativeSessions, { fields: [sessionActivity.sessionId], references: [collaborativeSessions.id] }),
  user: one(users, { fields: [sessionActivity.userId], references: [users.id] }),
}));

// Workspace Schemas
export const selectWorkspaceSchema = createSelectSchema(workspaces);
export const insertWorkspaceSchema = createInsertSchema(workspaces, {
  name: (schema) => schema.min(1, "Workspace name is required"),
  maxMembers: (schema) => schema.min(1, "Max members must be at least 1").max(100, "Max members cannot exceed 100"),
});

export const selectWorkspaceMemberSchema = createSelectSchema(workspaceMembers);
export const insertWorkspaceMemberSchema = createInsertSchema(workspaceMembers);

export const selectCollaborativeSessionSchema = createSelectSchema(collaborativeSessions);
export const insertCollaborativeSessionSchema = createInsertSchema(collaborativeSessions, {
  name: (schema) => schema.min(1, "Session name is required"),
  targetImageCount: (schema) => schema.min(1, "Target image count must be at least 1").max(10, "Target image count cannot exceed 10"),
});

export const selectSessionImageSchema = createSelectSchema(sessionImages);
export const insertSessionImageSchema = createInsertSchema(sessionImages);

export const selectSessionActivitySchema = createSelectSchema(sessionActivity);
export const insertSessionActivitySchema = createInsertSchema(sessionActivity, {
  activityType: (schema) => schema.min(1, "Activity type is required"),
});

// Workspace Types
export type Workspace = z.infer<typeof selectWorkspaceSchema>;
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;
export type WorkspaceMember = z.infer<typeof selectWorkspaceMemberSchema>;
export type InsertWorkspaceMember = z.infer<typeof insertWorkspaceMemberSchema>;
export type CollaborativeSession = z.infer<typeof selectCollaborativeSessionSchema>;
export type InsertCollaborativeSession = z.infer<typeof insertCollaborativeSessionSchema>;
export type SessionImage = z.infer<typeof selectSessionImageSchema>;
export type InsertSessionImage = z.infer<typeof insertSessionImageSchema>;
export type SessionActivity = z.infer<typeof selectSessionActivitySchema>;
export type InsertSessionActivity = z.infer<typeof insertSessionActivitySchema>;

// Social Media Connections table
export const socialConnections = pgTable('social_connections', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  platform: platformEnum('platform').notNull(),
  accountName: text('account_name').notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  tokenExpiry: timestamp('token_expiry'),
  accountId: text('account_id').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Scheduled Posts table
export const scheduledPosts = pgTable('scheduled_posts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  articleId: integer('article_id').references(() => articles.id),
  title: text('title').notNull(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  featuredImage: text('featured_image'),
  platforms: jsonb('platforms').notNull(), // Array of platform configs
  scheduledTime: timestamp('scheduled_time').notNull(),
  status: postStatusEnum('status').notNull().default('pending'),
  publishedUrls: jsonb('published_urls').default({}), // URLs after successful posting
  errorLogs: jsonb('error_logs').default([]),
  retryCount: integer('retry_count').notNull().default(0),
  maxRetries: integer('max_retries').notNull().default(3),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Post Templates table
export const postTemplates = pgTable('post_templates', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  platform: platformEnum('platform').notNull(),
  template: jsonb('template').notNull(), // Template structure for each platform
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Posting Analytics table
export const postingAnalytics = pgTable('posting_analytics', {
  id: serial('id').primaryKey(),
  scheduledPostId: integer('scheduled_post_id').references(() => scheduledPosts.id).notNull(),
  platform: platformEnum('platform').notNull(),
  postId: text('post_id'), // Platform-specific post ID
  postUrl: text('post_url'),
  impressions: integer('impressions').default(0),
  clicks: integer('clicks').default(0),
  likes: integer('likes').default(0),
  shares: integer('shares').default(0),
  comments: integer('comments').default(0),
  engagement: integer('engagement').default(0),
  lastSyncAt: timestamp('last_sync_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Publishing logs table for detailed logging
export const publishingLogs = pgTable('publishing_logs', {
  id: serial('id').primaryKey(),
  scheduledPostId: integer('scheduled_post_id').references(() => scheduledPosts.id).notNull(),
  platform: platformEnum('platform').notNull(),
  status: varchar('status', { length: 20 }).notNull(), // 'started', 'success', 'failed'
  message: text('message'),
  details: jsonb('details'), // Error details, response data, etc.
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});



// Social Connections Relations
export const socialConnectionsRelations = relations(socialConnections, ({ one }) => ({
  user: one(users, { fields: [socialConnections.userId], references: [users.id] }),
}));

// Scheduled Posts Relations
export const scheduledPostsRelations = relations(scheduledPosts, ({ one, many }) => ({
  user: one(users, { fields: [scheduledPosts.userId], references: [users.id] }),
  article: one(articles, { fields: [scheduledPosts.articleId], references: [articles.id] }),
  analytics: many(postingAnalytics),
}));

// Post Templates Relations
export const postTemplatesRelations = relations(postTemplates, ({ one }) => ({
  user: one(users, { fields: [postTemplates.userId], references: [users.id] }),
}));

// Posting Analytics Relations
export const postingAnalyticsRelations = relations(postingAnalytics, ({ one }) => ({
  scheduledPost: one(scheduledPosts, { fields: [postingAnalytics.scheduledPostId], references: [scheduledPosts.id] }),
}));

// Publishing Logs Relations
export const publishingLogsRelations = relations(publishingLogs, ({ one }) => ({
  scheduledPost: one(scheduledPosts, { fields: [publishingLogs.scheduledPostId], references: [scheduledPosts.id] }),
}));

// Referral System Tables

// Referrals table - stores referral codes and stats for each user
export const referrals = pgTable('referrals', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  referralCode: text('referral_code').notNull().unique(),
  totalReferrals: integer('total_referrals').notNull().default(0),
  totalCreditsEarned: integer('total_credits_earned').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Referral transactions table - logs each referral transaction
export const referralTransactions = pgTable('referral_transactions', {
  id: serial('id').primaryKey(),
  referrerId: integer('referrer_id').references(() => users.id).notNull(),
  referredUserId: integer('referred_user_id').references(() => users.id).notNull(),
  referralCode: text('referral_code').notNull(),
  referrerCredits: integer('referrer_credits').notNull(),
  referredCredits: integer('referred_credits').notNull(),
  status: referralStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// Referral Relations
export const referralsRelations = relations(referrals, ({ one, many }) => ({
  user: one(users, { fields: [referrals.userId], references: [users.id] }),
  transactions: many(referralTransactions, { relationName: 'referrerTransactions' }),
}));

export const referralTransactionsRelations = relations(referralTransactions, ({ one }) => ({
  referrer: one(users, { fields: [referralTransactions.referrerId], references: [users.id] }),
  referredUser: one(users, { fields: [referralTransactions.referredUserId], references: [users.id] }),
}));

// Update users relations to include referral info and original relations
export const usersRelations = relations(users, ({ one, many }) => ({
  // Original relations
  articles: many(articles),
  connections: many(connections),
  userPlans: many(userPlans),
  creditTransactions: many(creditTransactions),
  creditUsageHistory: many(creditUsageHistory),
  // Referral relations
  referrer: one(users, { fields: [users.referredBy], references: [users.id], relationName: 'referrer' }),
  referredUsers: many(users, { relationName: 'referrer' }),
  referralInfo: one(referrals, { fields: [users.id], references: [referrals.userId] }),
  referralTransactionsAsReferrer: many(referralTransactions, { relationName: 'referrerTransactions' }),
  referralTransactionsAsReferred: many(referralTransactions, { relationName: 'referredTransactions' }),
}));



// Social Media Schemas
export const selectSocialConnectionSchema = createSelectSchema(socialConnections);
export const insertSocialConnectionSchema = createInsertSchema(socialConnections, {
  accountName: (schema) => schema.min(1, "Account name is required"),
  accessToken: (schema) => schema.min(1, "Access token is required"),
  accountId: (schema) => schema.min(1, "Account ID is required"),
});

export const selectScheduledPostSchema = createSelectSchema(scheduledPosts);
export const insertScheduledPostSchema = createInsertSchema(scheduledPosts, {
  title: (schema) => schema.min(1, "Title is required").max(200, "Title too long"),
  content: (schema) => schema.min(1, "Content is required"),
  scheduledTime: (schema) => schema.refine(
    (date) => new Date(date) > new Date(),
    "Scheduled time must be in the future"
  ),
});

export const selectPostTemplateSchema = createSelectSchema(postTemplates);
export const insertPostTemplateSchema = createInsertSchema(postTemplates, {
  name: (schema) => schema.min(1, "Template name is required").max(100, "Name too long"),
});

// Referral Schemas
export const selectReferralSchema = createSelectSchema(referrals);
export const insertReferralSchema = createInsertSchema(referrals, {
  referralCode: (schema) => schema.min(6, "Referral code must be at least 6 characters").max(20, "Referral code too long"),
});

export const selectReferralTransactionSchema = createSelectSchema(referralTransactions);
export const insertReferralTransactionSchema = createInsertSchema(referralTransactions, {
  referrerCredits: (schema) => schema.min(0, "Referrer credits must be positive"),
  referredCredits: (schema) => schema.min(0, "Referred credits must be positive"),
});

// TypeScript types
export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;
export type ReferralTransaction = typeof referralTransactions.$inferSelect;
export type NewReferralTransaction = typeof referralTransactions.$inferInsert;

export const selectPostingAnalyticsSchema = createSelectSchema(postingAnalytics);
export const insertPostingAnalyticsSchema = createInsertSchema(postingAnalytics);

export const selectPublishingLogsSchema = createSelectSchema(publishingLogs);
export const insertPublishingLogsSchema = createInsertSchema(publishingLogs, {
  message: (schema) => schema.min(1, "Message is required"),
  status: (schema) => schema.min(1, "Status is required"),
});



// Sidebar Menu Items Schema
export const insertSidebarMenuItemSchema = createInsertSchema(sidebarMenuItems);
export const selectSidebarMenuItemSchema = createSelectSchema(sidebarMenuItems);

// Sidebar Menu Items Types
export type SidebarMenuItem = z.infer<typeof selectSidebarMenuItemSchema>;
export type InsertSidebarMenuItem = z.infer<typeof insertSidebarMenuItemSchema>;

// Social Media Types
export type SocialConnection = z.infer<typeof selectSocialConnectionSchema>;
export type InsertSocialConnection = z.infer<typeof insertSocialConnectionSchema>;
export type ScheduledPost = z.infer<typeof selectScheduledPostSchema>;
export type InsertScheduledPost = z.infer<typeof insertScheduledPostSchema>;
export type PostTemplate = z.infer<typeof selectPostTemplateSchema>;
export type InsertPostTemplate = z.infer<typeof insertPostTemplateSchema>;
export type PostingAnalytics = z.infer<typeof selectPostingAnalyticsSchema>;
export type InsertPostingAnalytics = z.infer<typeof insertPostingAnalyticsSchema>;
export type PublishingLog = z.infer<typeof selectPublishingLogsSchema>;
export type InsertPublishingLog = z.infer<typeof insertPublishingLogsSchema>;

// Appearance Settings and History Management

// Enum for appearance setting types
export const appearanceTypeEnum = pgEnum('appearance_type', ['seo_meta', 'header', 'footer', 'login_page', 'theme']);

// Appearance Settings table
export const appearanceSettings = pgTable('appearance_settings', {
  id: serial('id').primaryKey(),
  type: appearanceTypeEnum('type').notNull(), // seo_meta, header, footer, login_page
  key: text('key').notNull(), // e.g., 'site_title', 'logo_url', 'footer_copyright'
  value: text('value'), // The actual setting value
  language: text('language').default('vi'), // For multilingual support
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Appearance History table for tracking changes and restore functionality
export const appearanceHistory = pgTable('appearance_history', {
  id: serial('id').primaryKey(),
  settingId: integer('setting_id').references(() => appearanceSettings.id).notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  changedBy: integer('changed_by').references(() => users.id).notNull(),
  changeDescription: text('change_description'), // Optional description of the change
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Uploaded Assets table for managing logos and images
export const uploadedAssets = pgTable('uploaded_assets', {
  id: serial('id').primaryKey(),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(), // File size in bytes
  path: text('path').notNull(), // Storage path
  url: text('url').notNull(), // Public URL
  uploadedBy: integer('uploaded_by').references(() => users.id).notNull(),
  usageType: text('usage_type'), // 'logo', 'header_image', 'login_background', etc.
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Appearance Settings Relations
export const appearanceSettingsRelations = relations(appearanceSettings, ({ many }) => ({
  history: many(appearanceHistory),
}));

export const appearanceHistoryRelations = relations(appearanceHistory, ({ one }) => ({
  setting: one(appearanceSettings, { fields: [appearanceHistory.settingId], references: [appearanceSettings.id] }),
  changedByUser: one(users, { fields: [appearanceHistory.changedBy], references: [users.id] }),
}));

export const uploadedAssetsRelations = relations(uploadedAssets, ({ one }) => ({
  uploader: one(users, { fields: [uploadedAssets.uploadedBy], references: [users.id] }),
}));

// Appearance Schemas
export const selectAppearanceSettingSchema = createSelectSchema(appearanceSettings);
export const insertAppearanceSettingSchema = createInsertSchema(appearanceSettings, {
  key: (schema) => schema.min(1, "Setting key is required").max(100, "Key too long"),
  value: (schema) => schema.max(5000, "Value too long"),
});

export const selectAppearanceHistorySchema = createSelectSchema(appearanceHistory);
export const insertAppearanceHistorySchema = createInsertSchema(appearanceHistory);

export const selectUploadedAssetSchema = createSelectSchema(uploadedAssets);
export const insertUploadedAssetSchema = createInsertSchema(uploadedAssets, {
  filename: (schema) => schema.min(1, "Filename is required"),
  originalName: (schema) => schema.min(1, "Original name is required"),
  mimeType: (schema) => schema.min(1, "MIME type is required"),
  size: (schema) => schema.min(1, "File size must be positive"),
  path: (schema) => schema.min(1, "File path is required"),
  url: (schema) => schema.min(1, "File URL is required"),
});

// Appearance Types
export type AppearanceSetting = z.infer<typeof selectAppearanceSettingSchema>;
export type InsertAppearanceSetting = z.infer<typeof insertAppearanceSettingSchema>;
export type AppearanceHistory = z.infer<typeof selectAppearanceHistorySchema>;
export type InsertAppearanceHistory = z.infer<typeof insertAppearanceHistorySchema>;
export type UploadedAsset = z.infer<typeof selectUploadedAssetSchema>;
export type InsertUploadedAsset = z.infer<typeof insertUploadedAssetSchema>;

// Legal Pages table
export const legalPages = pgTable('legal_pages', {
  id: text('id').primaryKey(), // 'privacy-policy', 'data-deletion', 'terms-of-service'
  title_vi: text('title_vi').notNull(),
  title_en: text('title_en').notNull(),
  content_vi: text('content_vi').notNull(),
  content_en: text('content_en').notNull(),
  path: text('path').notNull().unique(),
  description: text('description'),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Legal Pages Schemas
export const selectLegalPageSchema = createSelectSchema(legalPages);
export const insertLegalPageSchema = createInsertSchema(legalPages, {
  title_vi: (schema) => schema.min(1, "Vietnamese title is required"),
  title_en: (schema) => schema.min(1, "English title is required"),
  content_vi: (schema) => schema.min(10, "Vietnamese content must be at least 10 characters"),
  content_en: (schema) => schema.min(10, "English content must be at least 10 characters"),
  path: (schema) => schema.min(1, "Path is required"),
});

// Legal Pages Types
export type LegalPage = z.infer<typeof selectLegalPageSchema>;
export type InsertLegalPage = z.infer<typeof insertLegalPageSchema>;

// FAQ Schemas
export const selectFaqSchema = createSelectSchema(faqs);
export const insertFaqSchema = createInsertSchema(faqs, {
  questionVi: (schema) => schema.min(1, "Vietnamese question is required"),
  answerVi: (schema) => schema.min(1, "Vietnamese answer is required"),
  order: (schema) => schema.min(0, "Order must be non-negative"),
});

// FAQ Types
export type Faq = z.infer<typeof selectFaqSchema>;
export type InsertFaq = z.infer<typeof insertFaqSchema>;

// Email Templates table
export const emailTemplates = pgTable('email_templates', {
  id: serial('id').primaryKey(),
  type: emailTemplateTypeEnum('type').notNull(),
  name: text('name').notNull(),
  subject: text('subject').notNull(),
  htmlContent: text('html_content').notNull(),
  textContent: text('text_content').notNull(),
  variables: jsonb('variables').$type<string[]>().default([]),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Email Template Schemas
export const selectEmailTemplateSchema = createSelectSchema(emailTemplates);
export const insertEmailTemplateSchema = createInsertSchema(emailTemplates, {
  name: (schema) => schema.min(1, "Template name is required"),
  subject: (schema) => schema.min(1, "Subject is required"),
  htmlContent: (schema) => schema.min(1, "HTML content is required"),
  textContent: (schema) => schema.min(1, "Text content is required"),
});

// Email Template Types
export type EmailTemplate = z.infer<typeof selectEmailTemplateSchema>;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;



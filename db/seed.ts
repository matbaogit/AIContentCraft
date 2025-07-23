import { db } from "./index";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
  try {
    console.log("Starting database seeding...");

    // Create default admin account
    const adminUser = await db.query.users.findFirst({
      where: eq(schema.users.username, 'admin')
    });

    if (!adminUser) {
      console.log("Creating admin user...");
      const adminPassword = await hashPassword('admin@1238');
      await db.insert(schema.users).values({
        username: 'admin',
        email: 'admin@example.com',
        password: adminPassword,
        fullName: 'Administrator',
        role: 'admin',
        credits: 100,
      });
      console.log("Admin user created successfully");
    } else {
      console.log("Admin user already exists, skipping");
    }

    // Create credit plans
    const existingCreditPlans = await db.query.plans.findMany({
      where: eq(schema.plans.type, 'credit')
    });

    if (existingCreditPlans.length === 0) {
      console.log("Creating credit plans...");
      await db.insert(schema.plans).values([
        {
          name: 'Gói Cơ Bản',
          description: '50 tín dụng tạo bài viết, mỗi tín dụng tạo 1 bài ~1000 từ',
          type: 'credit',
          price: 500000,
          value: 50,
          credits: 50,
        },
        {
          name: 'Gói Nâng Cao',
          description: '100 tín dụng tạo bài viết, mỗi tín dụng tạo 1 bài ~1500 từ',
          type: 'credit',
          price: 900000,
          value: 100,
          credits: 100,
        },
        {
          name: 'Gói Chuyên Nghiệp',
          description: '250 tín dụng tạo bài viết, mỗi tín dụng tạo 1 bài ~2000 từ',
          type: 'credit',
          price: 2000000,
          value: 250,
          credits: 250,
        }
      ]);
      console.log("Credit plans created successfully");
    } else {
      console.log("Credit plans already exist, skipping");
    }

    // Create storage plans
    const existingStoragePlans = await db.query.plans.findMany({
      where: eq(schema.plans.type, 'storage')
    });

    if (existingStoragePlans.length === 0) {
      console.log("Creating storage plans...");
      await db.insert(schema.plans).values([
        {
          name: 'Gói Lưu Trữ Basic',
          description: 'Lưu trữ tối đa 50 bài viết, 5GB dung lượng lưu trữ',
          type: 'storage',
          price: 200000,
          value: 5 * 1024 * 1024 * 1024, // 5GB in bytes
          duration: 30, // 1 month
          credits: 0, // Storage plans don't give credits
        },
        {
          name: 'Gói Lưu Trữ Business',
          description: 'Lưu trữ tối đa 200 bài viết, 20GB dung lượng lưu trữ',
          type: 'storage',
          price: 500000,
          value: 20 * 1024 * 1024 * 1024, // 20GB in bytes
          duration: 30, // 1 month
          credits: 0, // Storage plans don't give credits
        },
        {
          name: 'Gói Lưu Trữ Enterprise',
          description: 'Lưu trữ không giới hạn bài viết, 50GB dung lượng lưu trữ',
          type: 'storage',
          price: 1000000,
          value: 50 * 1024 * 1024 * 1024, // 50GB in bytes
          duration: 30, // 1 month
          credits: 0, // Storage plans don't give credits
        }
      ]);
      console.log("Storage plans created successfully");
    } else {
      console.log("Storage plans already exist, skipping");
    }
    
    // Tạo cài đặt hệ thống mặc định cho webhook nếu chưa có
    const webhookSetting = await db.query.systemSettings.findFirst({
      where: eq(schema.systemSettings.key, 'notificationWebhookUrl')
    });
    
    if (!webhookSetting) {
      console.log("Creating default webhook settings...");
      await db.insert(schema.systemSettings).values({
        key: 'notificationWebhookUrl',
        value: 'https://n8n-demo.example.com/webhook/seo-ai-content', // Mặc định cho webhook
        category: 'integration'
      });
      console.log("Default webhook settings created");
    } else {
      console.log("Webhook settings already exist, skipping");
    }

    // Create sidebar menu items
    const existingMenuItems = await db.query.sidebarMenuItems.findMany();
    
    if (existingMenuItems.length === 0) {
      console.log("Creating default sidebar menu items...");
      await db.insert(schema.sidebarMenuItems).values([
        {
          key: 'dashboard',
          icon: 'LayoutDashboard',
          path: '/dashboard',
          label: 'Bảng điều khiển',
          labelEn: 'Dashboard',
          isEnabled: true,
          sortOrder: 1,
          requiredRole: 'user'
        },
        {
          key: 'my-articles',
          icon: 'FileText',
          path: '/dashboard/my-articles',
          label: 'Bài viết của tôi',
          labelEn: 'My Articles',
          isEnabled: true,
          sortOrder: 2,
          requiredRole: 'user'
        },
        {
          key: 'create-content',
          icon: 'Plus',
          path: '/dashboard/create-content',
          label: 'Tạo nội dung',
          labelEn: 'Create Content',
          isEnabled: true,
          sortOrder: 3,
          requiredRole: 'user'
        },
        {
          key: 'image-library',
          icon: 'Images',
          path: '/dashboard/image-library',
          label: 'Thư viện hình ảnh',
          labelEn: 'Image Library',
          isEnabled: true,
          sortOrder: 4,
          requiredRole: 'user'
        },
        {
          key: 'referral',
          icon: 'Gift',
          path: '/dashboard/referral',
          label: 'Giới thiệu',
          labelEn: 'Referral',
          isEnabled: true,
          sortOrder: 16,
          requiredRole: 'user'
        },
        {
          key: 'credits',
          icon: 'Coins',
          path: '/dashboard/credits',
          label: 'Tín dụng',
          labelEn: 'Credits',
          isEnabled: true,
          sortOrder: 17,
          requiredRole: 'user'
        },
        {
          key: 'settings',
          icon: 'Settings',
          path: '/dashboard/settings',
          label: 'Cài đặt',
          labelEn: 'Settings',
          isEnabled: true,
          sortOrder: 18,
          requiredRole: 'user'
        }
      ]);
      console.log("Default sidebar menu items created");
    } else {
      // Check if referral menu item exists, if not add it
      const referralMenuItem = await db.query.sidebarMenuItems.findFirst({
        where: eq(schema.sidebarMenuItems.key, 'referral')
      });
      
      if (!referralMenuItem) {
        console.log("Adding referral menu item...");
        await db.insert(schema.sidebarMenuItems).values({
          key: 'referral',
          icon: 'Gift',
          path: '/dashboard/referral',
          label: 'Giới thiệu',
          labelEn: 'Referral',
          isEnabled: true,
          sortOrder: 16,
          requiredRole: 'user'
        });
        console.log("Referral menu item created");
      } else {
        console.log("Referral menu item already exists, skipping");
      }
    }

    console.log("Database seeding completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();

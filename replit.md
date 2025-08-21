# SEO AI Writer

## Overview
SEO AI Writer is a full-stack web application designed to help users create SEO-optimized content using artificial intelligence. It offers AI-powered content generation, SEO optimization tools, multi-language support, and collaborative features for teams and individuals. The project aims to provide a comprehensive platform for content creation with a focus on SEO.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **UI Components**: Radix UI primitives with shadcn/ui approach
- **Styling**: TailwindCSS (dark/light theme)
- **State Management**: React Query for server state, React Context for global app state
- **Routing**: Wouter
- **Form Handling**: React Hook Form with Zod validation
- **Internationalization**: Custom i18n implementation (Vietnamese, English)
- **UI/UX**: Emphasis on responsive design, modern aesthetics, and intuitive workflows. Adaptive theme switcher with playful animations.

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Authentication**: Passport.js (local strategy, session management)
- **Database ORM**: Drizzle ORM
- **Email Service**: Nodemailer
- **File Processing**: Built-in content generation and image handling

### Database
- **Database**: PostgreSQL 16
- **Connection**: pg driver with connection pooling
- **Migrations**: Drizzle Kit
- **Session Store**: PostgreSQL-based session storage

### Key Components
- **User Management System**: Registration, authentication, role-based access, password reset, credit-based usage, multi-language preferences.
- **Content Generation Engine**: AI-powered article generation (OpenAI, Claude, Gemini), SEO optimization, multi-content types, customizable tone, image generation.
- **Article Management**: CRUD for articles, content/image separation, draft/published states, user libraries, SEO metadata.
- **Plan and Credit System**: Multiple subscription plans, credit usage tracking, plan assignment, transaction history.
- **Integration System**: Social media connections (WordPress, Facebook, Twitter, LinkedIn) with scheduled posting, API key management, webhook support.
- **Admin Panel**: User, plan, pricing, and system settings management, analytics with custom CSS charts.
- **Data Flow**: Defined flows for user authentication, content generation, image generation, and publishing.

### Recent Changes (August 2025)
- **Analytics Dashboard**: Resolved chart visualization issues by replacing Recharts library with custom CSS-based bar charts
- **Chart Implementation**: Custom animated bar charts using Tailwind CSS for registered accounts and active users analytics
- **Data Integration**: All analytics now display real database data instead of mock data
- **Chart Features**: Responsive design, smooth animations, proper scaling, and time-series data visualization
- **Zalo OAuth Integration**: Successfully resolved -14003 "Invalid redirect uri" error by implementing direct route override in main routes.ts, forcing production callback URL to use server endpoint `/api/auth/zalo/callback` instead of client route

## External Dependencies

- **AI Providers**: OpenAI, Claude, Gemini APIs
- **Social Platforms**: Facebook, Twitter, LinkedIn APIs
- **Email Service**: SendGrid or SMTP providers
- **Content Management**: WordPress API
- **Image Generation**: External webhook service for image generation.
- **NPM Dependencies (Core)**: React, Express, TypeScript, Drizzle ORM, Radix UI, TailwindCSS, Lucide icons, Date-fns, Zod, React Query, Passport.js, bcrypt, Vite, ESBuild.
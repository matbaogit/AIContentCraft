import type { Request, Response, NextFunction } from "express";
import { isDatabaseConnected } from "@db";

// Middleware to check database connection before processing requests
export function checkDatabaseConnection(req: Request, res: Response, next: NextFunction) {
  // Skip database check for static files and health checks
  if (req.path.startsWith('/api/health') || 
      req.path.startsWith('/public') || 
      req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
    return next();
  }

  // For API routes, check if database is connected
  if (req.path.startsWith('/api/') && !isDatabaseConnected()) {
    console.warn(`Database not connected, rejecting request to ${req.path}`);
    return res.status(503).json({
      success: false,
      error: "Database temporarily unavailable. Please try again in a few moments.",
      code: "DATABASE_UNAVAILABLE"
    });
  }

  next();
}

// Enhanced error handler specifically for database errors
export function handleDatabaseError(error: any, req: Request, res: Response, next: NextFunction) {
  // Check if it's a database connection error
  if (error.code === 'ECONNREFUSED' || 
      error.code === 'ENOTFOUND' || 
      error.code === 'ETIMEDOUT' ||
      error.message?.includes('connect ECONNREFUSED')) {
    
    console.error(`Database connection error on ${req.path}:`, error.message);
    
    return res.status(503).json({
      success: false,
      error: "Database connection lost. Please try again in a few moments.",
      code: "DATABASE_CONNECTION_ERROR"
    });
  }

  // Check for other database-related errors
  if (error.code?.startsWith('23') || // PostgreSQL constraint violations
      error.code?.startsWith('42') || // PostgreSQL syntax errors  
      error.code?.startsWith('08')) { // PostgreSQL connection errors
    
    console.error(`Database error on ${req.path}:`, error);
    
    return res.status(500).json({
      success: false,
      error: "Database error occurred. Please try again later.",
      code: "DATABASE_ERROR"
    });
  }

  // For non-database errors, pass to the next error handler
  next(error);
}
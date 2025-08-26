import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure connection pool with more robust settings
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  max: 10, // Reduced maximum number of clients in the pool for better stability
  idleTimeoutMillis: 60000, // Increased idle timeout to 1 minute
  connectionTimeoutMillis: 15000, // Increased connection timeout to 15 seconds
  maxUses: 5000, // Reduced max uses to force connection refresh more often
  keepAlive: true, // Enable TCP keep-alive
  keepAliveInitialDelayMillis: 10000, // Initial delay for keep-alive
  allowExitOnIdle: false, // Don't allow pool to close when idle
});

// Add error handling for the connection pool
pool.on("error", (err) => {
  console.error("Unexpected error on PostgreSQL client:", err);
  isDbConnected = false;
  // Attempt to reconnect after an error
  setTimeout(() => {
    console.log("Attempting to reconnect to database after error...");
    connectWithRetry();
  }, 5000);
});

// Add connection event handlers
pool.on("connect", () => {
  console.log("New client connected to the database");
  isDbConnected = true;
});

pool.on("remove", () => {
  console.log("Client removed from pool");
});

// Test the database connection with a timeout
let isDbConnected = false;

const connectWithRetry = async (maxRetries = 10, retryDelay = 3000) => {
  let retries = 0;
  const maxRetryDelay = 30000; // Max 30 seconds between retries

  while (retries < maxRetries) {
    try {
      const client = await pool.connect();
      console.log("Successfully connected to PostgreSQL database");
      client.release();
      isDbConnected = true;
      return;
    } catch (err) {
      retries++;
      const currentDelay = Math.min(retryDelay * Math.pow(1.5, retries - 1), maxRetryDelay);
      
      console.error(
        `Failed to connect to database (attempt ${retries}/${maxRetries}):`,
        (err as Error).message,
      );

      if (retries >= maxRetries) {
        console.warn(
          "Maximum connection retries reached. Database operations may fail until connection is restored.",
        );
        // Still continue but mark as not connected
        isDbConnected = false;
        break;
      }

      console.log(`Retrying in ${currentDelay / 1000} seconds...`);
      // Exponential backoff with jitter
      await new Promise((resolve) => setTimeout(resolve, currentDelay + Math.random() * 1000));
    }
  }
};

// Initiate connection process but don't wait for it
connectWithRetry();

// Export database client with schema
export const db = drizzle(pool, { schema });

// Utility function to check connection status
export const isDatabaseConnected = () => isDbConnected;

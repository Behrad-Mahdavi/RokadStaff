import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "./schema";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const connectionString = process.env.DATABASE_URL || "";

// Configure Neon client for optimal serverless connection
let dbInstance: any;

export function getDb() {
  if (!dbInstance) {
    if (!connectionString) {
      console.warn("DATABASE_URL is not set. Database operations will fail if called.");
    }
    const pool = new Pool({ connectionString });
    dbInstance = drizzle(pool, { schema });
  }
  return dbInstance;
}

export const db = getDb();

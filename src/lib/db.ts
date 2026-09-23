import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Force reload after schema update
const globalForPrisma = globalThis as unknown as {
  prisma_v11: PrismaClient | undefined;
};

// Standard Next.js singleton pattern
export const db =
  globalForPrisma.prisma_v11 ??
  (() => {
    // In local development, prefer DIRECT_URL (port 5432) over port 6543 pooler to prevent timeout
    const connectionString = (
      process.env.NODE_ENV === "development"
        ? (process.env.DIRECT_URL || process.env.DATABASE_URL || "")
        : (process.env.DATABASE_URL || process.env.DIRECT_URL || "")
    ).trim();

    const isLocal = connectionString.includes("localhost") || 
                    connectionString.includes("127.0.0.1") ||
                    connectionString.includes("::1");
    
    // Remote database providers (e.g. Supabase AWS) always require SSL
    const useSSL = !isLocal;

    const pool = new pg.Pool({ 
      connectionString,
      ssl: useSSL ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 10000,
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  })();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma_v11 = db;

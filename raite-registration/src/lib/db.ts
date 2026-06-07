import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Force reload after schema update
const globalForPrisma = globalThis as unknown as {
  prisma_v3: PrismaClient | undefined;
};

// Standard Next.js singleton pattern
export const db =
  globalForPrisma.prisma_v3 ??
  (() => {
    const connectionString = `${process.env.DATABASE_URL}`;
    const pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  })();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma_v3 = db;

"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
var client_1 = require("@prisma/client");
var adapter_pg_1 = require("@prisma/adapter-pg");
var pg_1 = require("pg");
// Force reload after schema update
var globalForPrisma = globalThis;
// Standard Next.js singleton pattern
exports.db = (_a = globalForPrisma.prisma_v11) !== null && _a !== void 0 ? _a : (function () {
    // In local development, prefer DIRECT_URL (port 5432) over port 6543 pooler to prevent timeout
    var connectionString = (process.env.NODE_ENV === "development"
        ? (process.env.DIRECT_URL || process.env.DATABASE_URL || "")
        : (process.env.DATABASE_URL || process.env.DIRECT_URL || "")).trim();
    var isLocal = connectionString.includes("localhost") ||
        connectionString.includes("127.0.0.1") ||
        connectionString.includes("::1");
    // Remote database providers (e.g. Supabase AWS) always require SSL
    var useSSL = !isLocal;
    var pool = new pg_1.default.Pool({
        connectionString: connectionString,
        ssl: useSSL ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 10000,
    });
    var adapter = new adapter_pg_1.PrismaPg(pool);
    return new client_1.PrismaClient({
        adapter: adapter,
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
})();
if (process.env.NODE_ENV !== "production")
    globalForPrisma.prisma_v11 = exports.db;

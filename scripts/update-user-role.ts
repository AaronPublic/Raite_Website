import dotenv from "dotenv";
dotenv.config();

// Enforce DIRECT_URL for direct connection in scripts to bypass pgBouncer limits
if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}
(process.env as any).NODE_ENV = "production";

import { Role } from "@prisma/client";

async function main() {
  // Dynamically import db to ensure the overridden environment variables are loaded first
  const { db } = await import("../src/lib/db");

  const args = process.argv.slice(2);
  const email = args[0]?.trim()?.toLowerCase();
  const targetRole = args[1]?.trim()?.toUpperCase() as Role;

  if (!email || !targetRole) {
    console.log("\nUsage:");
    console.log("  npx tsx scripts/update-user-role.ts <email> <role>");
    console.log("\nAvailable roles:");
    console.log("  ADMIN, SUB_ADMIN, FACULTY_COACH, PARTICIPANT\n");
    return;
  }

  const validRoles = ["ADMIN", "SUB_ADMIN", "FACULTY_COACH", "PARTICIPANT"];
  if (!validRoles.includes(targetRole)) {
    console.error(`\nError: Invalid role "${targetRole}". Must be one of: ${validRoles.join(", ")}\n`);
    return;
  }

  console.log(`\nSearching for user with email: "${email}"...`);
  const user = await db.user.findUnique({ where: { email } });

  if (!user) {
    console.error(`Error: User with email "${email}" not found in database.\n`);
    return;
  }

  console.log(`Found user: "${user.name || "Unnamed"}" (Current Role: ${user.role})`);
  console.log(`Updating role to: ${targetRole}...`);

  const updated = await db.user.update({
    where: { email },
    data: {
      role: targetRole,
      // Automatically approve admins/sub-admins so they get instant dashboard access
      approved: targetRole === "ADMIN" || targetRole === "SUB_ADMIN" ? true : user.approved
    }
  });

  console.log("\nSuccess! Updated User Profile:");
  console.log({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    approved: updated.approved
  });
  console.log();
}

main()
  .catch(console.error)
  .finally(async () => {
    const { db } = await import("../src/lib/db");
    await db.$disconnect();
  });

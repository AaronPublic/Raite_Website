import { loadEnvConfig } from "@next/env";

// Load environment variables FIRST
loadEnvConfig(process.cwd());

async function main() {
  // Dynamically import db and Role after env variables are loaded
  const { db } = await import("../src/lib/db");
  const { Role } = await import("@prisma/client");

  console.log("====================================================");
  console.log("   EMERGENCY DATABASE CLEANUP SCRIPT (POST-TEST)    ");
  console.log("====================================================");
  console.log("⚠️  WARNING: This will permanently delete all registration records");
  console.log("   and all user accounts registered as PARTICIPANTS. Admins and");
  console.log("   Faculty Coaches will not be affected.\n");

  try {
    // 1. Delete all registrations (competitor submissions/files)
    console.log("Deleting all registrations...");
    const deletedRegistrations = await db.registration.deleteMany({});
    console.log(`✓ Deleted ${deletedRegistrations.count} registration records.`);

    // 2. Delete all participant users
    console.log("Deleting all participant users...");
    const deletedParticipants = await db.user.deleteMany({
      where: {
        role: Role.PARTICIPANT,
      },
    });
    console.log(`✓ Deleted ${deletedParticipants.count} participant user records.`);

    console.log("\n====================================================");
    console.log("   DATABASE CLEANUP SUCCESSFUL!                      ");
    console.log("====================================================");
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  } finally {
    await db.$disconnect();
  }
}

main();

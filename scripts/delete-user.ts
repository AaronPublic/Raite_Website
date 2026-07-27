import dotenv from "dotenv";
dotenv.config();

// Enforce DIRECT_URL for direct connection in scripts to bypass pgBouncer limits
if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}
(process.env as any).NODE_ENV = "production";

async function main() {
  // Dynamically import db to ensure the overridden environment variables are loaded first
  const { db } = await import("../src/lib/db");

  const args = process.argv.slice(2);
  const email = args[0]?.trim()?.toLowerCase();

  if (!email) {
    console.log("\nUsage:");
    console.log("  npx tsx scripts/delete-user.ts <email>\n");
    return;
  }

  console.log(`\nSearching for user with email: "${email}"...`);
  const user = await db.user.findUnique({ where: { email } });

  if (!user) {
    console.error(`Error: User with email "${email}" not found in database.\n`);
    return;
  }

  console.log(`Found user: "${user.name || "Unnamed"}" (Role: ${user.role}, ID: ${user.id})`);
  console.log("Cleaning up user dependencies to avoid foreign key errors...");

  // 1. Remove sub-admin associations on events
  const eventsCount = await db.event.updateMany({
    where: { subAdminId: user.id },
    data: { subAdminId: null }
  });
  if (eventsCount.count > 0) {
    console.log(`- Cleared sub-admin role from ${eventsCount.count} event(s).`);
  }

  // 2. Remove coach associations on registrations
  const coachRegCount = await db.registration.updateMany({
    where: { coachId: user.id },
    data: { coachId: null }
  });
  if (coachRegCount.count > 0) {
    console.log(`- Cleared coach association from ${coachRegCount.count} registration(s).`);
  }

  // 3. Delete user's own event registrations
  const regCount = await db.registration.deleteMany({
    where: { userId: user.id }
  });
  if (regCount.count > 0) {
    console.log(`- Deleted ${regCount.count} registration(s) owned by the user.`);
  }

  // 4. Delete the User record
  await db.user.delete({
    where: { id: user.id }
  });

  console.log(`\nSuccess! User "${email}" has been successfully deleted from the database.\n`);
}

main()
  .catch(console.error)
  .finally(async () => {
    const { db } = await import("../src/lib/db");
    await db.$disconnect();
  });

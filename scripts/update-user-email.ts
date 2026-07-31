import { loadEnvConfig } from "@next/env";

// Load environment variables FIRST
loadEnvConfig(process.cwd());

async function main() {
  const { db } = await import("../src/lib/db");

  // Get emails from command line arguments or use defaults
  const args = process.argv.slice(2);
  const oldEmail = args[0] || "jerreckreynaldnavalta@student.laverdad.edu.ph";
  const newEmail = args[1] || "jerreckreynaldnavalta@laverdad.edu.ph";

  console.log("====================================================");
  console.log("   DATABASE USER EMAIL UPDATE SCRIPT                ");
  console.log("====================================================");
  console.log(`Target: ${oldEmail} -> ${newEmail}\n`);

  try {
    // Check if the user exists
    const user = await db.user.findUnique({
      where: { email: oldEmail },
    });

    if (!user) {
      console.log(`❌ Error: User with email "${oldEmail}" not found in the database.`);
      return;
    }

    console.log(`Found user: ${user.name || "N/A"} (Role: ${user.role}, School: "${user.school}")`);

    // Perform the update
    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        email: newEmail,
      },
    });

    console.log(`\n✓ Successfully updated user email in database!`);
    console.log(`  New Email: ${updated.email}`);
  } catch (error) {
    console.error("❌ Database update failed:", error);
  } finally {
    await db.$disconnect();
  }
}

main();

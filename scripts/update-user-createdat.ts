import dotenv from "dotenv";
dotenv.config();

// Enforce DIRECT_URL for direct connection in scripts to bypass pgBouncer limits
if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}
(process.env as any).NODE_ENV = "production";

const TARGET_EMAILS = [
  "madbuenaventura.student@ua.edu.ph",
  "fdzapata.student@ua.edu.ph",
  "mgsconcepcion.student@ua.edu.ph",
  "paghenson.student@ua.edu.ph",
].map(e => e.trim().toLowerCase());

// Set target date before July 24, 2026 (e.g. July 23, 2026, 12:00 PM PHT = 04:00 UTC)
const NEW_CREATED_AT = new Date("2026-07-23T04:00:00.000Z");

async function main() {
  const { db } = await import("../src/lib/db");

  console.log("====================================================");
  console.log("   UPDATE CREATEDAT DATES FOR EARLY BIRD BILLING   ");
  console.log("====================================================\n");
  console.log(`Target Date to set: ${NEW_CREATED_AT.toISOString()} (${NEW_CREATED_AT.toLocaleString("en-US", { timeZone: "Asia/Manila" })} PHT)\n`);

  const users = await db.user.findMany({
    where: {
      email: { in: TARGET_EMAILS }
    },
    include: {
      registrations: true
    }
  });

  console.log(`Found ${users.length} of ${TARGET_EMAILS.length} target users.\n`);

  const foundEmails = new Set(users.map(u => u.email.toLowerCase()));
  const missingEmails = TARGET_EMAILS.filter(e => !foundEmails.has(e));

  if (missingEmails.length > 0) {
    console.log("⚠️ The following emails were NOT found in the database:");
    missingEmails.forEach(e => console.log(`  - ${e}`));
    console.log();

    console.log("Searching for any partial matches for missing users in UA...");
    const partialUsers = await db.user.findMany({
      where: {
        OR: [
          { email: { contains: "maglaqui", mode: "insensitive" } },
          { name: { contains: "maglaqui", mode: "insensitive" } }
        ]
      }
    });
    console.log("Partial matches found:", partialUsers.map(u => ({ id: u.id, name: u.name, email: u.email, school: u.school, createdAt: u.createdAt })));
    console.log();
  }

  for (const user of users) {
    console.log(`Processing: ${user.name || "Unnamed"} (${user.email})`);
    console.log(`  School: ${user.school}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Current User createdAt: ${user.createdAt.toISOString()}`);

    // Update User
    await db.user.update({
      where: { id: user.id },
      data: {
        createdAt: NEW_CREATED_AT
      }
    });
    console.log(`  ✓ Updated user.createdAt -> ${NEW_CREATED_AT.toISOString()}`);

    // Update any registrations owned by user if they were created after early bird
    if (user.registrations && user.registrations.length > 0) {
      for (const reg of user.registrations) {
        if (reg.createdAt > NEW_CREATED_AT) {
          await db.registration.update({
            where: { id: reg.id },
            data: {
              createdAt: NEW_CREATED_AT
            }
          });
          console.log(`  ✓ Updated registration ${reg.id} createdAt -> ${NEW_CREATED_AT.toISOString()}`);
        }
      }
    }
    console.log();
  }

  console.log("🎉 All matching accounts have been updated successfully!");
}

main()
  .catch(console.error)
  .finally(async () => {
    const { db } = await import("../src/lib/db");
    await db.$disconnect();
  });

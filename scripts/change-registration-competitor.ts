import { loadEnvConfig } from "@next/env";
import readline from "readline";

// Load environment variables FIRST
loadEnvConfig(process.cwd());

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

async function main() {
  const { db } = await import("../src/lib/db");

  console.log("====================================================");
  console.log("   REGISTRATION COMPETITOR UPDATER                  ");
  console.log("====================================================\n");

  // Parse command line arguments if present
  const args = process.argv.slice(2);
  const argRegId = args.find(a => a.startsWith("--reg-id="))?.split("=")[1];
  const argNewCompetitorEmail = args.find(a => a.startsWith("--new-email="))?.split("=")[1];
  const argRegisteredBy = args.find(a => a.startsWith("--registered-by="))?.split("=")[1];

  let regId = argRegId || "";
  let newEmail = argNewCompetitorEmail || "";
  let registeredBy = argRegisteredBy || "";

  try {
    // If no command line args are passed, run interactively
    if (!regId || !newEmail) {
      console.log("Running in interactive mode.\n");
      
      regId = await askQuestion("Enter Registration ID to modify: ");
      regId = regId.trim();

      newEmail = await askQuestion("Enter NEW Competitor's Email: ");
      newEmail = newEmail.trim().toLowerCase();
    }

    if (!regId || !newEmail) {
      console.log("❌ Error: You must specify both a Registration ID and the NEW competitor email.");
      return;
    }

    // 1. Find the target registration
    console.log(`\nSearching for registration with ID: "${regId}"...`);
    const registration = await db.registration.findUnique({
      where: { id: regId },
      include: {
        user: true,
        event: true,
        coach: true
      }
    });

    if (!registration) {
      console.log(`❌ Error: Registration with ID "${regId}" not found.`);
      return;
    }

    // 2. Find the new competitor user
    console.log(`Searching for new competitor with email: "${newEmail}"...`);
    const newCompetitor = await db.user.findUnique({
      where: { email: newEmail }
    });

    if (!newCompetitor) {
      console.log(`❌ Error: User with email "${newEmail}" not found in database.`);
      return;
    }

    // 3. Prevent duplicate registration check (@@unique[userId, eventId] constraint)
    console.log(`Checking if "${newEmail}" is already registered for "${registration.event.title}"...`);
    const duplicateCheck = await db.registration.findUnique({
      where: {
        userId_eventId: {
          userId: newCompetitor.id,
          eventId: registration.eventId
        }
      }
    });

    if (duplicateCheck) {
      console.log(`❌ Error: This new competitor (${newEmail}) is already registered for this event (Reg ID: ${duplicateCheck.id}).`);
      console.log(`   Prisma unique constraint prohibits double registration.`);
      return;
    }

    let finalRegisteredBy = registration.registeredBy;
    if (!argNewCompetitorEmail) {
      const newRegByInput = await askQuestion(`Enter NEW 'registeredBy' value (optional, press Enter to keep "${registration.registeredBy || 'N/A'}"): `);
      if (newRegByInput.trim()) {
        finalRegisteredBy = newRegByInput.trim();
      }
    } else if (argRegisteredBy) {
      finalRegisteredBy = argRegisteredBy;
    }

    console.log("\n----------------------------------------------------");
    console.log("   MIGRATION SUMMARY");
    console.log("----------------------------------------------------");
    console.log(`Registration ID    : ${registration.id}`);
    console.log(`Event/Competition  : ${registration.event.title}`);
    console.log(`Current Competitor : ${registration.user.name || "N/A"} (${registration.user.email})`);
    console.log(`New Competitor     : ${newCompetitor.name || "N/A"} (${newCompetitor.email})`);
    console.log(`School             : ${newCompetitor.school || "N/A"}`);
    console.log(`Registered By      : ${registration.registeredBy || "N/A"} -> ${finalRegisteredBy || "N/A"}`);
    console.log("----------------------------------------------------");

    // Warning if school is changing
    if (registration.user.school !== newCompetitor.school) {
      console.log(`\n⚠️  SCHOOL CHANGE WARNING:`);
      console.log(`   Old Competitor School: "${registration.user.school}"`);
      console.log(`   New Competitor School: "${newCompetitor.school}"`);
      const proceedSchool = await askQuestion("\nThis will change the school representation of the registration. Proceed? (y/n): ");
      if (proceedSchool.toLowerCase() !== "y" && proceedSchool.toLowerCase() !== "yes") {
        console.log("Operation cancelled.");
        return;
      }
    } else {
      const confirm = await askQuestion("\nAre you sure you want to update the competitor of this registration? (y/n): ");
      if (confirm.toLowerCase() !== "y" && confirm.toLowerCase() !== "yes") {
        console.log("Operation cancelled.");
        return;
      }
    }

    // 4. Update the database record
    await db.registration.update({
      where: { id: registration.id },
      data: {
        userId: newCompetitor.id,
        registeredBy: finalRegisteredBy
      }
    });

    console.log(`\n✓ Successfully updated competitor and registeredBy!`);
    console.log(`  Registration ID: ${registration.id} is now linked to: ${newCompetitor.name || "N/A"} (${newCompetitor.email})`);

  } catch (error) {
    console.error("❌ Error running script:", error);
  } finally {
    await db.$disconnect();
    rl.close();
  }
}

main();

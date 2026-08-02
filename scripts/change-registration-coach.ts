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
  console.log("   REGISTRATION FACULTY COACH UPDATER               ");
  console.log("====================================================\n");

  // Parse command line arguments if present
  const args = process.argv.slice(2);
  const argRegId = args.find(a => a.startsWith("--reg-id="))?.split("=")[1];
  const argCompetitorEmail = args.find(a => a.startsWith("--competitor-email="))?.split("=")[1];
  const argEventTitle = args.find(a => a.startsWith("--event-title="))?.split("=")[1];
  const argCoachEmail = args.find(a => a.startsWith("--coach-email="))?.split("=")[1];

  let regId = argRegId || "";
  let competitorEmail = argCompetitorEmail || "";
  let eventTitle = argEventTitle || "";
  let coachEmail = argCoachEmail || "";

  try {
    // If no command line args are passed, run interactively
    if (!regId && (!competitorEmail || !eventTitle) && !coachEmail) {
      console.log("No arguments passed. Running in interactive mode.\n");
      
      regId = await askQuestion("Enter Registration ID (optional, press Enter to search by competitor & event): ");
      regId = regId.trim();

      if (!regId) {
        competitorEmail = await askQuestion("Enter Competitor/Team User Email: ");
        competitorEmail = competitorEmail.trim().toLowerCase();

        eventTitle = await askQuestion("Enter Event/Competition Title (or keyword): ");
        eventTitle = eventTitle.trim();
      }

      coachEmail = await askQuestion("Enter NEW Faculty Coach Email: ");
      coachEmail = coachEmail.trim().toLowerCase();
    }

    if (!regId && (!competitorEmail || !eventTitle)) {
      console.log("❌ Error: You must specify either a Registration ID or BOTH competitor email and event title.");
      return;
    }

    if (!coachEmail) {
      console.log("❌ Error: You must specify the email of the new coach.");
      return;
    }

    // 1. Find the new coach
    console.log(`\nSearching for new coach with email: "${coachEmail}"...`);
    const newCoach = await db.user.findUnique({
      where: { email: coachEmail }
    });

    if (!newCoach) {
      console.log(`❌ Error: User with email "${coachEmail}" not found in database.`);
      return;
    }

    if (newCoach.role !== "FACULTY_COACH" && newCoach.role !== "SUB_ADMIN" && newCoach.role !== "ADMIN") {
      console.log(`⚠️ Warning: User exists but has role "${newCoach.role}". (Usually coaches should have role FACULTY_COACH).`);
      const confirmRole = await askQuestion("Do you want to assign them as the coach anyway? (y/n): ");
      if (confirmRole.toLowerCase() !== "y" && confirmRole.toLowerCase() !== "yes") {
        console.log("Operation cancelled.");
        return;
      }
    }

    // 2. Find the registration
    let registration: any = null;

    if (regId) {
      console.log(`Searching for registration with ID: "${regId}"...`);
      registration = await db.registration.findUnique({
        where: { id: regId },
        include: {
          user: true,
          event: true,
          coach: true
        }
      });
    } else {
      console.log(`Searching for registration of competitor "${competitorEmail}" in event matching "${eventTitle}"...`);
      const registrations = await db.registration.findMany({
        where: {
          user: {
            email: competitorEmail
          },
          event: {
            title: {
              contains: eventTitle,
              mode: "insensitive"
            }
          }
        },
        include: {
          user: true,
          event: true,
          coach: true
        }
      });

      if (registrations.length === 0) {
        console.log("❌ Error: No matching registrations found.");
        return;
      }

      if (registrations.length > 1) {
        console.log(`\nMultiple registrations found for that user and event filter:`);
        registrations.forEach((r, idx) => {
          console.log(`[${idx}] Reg ID: ${r.id} | Event: ${r.event.title} | Team: ${r.teamName || "Individual"}`);
        });
        const selectIdxStr = await askQuestion("\nEnter index number to select: ");
        const selectIdx = parseInt(selectIdxStr);
        if (isNaN(selectIdx) || selectIdx < 0 || selectIdx >= registrations.length) {
          console.log("❌ Error: Invalid selection index.");
          return;
        }
        registration = registrations[selectIdx];
      } else {
        registration = registrations[0];
      }
    }

    if (!registration) {
      console.log("❌ Error: Target registration not found.");
      return;
    }

    console.log("\n----------------------------------------------------");
    console.log("   TARGET REGISTRATION FOUND");
    console.log("----------------------------------------------------");
    console.log(`Registration ID : ${registration.id}`);
    console.log(`Competition     : ${registration.event.title}`);
    console.log(`Competitor/Team : ${registration.teamName || registration.user.name} (${registration.user.email})`);
    console.log(`Current Coach   : ${registration.coach?.name || "N/A"} (${registration.coach?.email || "N/A"})`);
    console.log(`New Coach       : ${newCoach.name || "N/A"} (${newCoach.email})`);
    console.log("----------------------------------------------------");

    // School mismatch warning
    if (registration.user.school !== newCoach.school) {
      console.log(`\n⚠️  SCHOOL MISMATCH WARNING:`);
      console.log(`   Competitor School: "${registration.user.school}"`);
      console.log(`   New Coach School : "${newCoach.school}"`);
      const proceedMismatch = await askQuestion("\nDo you want to proceed with assigning this coach anyway? (y/n): ");
      if (proceedMismatch.toLowerCase() !== "y" && proceedMismatch.toLowerCase() !== "yes") {
        console.log("Operation cancelled.");
        return;
      }
    } else {
      const confirmUpdate = await askQuestion("\nAre you sure you want to update the coach of this registration? (y/n): ");
      if (confirmUpdate.toLowerCase() !== "y" && confirmUpdate.toLowerCase() !== "yes") {
        console.log("Operation cancelled.");
        return;
      }
    }

    // 3. Update the coachId
    await db.registration.update({
      where: { id: registration.id },
      data: {
        coachId: newCoach.id
      }
    });

    console.log(`\n✓ Successfully updated registration!`);
    console.log(`  Coach updated to: ${newCoach.name || "N/A"} (${newCoach.email})`);

  } catch (error) {
    console.error("❌ Error running script:", error);
  } finally {
    await db.$disconnect();
    rl.close();
  }
}

main();

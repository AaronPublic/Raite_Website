import { loadEnvConfig } from "@next/env";
import readline from "readline";

loadEnvConfig(process.cwd());

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

async function main() {
  const { db } = await import("@/lib/db");

  console.log("====================================================");
  console.log("   REGISTRATION SCHOOL/UNIVERSITY UPDATER          ");
  console.log("====================================================\n");

  // Parse command line arguments if present
  const args = process.argv.slice(2);
  const argRegId = args.find(a => a.startsWith("--reg-id="))?.split("=")[1];
  const argCompetitorEmail = args.find(a => a.startsWith("--competitor-email="))?.split("=")[1];
  const argEventTitle = args.find(a => a.startsWith("--event-title="))?.split("=")[1];
  const argNewSchool = args.find(a => a.startsWith("--new-school="))?.split("=")[1];

  let regId = argRegId || "";
  let competitorEmail = argCompetitorEmail || "";
  let eventTitle = argEventTitle || "";
  let newSchoolInput = argNewSchool || "";

  try {
    // If no command line args are passed, run interactively
    if (!regId && (!competitorEmail || !eventTitle) && !newSchoolInput) {
      console.log("No arguments passed. Running in interactive mode.\n");
      
      regId = await askQuestion("Enter Registration ID (optional, press Enter to search by competitor & event): ");
      regId = regId.trim();

      if (!regId) {
        competitorEmail = await askQuestion("Enter Competitor/Team User Email: ");
        competitorEmail = competitorEmail.trim().toLowerCase();

        eventTitle = await askQuestion("Enter Event/Competition Title (or keyword): ");
        eventTitle = eventTitle.trim();
      }

      newSchoolInput = await askQuestion("Enter NEW School Name or Abbreviation: ");
      newSchoolInput = newSchoolInput.trim();
    }

    if (!regId && (!competitorEmail || !eventTitle)) {
      console.log("❌ Error: You must specify either a Registration ID or BOTH competitor email and event title.");
      return;
    }

    if (!newSchoolInput) {
      console.log("❌ Error: You must specify the new school name or abbreviation.");
      return;
    }

    // 1. Fetch the new school
    console.log(`\nSearching for school: "${newSchoolInput}"...`);
    const schoolRecord = await db.school.findFirst({
      where: {
        OR: [
          { name: { equals: newSchoolInput.trim(), mode: 'insensitive' } },
          { abbreviation: { equals: newSchoolInput.trim(), mode: 'insensitive' } },
        ],
      },
    });

    if (!schoolRecord) {
      console.log(`❌ Error: School "${newSchoolInput}" not found in database.`);
      const allSchools = await db.school.findMany({ select: { name: true, abbreviation: true } });
      console.log("\nAvailable schools in database:");
      allSchools.forEach(s => console.log(`  - [${s.abbreviation}] ${s.name}`));
      return;
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

    // 3. Resolve all users that need updating (primary user + any team members)
    const usersToUpdate: { id: string; name: string | null; email: string; currentSchool: string | null; currentUniqueId: string | null; isPrimary: boolean }[] = [];
    
    // Add primary user
    usersToUpdate.push({
      id: registration.user.id,
      name: registration.user.name,
      email: registration.user.email,
      currentSchool: registration.user.school,
      currentUniqueId: registration.user.uniqueId,
      isPrimary: true
    });

    // Check members list
    const memberEmails: string[] = [];
    if (registration.members && Array.isArray(registration.members)) {
      registration.members.forEach((email: any) => {
        if (typeof email === "string" && email.trim()) {
          memberEmails.push(email.trim().toLowerCase());
        }
      });
    }

    if (memberEmails.length > 0) {
      console.log(`Checking database profiles for ${memberEmails.length} team members...`);
      const memberUsers = await db.user.findMany({
        where: {
          email: { in: memberEmails }
        }
      });

      memberUsers.forEach(m => {
        // Avoid adding primary user again if they are in the members list
        if (m.id !== registration.user.id) {
          usersToUpdate.push({
            id: m.id,
            name: m.name,
            email: m.email,
            currentSchool: m.school,
            currentUniqueId: m.uniqueId,
            isPrimary: false
          });
        }
      });
    }

    console.log("\n----------------------------------------------------");
    console.log("   MIGRATION SUMMARY");
    console.log("----------------------------------------------------");
    console.log(`Registration ID    : ${registration.id}`);
    console.log(`Event/Competition  : ${registration.event.title}`);
    console.log(`Team Name          : ${registration.teamName || "N/A"}`);
    console.log(`New Target School  : ${schoolRecord.name} (${schoolRecord.abbreviation})`);
    console.log("\nAssociated Users to Update:");
    
    usersToUpdate.forEach(u => {
      const roleStr = u.isPrimary ? "[Primary]" : "[Member] ";
      const newUniqueId = `${schoolRecord.abbreviation}-${u.id.slice(-6).toUpperCase()}`;
      console.log(`  - ${roleStr} ${u.name || "Pending Name"} (${u.email})`);
      console.log(`    School   : ${u.currentSchool || "N/A"} -> ${schoolRecord.name}`);
      console.log(`    Unique ID: ${u.currentUniqueId || "N/A"} -> ${newUniqueId}`);
    });
    console.log("----------------------------------------------------");

    const confirm = await askQuestion("\nAre you sure you want to update the school representation for this registration? (y/n): ");
    if (confirm.toLowerCase() !== "y" && confirm.toLowerCase() !== "yes") {
      console.log("Operation cancelled.");
      return;
    }

    // 4. Perform updates in a transaction
    console.log("\nUpdating database records...");
    await db.$transaction(async (tx) => {
      for (const u of usersToUpdate) {
        const newUniqueId = `${schoolRecord.abbreviation}-${u.id.slice(-6).toUpperCase()}`;
        await tx.user.update({
          where: { id: u.id },
          data: {
            school: schoolRecord.name,
            uniqueId: newUniqueId,
            category: schoolRecord.category
          }
        });
        console.log(`  ✓ Updated user: ${u.email}`);
      }
    });

    console.log(`\n✓ Successfully updated school for registration and all associated user profiles!`);

  } catch (error) {
    console.error("❌ Error running script:", error);
  } finally {
    await db.$disconnect();
    rl.close();
  }
}

main();

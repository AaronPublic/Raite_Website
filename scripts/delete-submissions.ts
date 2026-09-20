import { loadEnvConfig } from "@next/env";
import dotenv from "dotenv";
import readline from "readline";
import { google } from "googleapis";

// Load environment variables
loadEnvConfig(process.cwd());
dotenv.config();

if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

const SCOPES = ["https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/drive.file"];

function getDriveClient() {
  const clean = (val: string | undefined) => {
    if (!val) return undefined;
    let cleaned = val.trim();
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }
    if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
      cleaned = cleaned.slice(1, -1);
    }
    return cleaned.trim();
  };

  const clientEmail = clean(process.env.GOOGLE_CLIENT_EMAIL);
  const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;
  const clientId = clean(process.env.GOOGLE_CLIENT_ID);
  const clientSecret = clean(process.env.GOOGLE_CLIENT_SECRET);
  const refreshToken = clean(process.env.GOOGLE_REFRESH_TOKEN);

  if (clientId && clientSecret && refreshToken) {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    return google.drive({ version: "v3", auth: oauth2Client });
  }

  if (clientEmail && rawPrivateKey) {
    let cleanedKey = rawPrivateKey.replace(/\\n/g, "\n").trim();
    if (cleanedKey.startsWith('"') && cleanedKey.endsWith('"')) {
      cleanedKey = cleanedKey.slice(1, -1);
    }
    const base64Body = cleanedKey
      .replace("-----BEGIN PRIVATE KEY-----", "")
      .replace("-----END PRIVATE KEY-----", "")
      .replace(/\s+/g, "");

    const formattedKey = `-----BEGIN PRIVATE KEY-----\n${base64Body}\n-----END PRIVATE KEY-----\n`;

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: formattedKey,
      },
      scopes: SCOPES,
    });

    return google.drive({ version: "v3", auth });
  }

  throw new Error(
    "Google Drive API credentials not found in .env (need either GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_REFRESH_TOKEN or GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY)."
  );
}

function extractGoogleDriveFileId(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  
  // Standard file/d/ID format
  const matchFileD = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFileD && matchFileD[1]) return matchFileD[1];

  // Query parameter id=ID format
  const matchIdParam = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchIdParam && matchIdParam[1]) return matchIdParam[1];

  // Document/spreadsheet /d/ID format
  const matchDocs = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (matchDocs && matchDocs[1]) return matchDocs[1];

  return null;
}

function extractAllFileIds(entryUrl: string | null): { url: string; fileId: string | null }[] {
  if (!entryUrl || typeof entryUrl !== "string") return [];
  const results: { url: string; fileId: string | null }[] = [];

  try {
    const parsed = JSON.parse(entryUrl);
    if (typeof parsed === "object" && parsed !== null) {
      for (const [key, val] of Object.entries(parsed)) {
        if (typeof val === "string" && val.trim()) {
          results.push({
            url: `${key}: ${val}`,
            fileId: extractGoogleDriveFileId(val),
          });
        }
      }
      return results;
    }
  } catch {
    // Not JSON, single URL string
  }

  results.push({
    url: entryUrl,
    fileId: extractGoogleDriveFileId(entryUrl),
  });

  return results;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

async function main() {
  const { db } = await import("@/lib/db");

  console.log("================================================================");
  console.log("   RAITE 2026 - SUBMISSION CLEANUP UTILITY                      ");
  console.log("   (Deletes Entry/Submission Files from Drive & Resets entryUrl)");
  console.log("   * Registrations, participants, and coaches are NOT deleted * ");
  console.log("================================================================\n");

  const args = process.argv.slice(2);
  const argSchool = args.find(a => a.startsWith("--school="))?.split("=")[1];
  const argCoach = args.find(a => a.startsWith("--coach="))?.split("=")[1];
  const argRegId = args.find(a => a.startsWith("--reg-id="))?.split("=")[1];
  const argEvent = args.find(a => a.startsWith("--event="))?.split("=")[1];
  const isDryRun = args.includes("--dry-run");
  const isForce = args.includes("--force") || args.includes("-y");

  let schoolFilter = argSchool || "";
  let coachFilter = argCoach || "";
  let regIdFilter = argRegId || "";
  let eventFilter = argEvent || "";

  // Interactive menu if no arguments passed
  if (!schoolFilter && !coachFilter && !regIdFilter && !eventFilter) {
    console.log("Filter options (choose at least one filter):");
    console.log("1. Filter by School / Institution");
    console.log("2. Filter by Faculty Coach (Email)");
    console.log("3. Filter by Specific Registration ID");
    console.log("4. Filter by Competition / Event Name");
    console.log("5. Exit\n");

    const choice = (await askQuestion("Select option (1-5): ")).trim();

    if (choice === "1") {
      schoolFilter = (await askQuestion("Enter School Name or Abbreviation: ")).trim();
    } else if (choice === "2") {
      coachFilter = (await askQuestion("Enter Faculty Coach Email: ")).trim();
    } else if (choice === "3") {
      regIdFilter = (await askQuestion("Enter Registration ID: ")).trim();
    } else if (choice === "4") {
      eventFilter = (await askQuestion("Enter Event Title keyword: ")).trim();
    } else {
      console.log("Exiting.");
      rl.close();
      await db.$disconnect();
      return;
    }
  }

  // Build Prisma where filter
  const whereConditions: any[] = [
    { entryUrl: { not: null } },
    { entryUrl: { not: "" } },
  ];

  if (regIdFilter) {
    whereConditions.push({ id: regIdFilter.trim() });
  }

  if (schoolFilter) {
    // 1. Search for exact abbreviation or exact name match first
    let schoolRecord = await db.school.findFirst({
      where: {
        OR: [
          { abbreviation: { equals: schoolFilter.trim(), mode: "insensitive" } },
          { name: { equals: schoolFilter.trim(), mode: "insensitive" } },
        ],
      },
    });

    // 2. If not found, try contains match
    if (!schoolRecord) {
      schoolRecord = await db.school.findFirst({
        where: {
          name: { contains: schoolFilter.trim(), mode: "insensitive" },
        },
      });
    }

    const targetSchoolName = schoolRecord ? schoolRecord.name : schoolFilter.trim();
    whereConditions.push({
      user: {
        school: { contains: targetSchoolName, mode: "insensitive" },
      },
    });
    console.log(`Filtering for school matching: "${targetSchoolName}"...`);
  }

  if (coachFilter) {
    whereConditions.push({
      coach: {
        email: { equals: coachFilter.trim().toLowerCase(), mode: "insensitive" },
      },
    });
    console.log(`Filtering for coach email: "${coachFilter.trim()}"...`);
  }

  if (eventFilter) {
    whereConditions.push({
      event: {
        title: { contains: eventFilter.trim(), mode: "insensitive" },
      },
    });
    console.log(`Filtering for event title: "${eventFilter.trim()}"...`);
  }

  const registrations = await db.registration.findMany({
    where: { AND: whereConditions },
    include: {
      user: true,
      event: true,
      coach: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (registrations.length === 0) {
    console.log("\n⚠️ No registrations with active submissions found matching your filters.");
    rl.close();
    await db.$disconnect();
    return;
  }

  console.log(`\nFound ${registrations.length} registration(s) with submissions to delete:\n`);
  console.log("--------------------------------------------------------------------------------");

  const plan: {
    registrationId: string;
    eventTitle: string;
    school: string;
    competitor: string;
    coach: string;
    files: { url: string; fileId: string | null }[];
  }[] = [];

  let totalDriveFiles = 0;

  for (let i = 0; i < registrations.length; i++) {
    const reg = registrations[i];
    const files = extractAllFileIds(reg.entryUrl);
    const driveFilesCount = files.filter(f => f.fileId !== null).length;
    totalDriveFiles += driveFilesCount;

    plan.push({
      registrationId: reg.id,
      eventTitle: reg.event.title,
      school: reg.user.school || "N/A",
      competitor: `${reg.user.name || "N/A"} (${reg.user.email})`,
      coach: reg.coach ? `${reg.coach.name || "N/A"} (${reg.coach.email})` : (reg.registeredBy || "None"),
      files,
    });

    console.log(`[${i + 1}] Registration ID : ${reg.id}`);
    console.log(`    Competition     : ${reg.event.title}`);
    console.log(`    School          : ${reg.user.school || "N/A"}`);
    console.log(`    Team/Competitor : ${reg.teamName ? `${reg.teamName} - ` : ""}${reg.user.name || reg.user.email}`);
    console.log(`    Faculty Coach   : ${reg.coach ? `${reg.coach.name} (${reg.coach.email})` : (reg.registeredBy || "N/A")}`);
    console.log(`    Submission Link :`);
    files.forEach(f => {
      console.log(`      - ${f.url}`);
      if (f.fileId) {
        console.log(`        (Google Drive File ID: ${f.fileId})`);
      } else {
        console.log(`        (⚠️ Not a recognized Google Drive direct file link)`);
      }
    });
    console.log("--------------------------------------------------------------------------------");
  }

  console.log(`\nSummary:`);
  console.log(`  - Total Registrations Affected : ${registrations.length}`);
  console.log(`  - Total Drive Files to Delete  : ${totalDriveFiles}`);
  console.log(`  - Database action              : Set 'entryUrl' = NULL for these registrations`);
  console.log(`  - Preserved                    : Registration record, Participants, Coach, Status, Billing\n`);

  if (isDryRun) {
    console.log("🔍 Dry run complete. No files were deleted and database was not modified.");
    rl.close();
    await db.$disconnect();
    return;
  }

  if (!isForce) {
    const confirm = await askQuestion("Are you sure you want to permanently delete these submissions from Google Drive and reset entryUrl? (yes/no): ");
    if (confirm.trim().toLowerCase() !== "yes" && confirm.trim().toLowerCase() !== "y") {
      console.log("Operation cancelled.");
      rl.close();
      await db.$disconnect();
      return;
    }
  }

  console.log("\nConnecting to Google Drive...");
  let drive: any = null;
  try {
    drive = getDriveClient();
    console.log("✓ Google Drive client authenticated successfully.\n");
  } catch (driveErr: any) {
    console.error(`❌ Google Drive Authentication Failed: ${driveErr.message}`);
    const proceedDbOnly = await askQuestion("Do you want to proceed with clearing the database entryUrl WITHOUT deleting Google Drive files? (yes/no): ");
    if (proceedDbOnly.trim().toLowerCase() !== "yes" && proceedDbOnly.trim().toLowerCase() !== "y") {
      console.log("Operation cancelled.");
      rl.close();
      await db.$disconnect();
      return;
    }
  }

  console.log("Deleting submissions...\n");

  let deletedDriveFilesCount = 0;
  let resetRegistrationsCount = 0;

  for (const item of plan) {
    console.log(`Processing Registration ${item.registrationId} (${item.eventTitle})...`);

    // 1. Delete Google Drive files
    if (drive) {
      for (const file of item.files) {
        if (file.fileId) {
          try {
            await drive.files.delete({
              fileId: file.fileId,
              supportsAllDrives: true,
            });
            console.log(`  ✓ Deleted Drive file: ${file.fileId}`);
            deletedDriveFilesCount++;
          } catch (delErr: any) {
            if (delErr.code === 404 || delErr.message?.includes("notFound") || delErr.message?.includes("File not found")) {
              console.log(`  ⚠️ Drive file ${file.fileId} was already removed or not found on Drive.`);
            } else {
              console.error(`  ❌ Failed to delete Drive file ${file.fileId}: ${delErr.message}`);
            }
          }
        }
      }
    }

    // 2. Reset entryUrl in database
    try {
      await db.registration.update({
        where: { id: item.registrationId },
        data: {
          entryUrl: null,
        },
      });
      console.log(`  ✓ Database updated: entryUrl set to NULL`);
      resetRegistrationsCount++;
    } catch (dbErr: any) {
      console.error(`  ❌ Failed to update registration ${item.registrationId} in database: ${dbErr.message}`);
    }

    console.log();
  }

  console.log("================================================================");
  console.log("   CLEANUP COMPLETE                                             ");
  console.log("================================================================");
  console.log(`✓ Registrations updated in DB : ${resetRegistrationsCount} of ${plan.length}`);
  console.log(`✓ Google Drive files removed  : ${deletedDriveFilesCount} of ${totalDriveFiles}`);
  console.log("All registration records, participants, and coaches remain intact.\n");

  rl.close();
  await db.$disconnect();
}

main().catch(async (err) => {
  console.error("Fatal error:", err);
  rl.close();
  process.exit(1);
});

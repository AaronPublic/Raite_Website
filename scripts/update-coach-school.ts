import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function main() {
  const { db } = await import("@/lib/db");
  const { Role } = await import("@prisma/client");
  const args = process.argv.slice(2);
  const coachEmail = args[0];
  const newSchoolInput = args[1];
  const updateStudents = args.includes("--update-students") || args.includes("true");

  if (!coachEmail || !newSchoolInput) {
    console.log("\n========================================================");
    console.log("RAITE 2026 - Emergency Coach School Update Utility");
    console.log("========================================================");
    console.log("Usage:");
    console.log("  npx tsx scripts/update-coach-school.ts <coach-email> \"<new-school-name-or-abbr>\" [--update-students]\n");
    console.log("Examples:");
    console.log("  npx tsx scripts/update-coach-school.ts coach@university.edu \"University of the Arts\" --update-students");
    console.log("  npx tsx scripts/update-coach-school.ts coach@university.edu \"UA\"\n");
    process.exit(0);
  }

  try {
    // 1. Fetch the coach
    const coach = await db.user.findUnique({
      where: { email: coachEmail.trim().toLowerCase() },
    });

    if (!coach) {
      console.error(`\x1b[31mError: User with email "${coachEmail}" not found.\x1b[0m`);
      process.exit(1);
    }

    if (coach.role !== Role.FACULTY_COACH) {
      console.log(`\x1b[33mWarning: User "${coach.name}" is not a FACULTY_COACH (Role is ${coach.role}).\x1b[0m`);
    }

    // 2. Fetch the new school
    const schoolRecord = await db.school.findFirst({
      where: {
        OR: [
          { name: { equals: newSchoolInput.trim(), mode: 'insensitive' } },
          { abbreviation: { equals: newSchoolInput.trim(), mode: 'insensitive' } },
        ],
      },
    });

    if (!schoolRecord) {
      console.error(`\x1b[31mError: School "${newSchoolInput}" not found in database.\x1b[0m`);
      const allSchools = await db.school.findMany({ select: { name: true, abbreviation: true } });
      console.log("\nAvailable schools in database:");
      allSchools.forEach(s => console.log(`  - [${s.abbreviation}] ${s.name}`));
      process.exit(1);
    }

    const oldSchool = coach.school;
    const oldUniqueId = coach.uniqueId;

    if (oldSchool === schoolRecord.name) {
      console.log(`\x1b[33mInfo: Coach is already assigned to "${schoolRecord.name}". No changes needed.\x1b[0m`);
      process.exit(0);
    }

    // 3. Generate new Unique ID
    const newUniqueId = `${schoolRecord.abbreviation}-${coach.id.slice(-6).toUpperCase()}`;

    console.log("\nProposed Changes:");
    console.log(`- Coach Name:  ${coach.name || "N/A"}`);
    console.log(`- Coach Email: ${coach.email}`);
    console.log(`- School:      ${oldSchool || "N/A"} \u2192 ${schoolRecord.name}`);
    console.log(`- Unique ID:   ${oldUniqueId || "N/A"} \u2192 ${newUniqueId}`);

    // 4. Perform updates in a transaction
    await db.$transaction(async (tx) => {
      // Update coach
      await tx.user.update({
        where: { id: coach.id },
        data: {
          school: schoolRecord.name,
          uniqueId: newUniqueId,
        },
      });
      console.log(`\n\x1b[32m\u2713 Successfully updated coach profile and unique ID.\x1b[0m`);

      // Optionally update students
      if (updateStudents && oldSchool) {
        console.log(`\nSearching for students/competitors registered under old school "${oldSchool}"...`);
        const students = await tx.user.findMany({
          where: {
            school: oldSchool,
            role: Role.PARTICIPANT,
          },
        });

        if (students.length === 0) {
          console.log("No registered students found under the old school.");
        } else {
          console.log(`Found ${students.length} students. Regenerating IDs...`);
          for (const student of students) {
            const studentNewUniqueId = `${schoolRecord.abbreviation}-${student.id.slice(-6).toUpperCase()}`;
            await tx.user.update({
              where: { id: student.id },
              data: {
                school: schoolRecord.name,
                uniqueId: studentNewUniqueId,
              },
            });
            console.log(`  - Updated ${student.name || student.email}: ${student.uniqueId} \u2192 ${studentNewUniqueId}`);
          }
          console.log(`\x1b[32m\u2713 Successfully migrated ${students.length} students/competitors to the new school.\x1b[0m`);
        }
      }
    });

  } catch (error) {
    console.error("An error occurred during regeneration:", error);
  } finally {
    await db.$disconnect();
  }
}

main();

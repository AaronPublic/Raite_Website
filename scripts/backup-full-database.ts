import { loadEnvConfig } from "@next/env";
import * as fs from "fs";
import * as path from "path";

// Load environment variables
loadEnvConfig(process.cwd());

async function main() {
  const { db } = await import("../src/lib/db");

  console.log("================================================================================");
  console.log("              RAITE 2026 - COMPLETE DATABASE BACKUP UTILITY                    ");
  console.log("================================================================================\n");

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(process.cwd(), "backups", `raite_2026_backup_${timestamp}`);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  try {
    console.log(`📁 Backup Destination: ${backupDir}\n`);

    // 1. Fetch data from all models
    console.log("⏳ Fetching database tables...");

    const [
      schools,
      users,
      events,
      registrations,
      judgeAssignments,
      scores,
      announcements,
      systemSettings,
      leaderboardEntries,
      competitionWinners,
      eventPlacements,
      specialAwards,
    ] = await Promise.all([
      db.school.findMany({ orderBy: { name: "asc" } }),
      db.user.findMany({ orderBy: { createdAt: "asc" } }),
      db.event.findMany({ orderBy: { createdAt: "asc" } }),
      db.registration.findMany({
        include: {
          user: { select: { id: true, name: true, email: true, school: true } },
          coach: { select: { id: true, name: true, email: true, school: true } },
          event: { select: { id: true, title: true, category: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      db.judgeAssignment.findMany({
        include: {
          judge: { select: { id: true, name: true, email: true } },
          event: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      db.score.findMany({
        include: {
          judge: { select: { id: true, name: true, email: true } },
          registration: {
            select: {
              id: true,
              teamName: true,
              userId: true,
              eventId: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      db.announcement.findMany({ orderBy: { createdAt: "asc" } }),
      db.systemSetting.findMany({ orderBy: { key: "asc" } }),
      db.leaderboardEntry.findMany({ orderBy: { place: "asc" } }),
      db.competitionWinner.findMany({ orderBy: { competitionName: "asc" } }),
      db.eventPlacement.findMany({
        include: { event: { select: { id: true, title: true } } },
        orderBy: { createdAt: "asc" },
      }),
      db.specialAward.findMany({ orderBy: { category: "asc" } }),
    ]);

    const backupData = {
      meta: {
        exportedAt: new Date().toISOString(),
        environment: process.env.NODE_ENV || "production",
        totalTables: 12,
        counts: {
          schools: schools.length,
          users: users.length,
          events: events.length,
          registrations: registrations.length,
          judgeAssignments: judgeAssignments.length,
          scores: scores.length,
          announcements: announcements.length,
          systemSettings: systemSettings.length,
          leaderboardEntries: leaderboardEntries.length,
          competitionWinners: competitionWinners.length,
          eventPlacements: eventPlacements.length,
          specialAwards: specialAwards.length,
        },
      },
      schools,
      users,
      events,
      registrations,
      judgeAssignments,
      scores,
      announcements,
      systemSettings,
      leaderboardEntries,
      competitionWinners,
      eventPlacements,
      specialAwards,
    };

    // 2. Write individual table JSON files
    fs.writeFileSync(path.join(backupDir, "schools.json"), JSON.stringify(schools, null, 2), "utf8");
    fs.writeFileSync(path.join(backupDir, "users.json"), JSON.stringify(users, null, 2), "utf8");
    fs.writeFileSync(path.join(backupDir, "events.json"), JSON.stringify(events, null, 2), "utf8");
    fs.writeFileSync(path.join(backupDir, "registrations.json"), JSON.stringify(registrations, null, 2), "utf8");
    fs.writeFileSync(path.join(backupDir, "judge_assignments.json"), JSON.stringify(judgeAssignments, null, 2), "utf8");
    fs.writeFileSync(path.join(backupDir, "scores.json"), JSON.stringify(scores, null, 2), "utf8");
    fs.writeFileSync(path.join(backupDir, "announcements.json"), JSON.stringify(announcements, null, 2), "utf8");
    fs.writeFileSync(path.join(backupDir, "system_settings.json"), JSON.stringify(systemSettings, null, 2), "utf8");
    fs.writeFileSync(path.join(backupDir, "leaderboard_entries.json"), JSON.stringify(leaderboardEntries, null, 2), "utf8");
    fs.writeFileSync(path.join(backupDir, "competition_winners.json"), JSON.stringify(competitionWinners, null, 2), "utf8");
    fs.writeFileSync(path.join(backupDir, "event_placements.json"), JSON.stringify(eventPlacements, null, 2), "utf8");
    fs.writeFileSync(path.join(backupDir, "special_awards.json"), JSON.stringify(specialAwards, null, 2), "utf8");

    // 3. Write consolidated full snapshot JSON file
    fs.writeFileSync(path.join(backupDir, "raite_full_snapshot.json"), JSON.stringify(backupData, null, 2), "utf8");

    // 4. Print Summary
    console.log("✅ Backup successfully created!");
    console.log("--------------------------------------------------------------------------------");
    console.log(`📊 Summary of Exported Records:`);
    console.log(` - Schools:               ${schools.length}`);
    console.log(` - Users / Accounts:      ${users.length}`);
    console.log(` - Events:                ${events.length}`);
    console.log(` - Registrations:         ${registrations.length}`);
    console.log(` - Judge Assignments:     ${judgeAssignments.length}`);
    console.log(` - Scores Given:          ${scores.length}`);
    console.log(` - Announcements:         ${announcements.length}`);
    console.log(` - System Settings:       ${systemSettings.length}`);
    console.log(` - Leaderboard Entries:   ${leaderboardEntries.length}`);
    console.log(` - Competition Winners:   ${competitionWinners.length}`);
    console.log(` - Event Placements:      ${eventPlacements.length}`);
    console.log(` - Special Awards:        ${specialAwards.length}`);
    console.log("--------------------------------------------------------------------------------");
    console.log(`💾 All files saved to: ${backupDir}`);
    console.log("================================================================================\n");

  } catch (error) {
    console.error("❌ Backup failed:", error);
  } finally {
    await db.$disconnect();
  }
}

main();

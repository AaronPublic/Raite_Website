"use server";

import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/data/users";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface TabulationEventInfo {
  id: string;
  title: string;
  category: string | null;
  subcategory: string | null;
  participatingSchools: string[];
  placement: {
    championSchool: string | null;
    firstRunnerUp: string | null;
    secondRunnerUp: string | null;
  } | null;
}

export interface SchoolTabulationRow {
  schoolName: string;
  schoolAbbr: string;
  eventScores: Record<string, { points: number; label: "Champion" | "1st Runner Up" | "2nd Runner Up" | "Participation" | "None" }>;
  totalPoints: number;
  championsCount: number;
  firstRunnerUpCount: number;
  secondRunnerUpCount: number;
  participationCount: number;
  rank: number;
}

export interface SpecialAwardEntry {
  id?: string;
  category: string;
  awardTitle: string;
  awardType: "INDIVIDUAL" | "SCHOOL";
  winnerName: string;
  schoolName: string;
}

export interface ParticipantOption {
  id: string;
  name: string;
  school: string;
  teamName: string;
  eventTitle: string;
}

export async function getTabulationData() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await getUserByClerkId(userId);
    if (!user || user.role !== "ADMIN") {
      throw new Error("Forbidden: Admin access required");
    }

    // 1. Fetch all events
    const events = await db.event.findMany({
      orderBy: [{ subcategory: "asc" }, { title: "asc" }],
      include: {
        placement: true,
      },
    });

    // 2. Fetch all registered schools
    const registeredSchools = await db.school.findMany({
      orderBy: { name: "asc" },
    });

    // 3. Fetch all registrations to determine participation and participant options
    const registrations = await db.registration.findMany({
      where: {
        status: { not: "REJECTED" },
      },
      include: {
        user: true,
        event: true,
      },
    });

    // Map schools by event
    const eventSchoolsMap: Record<string, Set<string>> = {};
    const allKnownSchoolNames = new Set<string>();

    registeredSchools.forEach((s) => allKnownSchoolNames.add(s.name));

    // Also collect participant list for individual awards
    const participantsList: ParticipantOption[] = [];

    registrations.forEach((reg) => {
      const school = reg.user.school;
      if (school) {
        allKnownSchoolNames.add(school);
        if (!eventSchoolsMap[reg.eventId]) {
          eventSchoolsMap[reg.eventId] = new Set<string>();
        }
        eventSchoolsMap[reg.eventId].add(school);
      }

      // Collect team members if any, or primary registrant
      const teamName = reg.teamName || "Individual";
      if (reg.members && Array.isArray(reg.members)) {
        reg.members.forEach((m: any) => {
          if (m && typeof m === "object" && (m.name || m.fullName)) {
            participantsList.push({
              id: `${reg.id}-${m.name || m.fullName}`,
              name: m.name || m.fullName,
              school: school || "N/A",
              teamName,
              eventTitle: reg.event.title,
            });
          }
        });
      }

      if (reg.user.name) {
        participantsList.push({
          id: `${reg.id}-${reg.user.name}`,
          name: reg.user.name,
          school: school || "N/A",
          teamName,
          eventTitle: reg.event.title,
        });
      }
    });

    // Format events info
    const formattedEvents: TabulationEventInfo[] = events.map((ev) => {
      const participating = Array.from(eventSchoolsMap[ev.id] || []).sort();
      return {
        id: ev.id,
        title: ev.title,
        category: ev.category,
        subcategory: ev.subcategory,
        participatingSchools: participating,
        placement: ev.placement
          ? {
              championSchool: ev.placement.championSchool,
              firstRunnerUp: ev.placement.firstRunnerUp,
              secondRunnerUp: ev.placement.secondRunnerUp,
            }
          : null,
      };
    });

    // Build abbreviation map
    const schoolAbbrMap: Record<string, string> = {};
    registeredSchools.forEach((s) => {
      schoolAbbrMap[s.name] = s.abbreviation;
    });

    // 4. Calculate tabulation rows for all schools
    const schoolRows: SchoolTabulationRow[] = Array.from(allKnownSchoolNames).map((schoolName) => {
      const eventScores: SchoolTabulationRow["eventScores"] = {};
      let totalPoints = 0;
      let championsCount = 0;
      let firstRunnerUpCount = 0;
      let secondRunnerUpCount = 0;
      let participationCount = 0;

      formattedEvents.forEach((ev) => {
        const participated = eventSchoolsMap[ev.id]?.has(schoolName);
        const placement = ev.placement;

        if (placement?.championSchool === schoolName) {
          eventScores[ev.id] = { points: 10, label: "Champion" };
          totalPoints += 10;
          championsCount++;
        } else if (placement?.firstRunnerUp === schoolName) {
          eventScores[ev.id] = { points: 7, label: "1st Runner Up" };
          totalPoints += 7;
          firstRunnerUpCount++;
        } else if (placement?.secondRunnerUp === schoolName) {
          eventScores[ev.id] = { points: 4, label: "2nd Runner Up" };
          totalPoints += 4;
          secondRunnerUpCount++;
        } else if (participated) {
          eventScores[ev.id] = { points: 1, label: "Participation" };
          totalPoints += 1;
          participationCount++;
        } else {
          eventScores[ev.id] = { points: 0, label: "None" };
        }
      });

      return {
        schoolName,
        schoolAbbr: schoolAbbrMap[schoolName] || schoolName,
        eventScores,
        totalPoints,
        championsCount,
        firstRunnerUpCount,
        secondRunnerUpCount,
        participationCount,
        rank: 0,
      };
    });

    // Sort by Total Points descending, Champion count descending, 1st Runner Up count descending
    schoolRows.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.championsCount !== a.championsCount) return b.championsCount - a.championsCount;
      if (b.firstRunnerUpCount !== a.firstRunnerUpCount) return b.firstRunnerUpCount - a.firstRunnerUpCount;
      if (b.secondRunnerUpCount !== a.secondRunnerUpCount) return b.secondRunnerUpCount - a.secondRunnerUpCount;
      return a.schoolName.localeCompare(b.schoolName);
    });

    // Assign dense ranks
    let currentRank = 1;
    schoolRows.forEach((row, idx) => {
      if (idx > 0) {
        const prev = schoolRows[idx - 1];
        if (
          row.totalPoints === prev.totalPoints &&
          row.championsCount === prev.championsCount &&
          row.firstRunnerUpCount === prev.firstRunnerUpCount &&
          row.secondRunnerUpCount === prev.secondRunnerUpCount
        ) {
          row.rank = prev.rank;
        } else {
          row.rank = idx + 1;
        }
      } else {
        row.rank = 1;
      }
    });

    // 5. Fetch Special Awards
    const rawSpecialAwards = await db.specialAward.findMany({
      orderBy: [{ category: "asc" }, { awardTitle: "asc" }],
    });

    const specialAwards: SpecialAwardEntry[] = rawSpecialAwards.map((a) => ({
      id: a.id,
      category: a.category,
      awardTitle: a.awardTitle,
      awardType: (a.awardType === "SCHOOL" ? "SCHOOL" : "INDIVIDUAL") as "INDIVIDUAL" | "SCHOOL",
      winnerName: a.winnerName,
      schoolName: a.schoolName,
    }));

    return {
      events: formattedEvents,
      schools: Array.from(allKnownSchoolNames).sort(),
      registeredSchools,
      leaderboard: schoolRows,
      specialAwards,
      participantsList,
    };
  } catch (error: any) {
    console.error("getTabulationData error:", error);
    throw new Error(error.message || "Failed to load tabulation data");
  }
}

export async function saveEventPlacements(
  placements: Array<{
    eventId: string;
    championSchool: string | null;
    firstRunnerUp: string | null;
    secondRunnerUp: string | null;
  }>
) {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Unauthorized" };

    const user = await getUserByClerkId(userId);
    if (!user || user.role !== "ADMIN") {
      return { error: "Forbidden: Admin access required" };
    }

    // Upsert each placement
    for (const p of placements) {
      await db.eventPlacement.upsert({
        where: { eventId: p.eventId },
        update: {
          championSchool: p.championSchool || null,
          firstRunnerUp: p.firstRunnerUp || null,
          secondRunnerUp: p.secondRunnerUp || null,
        },
        create: {
          eventId: p.eventId,
          championSchool: p.championSchool || null,
          firstRunnerUp: p.firstRunnerUp || null,
          secondRunnerUp: p.secondRunnerUp || null,
        },
      });
    }

    revalidatePath("/admin/tabulation");
    revalidatePath("/admin/scores");
    revalidatePath("/admin/ranking");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    console.error("saveEventPlacements error:", error);
    return { error: error.message || "Failed to save competition placements" };
  }
}

export async function saveSpecialAwards(
  awards: Array<{
    awardTitle: string;
    category: string;
    awardType: "INDIVIDUAL" | "SCHOOL";
    winnerName: string;
    schoolName: string;
  }>
) {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Unauthorized" };

    const user = await getUserByClerkId(userId);
    if (!user || user.role !== "ADMIN") {
      return { error: "Forbidden: Admin access required" };
    }

    for (const award of awards) {
      await db.specialAward.upsert({
        where: { awardTitle: award.awardTitle },
        update: {
          category: award.category,
          awardType: award.awardType,
          winnerName: award.winnerName || "",
          schoolName: award.schoolName || "",
        },
        create: {
          awardTitle: award.awardTitle,
          category: award.category,
          awardType: award.awardType,
          winnerName: award.winnerName || "",
          schoolName: award.schoolName || "",
        },
      });
    }

    revalidatePath("/admin/tabulation");
    revalidatePath("/admin/scores");
    revalidatePath("/admin/ranking");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    console.error("saveSpecialAwards error:", error);
    return { error: error.message || "Failed to save special awards" };
  }
}

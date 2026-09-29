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
  email?: string;
  school: string;
  teamName: string;
  eventId: string;
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

    // 1. Fetch all data in parallel for optimal latency
    const [events, registeredSchools, registrations, rawSpecialAwards] = await Promise.all([
      db.event.findMany({
        orderBy: [{ subcategory: "asc" }, { title: "asc" }],
        select: {
          id: true,
          title: true,
          category: true,
          subcategory: true,
          placement: {
            select: {
              championSchool: true,
              firstRunnerUp: true,
              secondRunnerUp: true,
            },
          },
        },
      }),
      db.school.findMany({
        select: { id: true, name: true, abbreviation: true },
        orderBy: { name: "asc" },
      }),
      db.registration.findMany({
        where: {
          status: { not: "REJECTED" },
        },
        select: {
          id: true,
          eventId: true,
          teamName: true,
          members: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              school: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      db.specialAward.findMany({
        orderBy: [{ category: "asc" }, { awardTitle: "asc" }],
      }),
    ]);

    // Gather all member emails from team registrations to resolve their full names in a single batch
    const allMemberEmails = new Set<string>();
    registrations.forEach((r) => {
      if (r.members && Array.isArray(r.members)) {
        r.members.forEach((m: any) => {
          if (typeof m === "string" && m.includes("@")) {
            allMemberEmails.add(m.trim().toLowerCase());
          } else if (m && typeof m === "object" && m.email) {
            allMemberEmails.add(String(m.email).trim().toLowerCase());
          }
        });
      }
    });

    const memberUsers = allMemberEmails.size > 0
      ? await db.user.findMany({
          where: {
            email: { in: Array.from(allMemberEmails) },
          },
          select: { id: true, name: true, email: true, school: true },
        })
      : [];

    const memberUserMap = new Map<string, { id: string; name: string | null; email: string; school: string | null }>();
    memberUsers.forEach((u) => memberUserMap.set(u.email.toLowerCase(), u));

    // Map schools by event
    const eventSchoolsMap: Record<string, Set<string>> = {};
    const allKnownSchoolNames = new Set<string>();

    registeredSchools.forEach((s) => allKnownSchoolNames.add(s.name));

    // Also collect participant list for individual awards
    const participantsList: ParticipantOption[] = [];

    registrations.forEach((reg) => {
      const school = reg.user.school || "N/A";
      if (reg.user.school) {
        allKnownSchoolNames.add(reg.user.school);
        if (!eventSchoolsMap[reg.eventId]) {
          eventSchoolsMap[reg.eventId] = new Set<string>();
        }
        eventSchoolsMap[reg.eventId].add(reg.user.school);
      }

      const teamName = reg.teamName || "Individual";

      // 1. Primary Registrant
      if (reg.user.name) {
        participantsList.push({
          id: `${reg.id}-${reg.user.id}`,
          name: reg.user.name,
          email: reg.user.email,
          school,
          teamName,
          eventId: reg.eventId,
          eventTitle: reg.event.title,
        });
      }

      // 2. Team Members
      if (reg.members && Array.isArray(reg.members)) {
        reg.members.forEach((m: any, mIdx: number) => {
          if (typeof m === "string" && m.includes("@")) {
            const resolvedUser = memberUserMap.get(m.trim().toLowerCase());
            const memberName = resolvedUser?.name || m.split("@")[0];
            const memberSchool = resolvedUser?.school || school;

            participantsList.push({
              id: `${reg.id}-mem-${mIdx}-${m}`,
              name: memberName,
              email: m,
              school: memberSchool,
              teamName,
              eventId: reg.eventId,
              eventTitle: reg.event.title,
            });
          } else if (m && typeof m === "object" && (m.name || m.fullName || m.email)) {
            const memberName = m.name || m.fullName || m.email;
            participantsList.push({
              id: `${reg.id}-mem-${mIdx}`,
              name: memberName,
              email: m.email,
              school: m.school || school,
              teamName,
              eventId: reg.eventId,
              eventTitle: reg.event.title,
            });
          }
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

    // 5. Map Special Awards with strict type safety
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

import { db } from "@/lib/db";
import { RegistrationStatus } from "@prisma/client";

export async function getDashboardStats() {
  const [participantsCount, teamCount, activeCompetitionsCount] = await Promise.all([
    db.user.count({ where: { role: "PARTICIPANT" } }),
    db.registration.count({ where: { teamName: { not: null } } }),
    db.event.count({ where: { status: "UPCOMING" } }),
  ]);

  return {
    participantsCount,
    teamCount,
    activeCompetitionsCount,
  };
}

export async function getRegistrationsPerCompetition() {
  const events = await db.event.findMany({
    select: {
      title: true,
      _count: {
        select: { registrations: true },
      },
    },
  });

  return events.map((e) => ({
    name: e.title,
    count: e._count.registrations,
  }));
}

export async function getRegistrationsByCourse() {
  const users = await db.user.groupBy({
    by: ["course"],
    _count: {
      id: true,
    },
    where: {
      course: { not: null },
      role: "PARTICIPANT",
    },
  });

  return users.map((u) => ({
    name: u.course as string,
    count: u._count.id,
  }));
}

export async function getRegistrationTrends() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const registrations = await db.registration.findMany({
    where: {
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Aggregation logic for daily counts
  const dailyCounts: Record<string, number> = {};
  registrations.forEach((reg) => {
    const date = reg.createdAt.toISOString().split("T")[0];
    dailyCounts[date] = (dailyCounts[date] || 0) + 1;
  });

  return Object.entries(dailyCounts).map(([date, count]) => ({
    date,
    count,
  }));
}

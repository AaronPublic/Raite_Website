"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

async function checkAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user || user.role !== "ADMIN") throw new Error("Forbidden");
  return user;
}

export async function getCompetitionRegistrations(eventId: string) {
  await checkAdmin();

  const registrations = await db.registration.findMany({
    where: { eventId },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return registrations.map((r) => ({
    name: r.user.name || "N/A",
    email: r.user.email,
    school: r.user.school || "N/A",
    teamName: r.teamName || "Individual",
    status: r.status,
    date: r.createdAt.toLocaleDateString(),
  }));
}

export async function getDemographicsReport() {
  await checkAdmin();

  const [schoolData, yearData] = await Promise.all([
    db.user.groupBy({
      by: ["school"],
      _count: { id: true },
      where: { role: "PARTICIPANT", school: { not: null } },
    }),
    db.user.groupBy({
      by: ["yearLevel"],
      _count: { id: true },
      where: { role: "PARTICIPANT", yearLevel: { not: null } },
    }),
  ]);

  return {
    schools: schoolData.map((d) => ({ name: d.school as string, count: d._count.id })),
    years: yearData.map((d) => ({ name: d.yearLevel as string, count: d._count.id })),
  };
}

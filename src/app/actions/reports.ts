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
      coach: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Extract all emails from all registrations to fetch names and IDs in one go
  const allMemberEmails = new Set<string>();
  registrations.forEach(r => {
    if (Array.isArray(r.members)) {
      (r.members as string[]).forEach(email => allMemberEmails.add(email));
    }
  });

  // Fetch names and uniqueIds for all these emails
  const users = await db.user.findMany({
    where: {
      email: { in: Array.from(allMemberEmails) }
    },
    select: {
      email: true,
      name: true,
      uniqueId: true
    }
  });

  const emailToInfo = new Map(users.map(u => [
    u.email, 
    { name: u.name || u.email, id: u.uniqueId || "N/A" }
  ]));

  return registrations.map((r) => {
    let membersList = "Individual";
    let fullTeamDetails = "Individual";

    if (Array.isArray(r.members)) {
      const memberInfos = (r.members as string[]).map(email => 
        emailToInfo.get(email) || { name: email, id: "N/A" }
      );
      
      const names = memberInfos.map(info => info.name);
      
      // Truncated for UI
      if (names.length > 2) {
        membersList = `${names.slice(0, 2).join(", ")} ...`;
      } else {
        membersList = names.join(", ");
      }

      // Full details for PDF/CSV exports
      fullTeamDetails = memberInfos.map(info => `${info.name} [${info.id}]`).join(", ");
    }

    return {
      name: r.user.name || "N/A",
      email: r.user.email,
      school: r.user.school || "N/A",
      teamName: r.teamName || "Individual",
      teamMembers: membersList,
      fullTeamDetails: fullTeamDetails,
      coachName: r.coach?.name || "N/A",
      coachEmail: r.coach?.email || "N/A",
      status: r.status,
      date: r.createdAt.toLocaleDateString(),
    };
  });
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

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

async function checkSubAdmin(eventId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user || user.role !== "SUB_ADMIN") throw new Error("Forbidden");
  
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event || event.subAdminId !== user.id) throw new Error("Unauthorized to access this report");
  
  return user;
}

export async function getSubAdminExportData(eventId: string) {
  const user = await checkSubAdmin(eventId);
  
  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { title: true }
  });

  if (!event) throw new Error("Event not found");

  const registrations = await db.registration.findMany({
    where: { eventId },
    include: {
      user: { select: { name: true, email: true, school: true } },
      coach: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Extract all emails from all registrations to fetch names and IDs in one go
  const allMemberEmails = new Set<string>();
  registrations.forEach(r => {
    if (Array.isArray(r.members)) {
      (r.members as string[]).forEach(email => allMemberEmails.add(email));
    } else if (typeof r.requirements === 'object' && r.requirements !== null) {
      // Fallback for older data format or different structure
      const reqs = r.requirements as any;
      const participants = reqs.participants || reqs.members || [];
      participants.forEach((p: any) => {
        const email = typeof p === 'string' ? p : p.email;
        if (email) allMemberEmails.add(email);
      });
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
      uniqueId: true,
      shirtSize: true
    }
  });

  const emailToInfo = new Map<string, { name: string, id: string, shirtSize: string }>(users.map(u => [
    u.email, 
    { name: u.name || u.email, id: u.uniqueId || "N/A", shirtSize: u.shirtSize || "N/A" }
  ]));

  const formattedRegistrations = registrations.map((r) => {
    let memberDetails: { name: string, email: string, id: string, shirtSize: string }[] = [];

    if (Array.isArray(r.members)) {
      memberDetails = (r.members as string[]).map(email => {
        const info = emailToInfo.get(email);
        return {
          name: info?.name || email,
          email: email,
          id: info?.id || "N/A",
          shirtSize: info?.shirtSize || "N/A"
        };
      });
    }

    return {
      id: r.id,
      school: r.user.school || "N/A",
      coachName: r.coach?.name || r.registeredBy || "N/A",
      coachEmail: r.coach?.email || "N/A",
      members: memberDetails,
      date: r.createdAt.toLocaleDateString(),
    };
  });

  return {
    eventTitle: event.title,
    registrations: formattedRegistrations
  };
}

export async function getSubAdminCompetitionRegistrations(eventId: string) {
  await checkSubAdmin(eventId);

  const registrations = await db.registration.findMany({
    where: { eventId },
    include: {
      user: { select: { name: true, email: true, school: true } },
      coach: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return registrations.map((r) => {
    // Requirements might be a string (JSON) or an object
    const reqs = typeof r.requirements === 'string' ? JSON.parse(r.requirements) : r.requirements;
    const participants = reqs?.participants || [];
    
    return {
      school: r.user.school || "N/A",
      coachName: r.coach?.name || r.registeredBy || "N/A",
      coachEmail: r.coach?.email || "N/A",
      competitors: participants.map((p: any) => typeof p === 'string' ? p : (p.name || "N/A")).join(", "),
    };
  });
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

  const emailToInfo = new Map<string, { name: string, id: string }>(users.map(u => [
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
      coachName: r.coach?.name || r.registeredBy || "N/A",
      coachEmail: r.coach?.email || "N/A",
      status: r.status,
      date: r.createdAt.toLocaleDateString(),
    };
  });
}

export async function getRegistrationDetails(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("Forbidden");

  const registration = await db.registration.findUnique({
    where: { id },
    include: {
      user: true,
      event: true,
      coach: true,
    },
  });

  if (!registration) throw new Error("Registration not found");

  // Fetch member details
  let memberDetails: { name: string, email: string, id: string, shirtSize: string }[] = [];
  if (Array.isArray(registration.members)) {
    const emails = registration.members as string[];
    const members = await db.user.findMany({
      where: { email: { in: emails } },
      select: { name: true, email: true, uniqueId: true, shirtSize: true }
    });
    
    memberDetails = emails.map(email => {
      const m = members.find(u => u.email === email);
      return {
        name: m?.name || email,
        email: email,
        id: m?.uniqueId || "N/A",
        shirtSize: m?.shirtSize || "N/A"
      };
    });
  }

  return {
    ...registration,
    memberDetails
  };
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

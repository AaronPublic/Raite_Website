"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { resend } from "@/lib/email";
import RegistrationConfirmationEmail from "@/emails/RegistrationConfirmation";

const registrationSchema = z.object({
  eventId: z.string().min(1),
  teamName: z.string().optional(),
  members: z.array(z.string().email()),
  requirements: z.record(z.string(), z.string().url()),
});

export async function checkRegistrationExists(eventId: string) {
  const { userId } = await auth();
  if (!userId) return false;

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return false;

  const existing = await db.registration.findUnique({
    where: {
      userId_eventId: {
        userId: user.id,
        eventId: eventId,
      },
    },
  });

  return !!existing && existing.status !== "REJECTED";
}

export async function isUserInOtherTeam(eventId: string, email: string) {
  // Check if a user with this email is already a member of any team for this event
  // members is stored as a JSON array of emails
  const registrations = await db.registration.findMany({
    where: {
      eventId: eventId,
      status: { notIn: ["REJECTED"] },
    },
  });

  return registrations.some((reg) => {
    const members = reg.members as string[];
    return members.includes(email);
  });
}

export async function validateParticipantLimits(eventId: string, emails: string[]) {
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Event not found");

  const allRegistrations = await db.registration.findMany({
    where: {
      status: { notIn: ["REJECTED"] },
    },
    include: { event: true },
  });

  for (const email of emails) {
    const participant = await db.user.findUnique({ where: { email } });
    if (!participant) continue;

    const existingRegistrations = allRegistrations.filter(reg => {
      const members = reg.members as string[];
      return members.includes(email);
    });

    // 1. If trying to register for EGAMES, cannot have ANY existing registration
    if (event.subcategory === "EGAMES") {
      if (existingRegistrations.length > 0) {
        return { error: `Participant ${participant.name} is already registered for another event and cannot join an E-GAMES competition.` };
      }
    }

    // 2. If registering for another event, check limits
    for (const reg of existingRegistrations) {
      if (reg.event.subcategory === "EGAMES") {
        return { error: `Participant ${participant.name} is already registered for an E-GAMES competition and cannot join another event.` };
      }
    }

    const onlineCount = existingRegistrations.filter(r => r.event.subcategory === "ONLINE").length;
    const onsiteCount = existingRegistrations.filter(r => r.event.subcategory === "ONSITE").length;

    if (event.subcategory === "ONLINE" && onlineCount >= 1) {
      return { error: `Participant ${participant.name} has already reached the limit of 1 ONLINE event.` };
    }
    if (event.subcategory === "ONSITE" && onsiteCount >= 1) {
      return { error: `Participant ${participant.name} has already reached the limit of 1 ONSITE event.` };
    }
  }

  return { success: true };
}

export async function getEventDetailsForRegistration(eventId: string) {
  const event = await db.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      category: true,
      maxParticipantsPerRegistration: true,
      status: true,
    },
  });

  if (!event) return null;
  return event;
}

export async function submitRegistration(data: z.infer<typeof registrationSchema>) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const validated = registrationSchema.safeParse(data);
  if (!validated.success) {
    return { error: "Invalid registration data" };
  }

  const { eventId, teamName, members, requirements } = validated.data;

  try {
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { clerkId: userId },
      });

      if (!user) throw new Error("User not found");

      // Fetch the person performing the registration (could be the same user or a coach)
      const registrar = await tx.user.findUnique({
          where: { clerkId: userId }
      });

      const existing = await tx.registration.findUnique({
        where: {
          userId_eventId: {
            userId: user.id,
            eventId: eventId,
          },
        },
      });

      // Capacity and Deadline Check
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) throw new Error("Event not found");

      if (existing) {
        if (existing.status === "APPROVED") {
          throw new Error("Cannot edit an approved registration.");
        }
      }

      if (new Date() > event.endDate) {
        throw new Error("Registration is closed as the competition deadline has passed.");
      }

      // Check registration limits
      const currentCount = await tx.registration.count({
        where: { 
          eventId, 
          status: { notIn: ["REJECTED", "WAITLISTED"] } 
        },
      });

      if (event.maxRegistrations && currentCount >= event.maxRegistrations && (!existing || existing.status === "REJECTED")) {
        throw new Error("Registration limit for this competition has been reached.");
      }

      // Check if all members are pre-registered
      const preRegisteredMembers = await tx.user.findMany({
        where: {
          email: { in: members },
          role: "PARTICIPANT",
        },
      });

      if (preRegisteredMembers.length !== members.length) {
        const foundEmails = preRegisteredMembers.map(m => m.email);
        const missingEmails = members.filter(email => !foundEmails.includes(email));
        throw new Error(`The following members are not pre-registered in the system: ${missingEmails.join(", ")}. Please ask your Faculty Coach or Admin to register them first.`);
      }

      // Check team size
      if (members.length !== event.maxParticipantsPerRegistration) {
        throw new Error(`Team size must be exactly ${event.maxParticipantsPerRegistration} members.`);
      }

      // Check registration limits for each participant
      // Optimization: Batch fetch all registrations where any of these emails are in the members list
      // Note: members is stored as Json, so we use filtering in JS or raw query. 
      // For Prisma Json filtering, we can check for overlaps.
      const allRegistrations = await tx.registration.findMany({
        where: {
          status: { notIn: ["REJECTED"] },
        },
        include: { event: true },
      });

      for (const email of members) {
        const participant = await tx.user.findUnique({ where: { email } });
        if (!participant) continue; 

        const existingRegistrations = allRegistrations.filter(reg => {
          const members = reg.members as string[];
          return members.includes(email);
        });

        console.log(`Debug: Checking limits for ${email}. Found ${existingRegistrations.length} existing regs.`);
        existingRegistrations.forEach(r => console.log(`  - Existing Reg: ${r.event.title} (Subcat: ${r.event.subcategory})`));

        // 1. If trying to register for EGAMES, cannot have ANY existing registration
        if (event.subcategory === "EGAMES") {
          if (existingRegistrations.length > 0) {
            throw new Error(`Participant ${participant.name} is already registered for another event and cannot join an E-GAMES competition.`);
          }
        }

        // 2. If registering for another event, check limits
        for (const reg of existingRegistrations) {
          if (reg.event.subcategory === "EGAMES") {
            throw new Error(`Participant ${participant.name} is already registered for an E-GAMES competition and cannot join another event.`);
          }
        }

        const onlineCount = existingRegistrations.filter(r => r.event.subcategory === "ONLINE").length;
        const onsiteCount = existingRegistrations.filter(r => r.event.subcategory === "ONSITE").length;

        console.log(`Debug: ${participant.email} - Online: ${onlineCount}, Onsite: ${onsiteCount}`);

        if (event.subcategory === "ONLINE" && onlineCount >= 1) {
          throw new Error(`Participant ${participant.name} has already reached the limit of 1 ONLINE event.`);
        }
        if (event.subcategory === "ONSITE" && onsiteCount >= 1) {
          throw new Error(`Participant ${participant.name} has already reached the limit of 1 ONSITE event.`);
        }
      }

      // (Registration status, deadline, and initial capacity checks already performed above)

      const status = "PENDING";

      const registration = await tx.registration.upsert({
        where: {
          userId_eventId: {
            userId: user.id,
            eventId: eventId,
          },
        },
        update: {
          teamName: teamName || null,
          members: members as any,
          requirements: requirements as any,
          status,
          registeredBy: registrar?.name || "Unknown",
          coachId: registrar?.id,
        },
        create: {
          userId: user.id,
          eventId: eventId,
          teamName: teamName || null,
          members: members as any,
          requirements: requirements as any,
          status,
          registeredBy: registrar?.name || "Unknown",
          coachId: registrar?.id,
        },
        include: {
          event: true,
          user: true,
        },
      });

      return registration;
    });

    // Send confirmation email using React Email
    const subject = result.status === "WAITLISTED" 
      ? `Waitlisted for: ${result.event.title}`
      : `Registration Received: ${result.event.title}`;

    await resend.emails.send({
      from: "RAITE <notifications@raite.org>",
      to: [result.user.email],
      subject,
      react: RegistrationConfirmationEmail({
        userName: result.user.name || "Participant",
        eventTitle: result.event.title,
      }),
    });

    revalidatePath("/register");
    return { success: true, id: result.id, status: result.status };
  } catch (err: any) {
    console.error("submitRegistration error:", err);
    return { error: err.message || "Failed to submit registration" };
  }
}

export async function submitEntryUrl(registrationId: string, entryUrl: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const user = await db.user.findUnique({ where: { clerkId: userId } });
    if (!user) throw new Error("User not found");

    const registration = await db.registration.findUnique({
      where: { id: registrationId },
      include: { event: true },
    });

    if (!registration) throw new Error("Registration not found");

    // Check if the user is the coach, admin, or assigned sub-admin
    const isAdmin = user.role === "ADMIN";
    const isCoach = registration.coachId === user.id;
    const isSubAdmin = user.role === "SUB_ADMIN" && registration.event.subAdminId === user.id;

    if (!isAdmin && !isCoach && !isSubAdmin) {
      throw new Error("You are not authorized to submit for this team.");
    }

    if (registration.event.subcategory !== "ONLINE") {
      throw new Error("This competition does not support online submissions.");
    }

    await db.registration.update({
      where: { id: registrationId },
      data: { entryUrl },
    });

    revalidatePath("/registrations/my");
    revalidatePath("/admin/registrations");
    revalidatePath("/sub-admin/competitions");
    return { success: true };
  } catch (err: any) {
    console.error("submitEntryUrl error:", err);
    return { error: err.message || "Failed to submit entry URL" };
  }
}

"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sendBrevoEmail } from "@/lib/email";

const registrationSchema = z.object({
  eventId: z.string().min(1),
  teamName: z.string().optional(),
  members: z.array(z.string().email()),
  requirements: z.record(z.string(), z.string()),
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
  const registration = await db.registration.findFirst({
    where: {
      eventId: eventId,
      status: { notIn: ["REJECTED"] },
      members: {
        path: [],
        array_contains: email
      }
    },
  });

  return !!registration;
}

export async function validateParticipantLimits(eventId: string, emails: string[]) {
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Event not found");

  // Fetch only registrations involving these participants
  const relevantRegistrations = await db.registration.findMany({
    where: {
      status: { notIn: ["REJECTED"] },
      OR: emails.map(email => ({
        members: {
          path: [],
          array_contains: email
        }
      }))
    },
    include: { event: true },
  });

  const participants = await db.user.findMany({
    where: { email: { in: emails } }
  });

  for (const email of emails) {
    const participant = participants.find(p => p.email === email);
    if (!participant) continue;

    if (!participant.approved) {
      return { error: `Competitor ${participant.name || email} is not yet approved by an Admin. They must be approved before they can be registered to a competition.` };
    }

    const existingRegistrations = relevantRegistrations.filter(reg => {
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
    const onsiteCount = existingRegistrations.filter(r => r.event.subcategory === "ONSITE" || r.event.subcategory === "ONSITE_PAGEANT").length;

    if (event.subcategory === "ONLINE" && onlineCount >= 1) {
      return { error: `Participant ${participant.name} has already reached the limit of 1 ONLINE event.` };
    }
    if ((event.subcategory === "ONSITE" || event.subcategory === "ONSITE_PAGEANT") && onsiteCount >= 1) {
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
      subcategory: true,
      maxParticipantsPerRegistration: true,
      minParticipantsPerRegistration: true,
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

  const { id, eventId, teamName, members, requirements } = validated.data;

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

      if (registrar && registrar.role === "FACULTY_COACH" && !registrar.approved) {
        throw new Error("Your Faculty Coach account must be approved by an Admin before you can register teams for competitions.");
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

      // Verify that all pre-registered members are approved
      const unapprovedMembers = preRegisteredMembers.filter(m => !m.approved);
      if (unapprovedMembers.length > 0) {
        const unapprovedNames = unapprovedMembers.map(m => m.name || m.email).join(", ");
        throw new Error(`The following competitors are not yet approved by an Admin: ${unapprovedNames}. They must be approved before they can be registered to a competition.`);
      }

      // Determine the target user ID for the registration.
      // If a coach is registering, we tie the registration to the primary competitor/captain (first email in members).
      // Otherwise, it is tied to the logged-in user themselves.
      let targetUserId = user.id;
      if (registrar && registrar.role === "FACULTY_COACH") {
        const firstMemberEmail = members[0];
        if (!firstMemberEmail) {
          throw new Error("At least one team member is required.");
        }
        const primaryCompetitor = preRegisteredMembers.find(
          (m) => m.email.trim().toLowerCase() === firstMemberEmail.trim().toLowerCase()
        );
        if (!primaryCompetitor) {
          throw new Error("The team captain/primary competitor is not registered in the system.");
        }
        targetUserId = primaryCompetitor.id;
      }

      // Query existing registration
      let existing = null;
      if (id) {
        existing = await tx.registration.findUnique({
          where: { id },
        });
      } else {
        existing = await tx.registration.findUnique({
          where: {
            userId_eventId: {
              userId: targetUserId,
              eventId: eventId,
            },
          },
        });
      }

      // Capacity and Deadline Check
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) throw new Error("Event not found");

      if (existing && existing.status === "APPROVED") {
        throw new Error("Cannot edit an approved registration.");
      }

      if (new Date() > event.endDate) {
        throw new Error("Registration is closed as the competition deadline has passed.");
      }

      // Check registration limits
      const currentCount = await tx.registration.count({
        where: { 
          eventId, 
          status: { notIn: ["REJECTED", "WAITLISTED"] },
          NOT: id ? { id } : {}
        },
      });

      if (event.maxRegistrations && currentCount >= event.maxRegistrations && (!existing || existing.status === "REJECTED")) {
        throw new Error("Registration limit for this competition has been reached.");
      }

      // Check team size
      if (members.length < event.minParticipantsPerRegistration || members.length > event.maxParticipantsPerRegistration) {
        throw new Error(`Team size must be between ${event.minParticipantsPerRegistration} and ${event.maxParticipantsPerRegistration} members. You currently have ${members.length}.`);
      }

      // Check registration limits for each participant
      const relevantRegistrations = await tx.registration.findMany({
        where: {
          status: { notIn: ["REJECTED"] },
          OR: members.map(email => ({
            members: {
              path: [],
              array_contains: email
            }
          })),
          NOT: id ? { id } : {}
        },
        include: { event: true },
      });

      for (const email of members) {
        const participant = preRegisteredMembers.find(m => m.email === email);
        if (!participant) continue; 

        const existingRegistrations = relevantRegistrations.filter(reg => {
          const membersList = reg.members as string[];
          return membersList.includes(email);
        });

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
        const onsiteCount = existingRegistrations.filter(r => r.event.subcategory === "ONSITE" || r.event.subcategory === "ONSITE_PAGEANT").length;

        if (event.subcategory === "ONLINE" && onlineCount >= 1) {
          throw new Error(`Participant ${participant.name} has already reached the limit of 1 ONLINE event.`);
        }
        if ((event.subcategory === "ONSITE" || event.subcategory === "ONSITE_PAGEANT") && onsiteCount >= 1) {
          throw new Error(`Participant ${participant.name} has already reached the limit of 1 ONSITE event.`);
        }
      }

      const status = "PENDING";
      let registration;

      if (id || existing) {
        registration = await tx.registration.update({
          where: { id: id || existing!.id },
          data: {
            userId: targetUserId,
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
      } else {
        registration = await tx.registration.create({
          data: {
            userId: targetUserId,
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
      }

      return registration;
    }, { timeout: 30000 });

    // Send confirmation email
    const subject = result.status === "WAITLISTED" 
      ? `Waitlisted for: ${result.event.title}`
      : `Registration Received: ${result.event.title}`;

    await sendBrevoEmail({
      subject,
      htmlContent: `
        <h1>Hello ${result.user.name || "Participant"}</h1>
        <p>Your registration for <strong>${result.event.title}</strong> has been received.</p>
      `,
      to: [{ email: result.user.email }],
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

    if (registration.status !== "APPROVED") {
      throw new Error("You can only submit entry files for approved registrations.");
    }

    // Check if the user is the coach, admin, or assigned sub-admin
    const isAdmin = user.role === "ADMIN";
    const isCoach = registration.coachId === user.id;
    const isSubAdmin = user.role === "SUB_ADMIN" && registration.event.subAdminId === user.id;

    if (!isAdmin && !isCoach && !isSubAdmin) {
      throw new Error("You are not authorized to submit for this team.");
    }

    if (registration.event.subcategory !== "ONLINE" && registration.event.subcategory !== "ONSITE_PAGEANT") {
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

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
  requirements: z.union([z.record(z.string(), z.string()), z.string()]),
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

      if (existing && existing.status !== "REJECTED") {
        throw new Error("Already registered for this event");
      }

      // Capacity Check
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) throw new Error("Event not found");

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

      const currentCount = await tx.registration.count({
        where: { 
          eventId, 
          status: { notIn: ["REJECTED", "WAITLISTED"] } 
        },
      });

      if (event.maxRegistrations && currentCount >= event.maxRegistrations) {
        throw new Error("Registration limit for this competition has been reached.");
      }

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

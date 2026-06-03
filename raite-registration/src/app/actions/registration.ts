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

      const currentCount = await tx.registration.count({
        where: { 
          eventId, 
          status: { notIn: ["REJECTED", "WAITLISTED"] } 
        },
      });

      const isFull = event.capacity ? currentCount >= event.capacity : false;
      const status = isFull ? "WAITLISTED" : "PENDING";

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
        },
        create: {
          userId: user.id,
          eventId: eventId,
          teamName: teamName || null,
          members: members as any,
          requirements: requirements as any,
          status,
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

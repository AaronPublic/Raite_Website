"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function checkSubAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user || user.role !== "SUB_ADMIN") throw new Error("Forbidden");
  return user;
}

export async function getSubAdminSubmissions(eventId: string) {
  await checkSubAdmin();

  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { title: true, subAdminId: true }
  });

  if (!event) throw new Error("Event not found");

  // Verify the sub-admin is assigned to this event
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (event.subAdminId !== user?.id) {
     throw new Error("Unauthorized to access this competition");
  }

  const registrations = await db.registration.findMany({
    where: { 
      eventId,
      status: { not: "REJECTED" },
    },
    include: {
      user: { select: { name: true, email: true, school: true } },
      event: { select: { subcategory: true } }
    },
    orderBy: [{ user: { school: "asc" } }, { createdAt: "asc" }],
  });

  return registrations.map((r) => ({
    id: r.id,
    school: r.user.school || "N/A",
    teamName: r.teamName || "Individual",
    submissionUrl: r.entryUrl || "",
    status: r.status,
    submittedAt: r.entryUrl 
      ? r.updatedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "Not yet submitted",
    subcategory: r.event.subcategory,
  }));
}

export async function getSubAdminEvents() {
  const user = await checkSubAdmin();
  
  return await db.event.findMany({
    where: { subAdminId: user.id },
    orderBy: { title: "asc" }
  });
}

async function checkAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user || user.role !== "ADMIN") throw new Error("Forbidden");
  return user;
}

export async function getAdminSubmissions(eventId: string) {
  await checkAdmin();

  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { title: true }
  });

  if (!event) throw new Error("Event not found");

  const registrations = await db.registration.findMany({
    where: { 
      eventId,
      status: { not: "REJECTED" },
    },
    include: {
      user: { select: { name: true, email: true, school: true } },
      event: { select: { subcategory: true } }
    },
    orderBy: [{ user: { school: "asc" } }, { createdAt: "asc" }],
  });

  return registrations.map((r) => ({
    id: r.id,
    school: r.user.school || "N/A",
    teamName: r.teamName || "Individual",
    submissionUrl: r.entryUrl || "",
    status: r.status,
    submittedAt: r.entryUrl 
      ? r.updatedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "Not yet submitted",
    subcategory: r.event.subcategory,
  }));
}

export async function getAdminEvents() {
  await checkAdmin();
  
  return await db.event.findMany({
    orderBy: { title: "asc" }
  });
}

export async function updateSubmissionDetails(data: {
  registrationId: string;
  teamName: string;
  submissionUrl?: string | null;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user || (user.role !== "ADMIN" && user.role !== "SUB_ADMIN")) {
    throw new Error("Forbidden: Administrator or Sub-Admin access required");
  }

  const registration = await db.registration.findUnique({
    where: { id: data.registrationId },
    include: { event: true },
  });

  if (!registration) throw new Error("Registration not found");

  if (user.role === "SUB_ADMIN" && registration.event.subAdminId !== user.id) {
    throw new Error("Unauthorized to edit submissions for this competition");
  }

  const sanitizedTeamName = data.teamName.trim() || "Individual";
  const sanitizedUrl = data.submissionUrl?.trim() || null;

  const updated = await db.registration.update({
    where: { id: data.registrationId },
    data: {
      teamName: sanitizedTeamName,
      entryUrl: sanitizedUrl,
    },
  });

  revalidatePath("/admin/submissions");
  revalidatePath("/sub-admin/submissions");
  revalidatePath("/admin/scores");
  revalidatePath("/judge/competitions");
  revalidatePath(`/judge/competitions/${registration.eventId}`);
  revalidatePath(`/judge/competitions/${registration.eventId}/evaluate/${registration.id}`);
  revalidatePath("/admin/registrations");

  return {
    success: true,
    registration: {
      id: updated.id,
      teamName: updated.teamName,
      submissionUrl: updated.entryUrl,
    },
  };
}

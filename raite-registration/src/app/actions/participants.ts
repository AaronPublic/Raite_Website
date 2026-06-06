"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getAllParticipantsForExport, ParticipantFilters } from "@/lib/data/participants";
import { revalidatePath } from "next/cache";
import Papa from "papaparse";

async function checkAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user || user.role !== "ADMIN") throw new Error("Forbidden");
  return user;
}

export async function exportParticipantsCSV(filters: ParticipantFilters) {
  await checkAdmin();
  const participants = await getAllParticipantsForExport(filters);

  const data = participants.map((p) => ({
    Name: p.name || "N/A",
    Email: p.email,
    School: p.school || "N/A",
    Role: p.role,
    JoinedDate: new Date(p.createdAt).toLocaleDateString(),
  }));

  return Papa.unparse(data);
}

export async function bulkRegisterParticipants(participants: { name: string, email: string, course: string }[]) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const requester = await db.user.findUnique({ where: { clerkId: userId } });
  if (!requester || (requester.role !== "ADMIN" && requester.role !== "FACULTY_COACH")) {
    throw new Error("Only Admins and Faculty Coaches can register participants.");
  }

  const school = requester.school;
  if (!school) {
    throw new Error("Your profile must have a school assigned before you can register participants.");
  }

  const results = await db.$transaction(
    participants.map((p) =>
      db.user.upsert({
        where: { email: p.email },
        update: {
          name: p.name,
          course: p.course,
          school: school,
          role: "PARTICIPANT",
        },
        create: {
          email: p.email,
          name: p.name,
          course: p.course,
          school: school,
          role: "PARTICIPANT",
          clerkId: null, // Explicitly set to null for pre-registered users
        },
      })
    )
  );

  revalidatePath("/admin/participants");
  return { success: true, count: results.length };
}

export async function getEligibleParticipants() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const requester = await db.user.findUnique({ where: { clerkId: userId } });
  if (!requester) throw new Error("User not found");

  if (requester.role === "PARTICIPANT") {
    return [];
  }

  const where: any = {
    role: "PARTICIPANT",
  };

  // Faculty Coach can only see participants from their school
  if (requester.role === "FACULTY_COACH") {
    if (!requester.school) return [];
    where.school = requester.school;
  }

  // Admins can see everyone
  return await db.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      school: true,
      course: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function getParticipantsForPDF(filters: ParticipantFilters) {
  await checkAdmin();
  const participants = await getAllParticipantsForExport(filters);

  return participants.map((p) => ({
    name: p.name || "N/A",
    email: p.email,
    school: p.school || "N/A",
    course: p.course || "N/A",
    role: p.role,
    date: new Date(p.createdAt).toLocaleDateString(),
  }));
}

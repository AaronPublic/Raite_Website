"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getAllParticipantsForExport, ParticipantFilters } from "@/lib/data/participants";
import { revalidatePath } from "next/cache";
import Papa from "papaparse";
import { getSchoolByName } from "@/lib/data/schools";

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

  const schoolName = requester.school;
  if (!schoolName) {
    throw new Error("Your profile must have a school assigned before you can register participants.");
  }

  const schoolRecord = await getSchoolByName(schoolName);
  const schoolAbbr = schoolRecord?.abbreviation || schoolName
    .split(" ")
    .filter(word => !["of", "the", "and"].includes(word.toLowerCase()))
    .map(word => word[0])
    .join("")
    .toUpperCase();

  const results = await db.$transaction(async (tx) => {
    const users = [];
    for (const p of participants) {
      // 1. Upsert without uniqueId first (or update existing)
      const user = await tx.user.upsert({
        where: { email: p.email },
        update: {
          name: p.name,
          course: p.course,
          school: schoolName,
          role: "PARTICIPANT",
        },
        create: {
          email: p.email,
          name: p.name,
          course: p.course,
          school: schoolName,
          role: "PARTICIPANT",
          clerkId: null,
        },
      });

      // 2. Generate and update uniqueId using the ID from the DB
      const uniqueId = `${schoolAbbr}-${user.id.slice(-6).toUpperCase()}`;
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { uniqueId },
      });
      users.push(updatedUser);
    }
    return users;
  });

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
      uniqueId: true,
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
    uniqueId: p.uniqueId || "N/A",
    role: p.role,
    date: new Date(p.createdAt).toLocaleDateString(),
  }));
}

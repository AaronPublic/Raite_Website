"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getAllParticipantsForExport, ParticipantFilters } from "@/lib/data/participants";
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
    Course: p.course || "N/A",
    YearLevel: p.yearLevel || "N/A",
    JoinedDate: new Date(p.createdAt).toLocaleDateString(),
  }));

  return Papa.unparse(data);
}

export async function getParticipantsForPDF(filters: ParticipantFilters) {
  await checkAdmin();
  const participants = await getAllParticipantsForExport(filters);

  return participants.map((p) => ({
    name: p.name || "N/A",
    email: p.email,
    school: p.school || "N/A",
    course: p.course || "N/A",
    yearLevel: p.yearLevel || "N/A",
    date: new Date(p.createdAt).toLocaleDateString(),
  }));
}

"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getAllParticipantsForExport, ParticipantFilters } from "@/lib/data/participants";
import { revalidatePath } from "next/cache";
import Papa from "papaparse";

const SCHOOL_MAP: Record<string, string> = {
  "ANGELES UNIVERSITY FOUNDATION": "AUF",
  "AURORA STATE COLLEGE OF TECHNOLOGY": "ASCOT",
  "BATAAN HEROES COLLEGE": "BHC",
  "BULACAN POLYTECHNIC COLLEGE": "BPC",
  "CENTRAL LUZON COLLEGE OF SCIENCE AND TECHNOLOGY": "CLCST",
  "CENTRO ESCOLAR UNIVERSITY MALOLOS": "CEU-M",
  "CITY COLLEGE OF ANGELES": "CCA",
  "CITY COLLEGE OF SAN JOSE DEL MONTE": "CCSJDM",
  "CLARK COLLEGE OF SCIENCE AND TECHNOLOGY": "CCST",
  "COLEGIO DE SAN GABRIEL ARCANGEL, INC.": "CDSGA",
  "COLLEGE FOR RESEARCH & TECHNOLOGY OF CABANATUAN INC.": "CRT-C",
  "COLUMBAN COLLEGE INC.": "CCI",
  "COMTEQ COMPUTER AND BUSINESS COLLEGE, INC.": "CCBC",
  "CORE GATEWAY COLLEGE, INC.": "CGCI",
  "PAMPANGA STATE UNIVERSITY": "PSU",
  "DR. YANGA'S COLLEGES, INC": "DYCI",
  "EASTWOODS COLLEGE OF SCIENCE AND TECHNOLOGY": "ECST",
  "EXACT COLLEGES OF ASIA": "ECA",
  "FIRST CITY PROVIDENTIAL COLLEGE": "FCPC",
  "GENERAL DE JESUS COLLEGE": "GDJC",
  "GORDON COLLEGE": "GC",
  "GUAGUA NATIONAL COLLEGES, INC.": "GNC",
  "HOLY ANGEL UNIVERSITY": "HAU",
  "HOLY CROSS COLLEGE": "HCC",
  "HOLY CROSS COLLEGE STA. ROSA N. E. INC.": "HCC-SR",
  "IMMACULATE CONCEPTION I- COLLEGE OF ARTS AND TECHNOLOGY": "ICICAT",
  "LA CONSOLACION UNIVERSITY PHILIPPINES": "LCUP",
  "LA VERDAD CHRISTIAN COLLEGE, INC.": "LVCC",
  "LYCEUM OF SUBIC BAY": "LSB",
  "MABALACAT CITY COLLEGE": "MCC",
  "MANUEL V. GALLEGO FOUNDATION COLLEGES, INC.": "MVGFCI",
  "NATIONAL UNIVERSITY - CLARK": "NU-C",
  "NATIONAL UNIVERSITY BULACAN, INC.": "NU-B",
  "NORZAGARAY COLLEGE": "NC",
  "NUEVA ECIJA UNIVERSITY OF SCIENCE AND TECHNOLOGY": "NEUST",
  "NUEVA ECIJA UNIVERSITY OF SCIENCE AND TECHNOLOGY - TALAVERA OFF CAMPUS": "NEUST-T",
  "OUR LADY OF FATIMA UNIVERSITY - PAMPANG CAMPUS": "OLFU-P",
  "OUR LADY OF THE SACRED HEART COLLEGE OF GUIMBA, INC.": "OLSHC",
  "PAMBAYANG DALUBHASAAN NG MARILAO": "PDM",
  "PHILIPPINE SOCIETY OF INFORMATION TECHNOLOGY EDUCATORS-PUP BATAAN STUDENT CHAPTER": "PSITE-PUPB",
  "POLYTECHNIC COLLEGE OF BOTOLAN": "PCB",
  "RICHWELL COLLEGES, INC.": "RCI",
  "SAINT MARY'S ANGELS COLLEGE OF PAMPANGA": "SMACP",
  "SANTA RITA COLLEGE OF PAMPANGA": "SRCP",
  "STI COLLEGE BALIUAG": "STI-B",
  "STI COLLEGE MEYCAUAYAN": "STI-M",
  "STI COLLEGE SAN FERNANDO": "STI-SF",
  "STI COLLEGE SAN JOSE": "STI-SJ",
  "TARLAC STATE UNIVERSITY": "TSU",
  "TOPLINK GLOBAL COLLEGE INC.": "TGCI",
  "VISION ACADEMY INC.": "VAI",
  "WESLEYAN UNIVERSITY-PHILIPPINES": "WU-P",
  "COLLEGE OF THE IMMACULATE CONCEPTION": "CIC",
  "CONCEPCION HOLY CROSS COLLEGE, INC.": "CHCC",
  "EASTWOODS PROFESSIONAL COLLEGE OF SCIENCE AND TECHNOLOGY": "EPCST",
  "COLLEGE OF OUR LADY OF MERCY OF PULILAN FOUNDATION INC": "COLMP",
  "PAMPANGA STATE UNIVERSITY COLLEGE OF COMPUTING STUDIES": "PSU-CCS",
  "UNIVERSITY OF THE ASSUMPTION": "UA",
};

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

  // Get abbreviation from map, or fallback to auto-generation
  const schoolAbbr = SCHOOL_MAP[school.toUpperCase()] || school
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
          school: school,
          role: "PARTICIPANT",
        },
        create: {
          email: p.email,
          name: p.name,
          course: p.course,
          school: school,
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

"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getSchoolBillingData(schoolId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const currentUser = await db.user.findUnique({ where: { clerkId: userId } });
  if (!currentUser) throw new Error("User not found");

  const school = await db.school.findUnique({ where: { id: schoolId } });
  if (!school) throw new Error("School not found");

  if (currentUser.role === "FACULTY_COACH" && currentUser.school !== school.name) {
    throw new Error("Forbidden");
  }

  const participants = await db.user.findMany({
    where: {
      school: school.name,
      role: "PARTICIPANT"
    },
    select: { name: true, email: true, createdAt: true }
  });

  const participantDetails = participants.map(p => {
    const regDate = new Date(p.createdAt);
    const month = regDate.getMonth();
    const date = regDate.getDate();

    let baseFee = 1700;
    if (month === 6 && date <= 15) {
      baseFee = 1500;
    } else if (month < 6) {
      baseFee = 1500;
    }

    return {
      name: p.name || "Pending Registration",
      email: p.email,
      dateRegistered: regDate.toLocaleDateString(),
      baseFee
    };
  });

  const actualBill = participantDetails.reduce((sum, p) => sum + p.baseFee, 0);
  const discount = school.discount;
  const subTotal = actualBill - discount;

  const isNonMember = school.category === "NON_MEMBER";
  const competitorAdditional = isNonMember ? (participantDetails.length * 300) : 0;
  const institutionalFee = isNonMember ? 3500 : 0;
  const grandTotal = subTotal + competitorAdditional + institutionalFee;

  return {
    schoolName: school.name,
    abbreviation: school.abbreviation,
    category: school.category,
    discount: school.discount,
    participants: participantDetails,
    summary: {
      actualBill,
      discount,
      subTotal,
      competitorAdditional,
      institutionalFee,
      grandTotal
    }
  };
}

export async function updateSchoolDiscount(schoolId: string, discount: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const admin = await db.user.findUnique({ where: { clerkId: userId } });
  if (!admin || admin.role !== "ADMIN") throw new Error("Forbidden");

  try {
    await db.school.update({
      where: { id: schoolId },
      data: { discount },
    });
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (err) {
    return { error: "Failed to update discount" };
  }
}

export async function getBillingDashboardData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const admin = await db.user.findUnique({ where: { clerkId: userId } });
  if (!admin || admin.role !== "ADMIN") throw new Error("Forbidden");

  // 1. Fetch all schools (1st query)
  const schools = await db.school.findMany({
    orderBy: { name: "asc" }
  });

  // 2. Fetch all participants globally in one batch (2nd query)
  const allParticipants = await db.user.findMany({
    where: {
      role: "PARTICIPANT",
      school: { not: null }
    },
    select: { school: true, createdAt: true }
  });

  // 3. Group participants by school in-memory
  const schoolParticipantsMap = new Map<string, { createdAt: Date }[]>();
  allParticipants.forEach(p => {
    if (p.school) {
      const list = schoolParticipantsMap.get(p.school) || [];
      list.push({ createdAt: p.createdAt });
      schoolParticipantsMap.set(p.school, list);
    }
  });

  // 4. Map schools to dashboard items
  const dashboardItems = schools.map(school => {
    const schoolParticipants = schoolParticipantsMap.get(school.name) || [];

    let actualBill = 0;
    schoolParticipants.forEach(p => {
      const regDate = new Date(p.createdAt);
      const month = regDate.getMonth();
      const date = regDate.getDate();

      let baseFee = 1700;
      if (month === 6 && date <= 15) {
        baseFee = 1500;
      } else if (month < 6) {
        baseFee = 1500;
      }
      actualBill += baseFee;
    });

    const isNonMember = school.category === "NON_MEMBER";
    const competitorAdditional = isNonMember ? (schoolParticipants.length * 300) : 0;
    const institutionalFee = isNonMember ? 3500 : 0;
    const grandTotal = (actualBill - school.discount) + competitorAdditional + institutionalFee;

    return {
      id: school.id,
      name: school.name,
      abbreviation: school.abbreviation,
      category: school.category,
      discount: school.discount,
      participantCount: schoolParticipants.length,
      baseBill: actualBill,
      grandTotal
    };
  });

  return dashboardItems;
}

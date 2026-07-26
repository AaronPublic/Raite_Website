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

  const schools = await db.school.findMany({
    orderBy: { name: "asc" }
  });

  const dashboardItems = [];

  for (const school of schools) {
    const participants = await db.user.findMany({
      where: {
        school: school.name,
        role: "PARTICIPANT"
      },
      select: { createdAt: true }
    });

    let actualBill = 0;
    participants.forEach(p => {
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
    const competitorAdditional = isNonMember ? (participants.length * 300) : 0;
    const institutionalFee = isNonMember ? 3500 : 0;
    const grandTotal = (actualBill - school.discount) + competitorAdditional + institutionalFee;

    dashboardItems.push({
      id: school.id,
      name: school.name,
      abbreviation: school.abbreviation,
      category: school.category,
      discount: school.discount,
      participantCount: participants.length,
      baseBill: actualBill,
      grandTotal
    });
  }

  return dashboardItems;
}

"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

function calculateBaseFee(regDate: Date): number {
  const time = regDate.getTime();
  
  const startEarly = new Date("2026-06-30T00:00:00+08:00").getTime();
  const endEarly = new Date("2026-07-25T23:59:59+08:00").getTime();
  
  const startRegular = new Date("2026-07-26T00:00:00+08:00").getTime();
  const endRegular = new Date("2026-08-20T23:59:59+08:00").getTime();
  
  const startLate = new Date("2026-08-21T00:00:00+08:00").getTime();
  const endLate = new Date("2026-09-04T23:59:59+08:00").getTime();

  if (time >= startEarly && time <= endEarly) {
    return 1300;
  }
  if (time >= startRegular && time <= endRegular) {
    return 1500;
  }
  if (time >= startLate && time <= endLate) {
    return 1700;
  }
  
  // Default fallback
  return 1700;
}

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

  // Fetch participants (students and coaches) and registrations concurrently to cut query time in half
  const [participants, registrations] = await Promise.all([
    db.user.findMany({
      where: {
        school: school.name,
        role: { in: ["PARTICIPANT", "FACULTY_COACH"] }
      },
      select: { name: true, email: true, createdAt: true, role: true, category: true }
    }),
    db.registration.findMany({
      where: { user: { school: school.name } },
      select: { 
        createdAt: true, 
        members: true,
        event: { select: { category: true } }
      }
    })
  ]);

  // Build a set of E-GAMES emails
  const egamesEmails = new Set<string>();

  registrations.forEach(r => {
    const isEgames = r.event?.category === "E-GAMES" || r.event?.category === "EGAMES";
    if (isEgames && Array.isArray(r.members)) {
      (r.members as string[]).forEach(email => {
        egamesEmails.add(email.trim().toLowerCase());
      });
    }
  });

  const participantDetails = participants.map(p => {
    const cleanEmail = p.email.trim().toLowerCase();
    
    const regDate = p.createdAt;
    const baseFee = calculateBaseFee(regDate);

    const dateRegistered = p.role === "FACULTY_COACH" ? "N/A" : regDate.toLocaleDateString();
    const isEgames = p.role === "PARTICIPANT" && egamesEmails.has(cleanEmail);

    return {
      name: p.name || (p.role === "FACULTY_COACH" ? "Pending Coach" : "Pending Registration"),
      email: p.email,
      role: p.role,
      category: p.category,
      dateRegistered,
      baseFee,
      isEgames
    };
  });

  const actualBill = participantDetails.reduce((sum, p) => sum + p.baseFee, 0);
  const discount = school.discount;
  const subTotal = actualBill - discount;

  const egamesPotMoney = participantDetails.filter(p => p.role === "PARTICIPANT" && p.isEgames).length * 300;

  const isNonMember = school.category === "NON_MEMBER";
  const competitorAdditional = isNonMember ? (participantDetails.filter(p => p.role === "PARTICIPANT").length * 300) : 0;
  const nonMemberCoachCount = participantDetails.filter(p => p.role === "FACULTY_COACH" && p.category === "NON_MEMBER").length;
  const nonMemberCoachFee = nonMemberCoachCount * 500;
  const institutionalFee = isNonMember ? 3500 : 0;
  const grandTotal = subTotal + egamesPotMoney + competitorAdditional + institutionalFee + nonMemberCoachFee;

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
      egamesPotMoney,
      competitorAdditional,
      nonMemberCoachFee,
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
    revalidatePath("/admin/billing");
    return { success: true };
  } catch (err) {
    return { error: "Failed to update discount" };
  }
}

export async function toggleSchoolPaymentStatus(schoolId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const admin = await db.user.findUnique({ where: { clerkId: userId } });
  if (!admin || admin.role !== "ADMIN") throw new Error("Forbidden");

  try {
    const school = await db.school.findUnique({ where: { id: schoolId } });
    if (!school) return { error: "School not found" };

    const updated = await db.school.update({
      where: { id: schoolId },
      data: { billingPaid: !school.billingPaid },
    });

    revalidatePath("/admin/billing");
    return { success: true, billingPaid: updated.billingPaid };
  } catch (err) {
    return { error: "Failed to toggle payment status" };
  }
}

export async function getBillingDashboardData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const admin = await db.user.findUnique({ where: { clerkId: userId } });
  if (!admin || admin.role !== "ADMIN") throw new Error("Forbidden");

  // Fetch schools, participants, and registrations concurrently to minimize network latency and database block times
  const [schools, allUsers, allRegistrations] = await Promise.all([
    db.school.findMany({
      orderBy: { name: "asc" }
    }),
    db.user.findMany({
      where: {
        role: { in: ["PARTICIPANT", "FACULTY_COACH"] },
        school: { not: null }
      },
      select: { school: true, email: true, createdAt: true, role: true, category: true }
    }),
    db.registration.findMany({
      select: { 
        createdAt: true, 
        members: true, 
        user: { select: { school: true } },
        event: { select: { category: true } }
      }
    })
  ]);

  // 4. Build school-specific E-GAMES participant sets
  const schoolEgamesEmails = new Map<string, Set<string>>();

  allRegistrations.forEach(r => {
    const schoolName = r.user?.school;
    const isEgames = r.event?.category === "E-GAMES" || r.event?.category === "EGAMES";
    if (schoolName && isEgames && Array.isArray(r.members)) {
      let egamesSet = schoolEgamesEmails.get(schoolName);
      if (!egamesSet) {
        egamesSet = new Set<string>();
        schoolEgamesEmails.set(schoolName, egamesSet);
      }

      (r.members as string[]).forEach(email => {
        egamesSet!.add(email.trim().toLowerCase());
      });
    }
  });

  // 5. Group users by school in-memory
  const schoolUsersMap = new Map<string, typeof allUsers>();
  allUsers.forEach(p => {
    if (p.school) {
      const list = schoolUsersMap.get(p.school) || [];
      list.push(p);
      schoolUsersMap.set(p.school, list);
    }
  });

  // 6. Map schools to dashboard items
  const dashboardItems = schools.map(school => {
    const schoolUsers = schoolUsersMap.get(school.name) || [];
    const egamesSet = schoolEgamesEmails.get(school.name);

    let actualBill = 0;
    let egamesCount = 0;
    let participantCount = 0;
    let nonMemberCoachCount = 0;

    schoolUsers.forEach(p => {
      const cleanEmail = p.email.trim().toLowerCase();
      const regDate = p.createdAt;
      const baseFee = calculateBaseFee(regDate);
      actualBill += baseFee;

      if (p.role === "FACULTY_COACH") {
        if (p.category === "NON_MEMBER") {
          nonMemberCoachCount++;
        }
      } else {
        participantCount++;
        if (egamesSet && egamesSet.has(cleanEmail)) {
          egamesCount++;
        }
      }
    });

    const isNonMember = school.category === "NON_MEMBER";
    const competitorAdditional = isNonMember ? (participantCount * 300) : 0;
    const nonMemberCoachFee = nonMemberCoachCount * 500;
    const institutionalFee = isNonMember ? 3500 : 0;
    
    const egamesPotMoney = egamesCount * 300;
    
    const grandTotal = (actualBill - school.discount) + egamesPotMoney + competitorAdditional + institutionalFee + nonMemberCoachFee;

    return {
      id: school.id,
      name: school.name,
      abbreviation: school.abbreviation,
      category: school.category,
      discount: school.discount,
      billingPaid: school.billingPaid,
      participantCount: participantCount,
      baseBill: actualBill,
      grandTotal
    };
  });

  return dashboardItems;
}

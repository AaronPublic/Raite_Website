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

  // Fetch all registrations for this school to check competition dates and categories
  const registrations = await db.registration.findMany({
    where: { user: { school: school.name } },
    select: { 
      createdAt: true, 
      members: true,
      event: { select: { category: true } }
    }
  });

  // Build a map of email -> earliest registration date and E-GAMES email set
  const emailToEarliestRegDate = new Map<string, Date>();
  const egamesEmails = new Set<string>();

  registrations.forEach(r => {
    const isEgames = r.event?.category === "E-GAMES" || r.event?.category === "EGAMES";
    if (Array.isArray(r.members)) {
      (r.members as string[]).forEach(email => {
        const cleanEmail = email.trim().toLowerCase();
        
        // Track earliest registration
        const existing = emailToEarliestRegDate.get(cleanEmail);
        if (!existing || r.createdAt.getTime() < existing.getTime()) {
          emailToEarliestRegDate.set(cleanEmail, r.createdAt);
        }

        // Track if registered for E-GAMES
        if (isEgames) {
          egamesEmails.add(cleanEmail);
        }
      });
    }
  });

  const participantDetails = participants.map(p => {
    const cleanEmail = p.email.trim().toLowerCase();
    const regDate = emailToEarliestRegDate.get(cleanEmail) || p.createdAt;
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
      baseFee,
      isEgames: egamesEmails.has(cleanEmail)
    };
  });

  const actualBill = participantDetails.reduce((sum, p) => sum + p.baseFee, 0);
  const discount = school.discount;
  const subTotal = actualBill - discount;

  const egamesPotMoney = participantDetails.filter(p => p.isEgames).length * 300;

  const isNonMember = school.category === "NON_MEMBER";
  const competitorAdditional = isNonMember ? (participantDetails.length * 300) : 0;
  const institutionalFee = isNonMember ? 3500 : 0;
  const grandTotal = subTotal + egamesPotMoney + competitorAdditional + institutionalFee;

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
    select: { school: true, email: true, createdAt: true }
  });

  // 3. Fetch all registrations globally in one batch to trace competition dates and categories (3rd query)
  const allRegistrations = await db.registration.findMany({
    select: { 
      createdAt: true, 
      members: true, 
      user: { select: { school: true } },
      event: { select: { category: true } }
    }
  });

  // 4. Build school-specific email -> earliest registration date map and E-GAMES participant sets
  const schoolEmailToEarliestRegDate = new Map<string, Map<string, Date>>();
  const schoolEgamesEmails = new Map<string, Set<string>>();

  allRegistrations.forEach(r => {
    const schoolName = r.user?.school;
    const isEgames = r.event?.category === "E-GAMES" || r.event?.category === "EGAMES";
    if (schoolName && Array.isArray(r.members)) {
      let emailMap = schoolEmailToEarliestRegDate.get(schoolName);
      if (!emailMap) {
        emailMap = new Map<string, Date>();
        schoolEmailToEarliestRegDate.set(schoolName, emailMap);
      }

      let egamesSet = schoolEgamesEmails.get(schoolName);
      if (!egamesSet) {
        egamesSet = new Set<string>();
        schoolEgamesEmails.set(schoolName, egamesSet);
      }

      (r.members as string[]).forEach(email => {
        const cleanEmail = email.trim().toLowerCase();
        
        const existing = emailMap!.get(cleanEmail);
        if (!existing || r.createdAt.getTime() < existing.getTime()) {
          emailMap!.set(cleanEmail, r.createdAt);
        }

        if (isEgames) {
          egamesSet!.add(cleanEmail);
        }
      });
    }
  });

  // 5. Group participants by school in-memory
  const schoolParticipantsMap = new Map<string, typeof allParticipants>();
  allParticipants.forEach(p => {
    if (p.school) {
      const list = schoolParticipantsMap.get(p.school) || [];
      list.push(p);
      schoolParticipantsMap.set(p.school, list);
    }
  });

  // 6. Map schools to dashboard items
  const dashboardItems = schools.map(school => {
    const schoolParticipants = schoolParticipantsMap.get(school.name) || [];
    const emailMap = schoolEmailToEarliestRegDate.get(school.name);
    const egamesSet = schoolEgamesEmails.get(school.name);

    let actualBill = 0;
    let egamesCount = 0;

    schoolParticipants.forEach(p => {
      const cleanEmail = p.email.trim().toLowerCase();
      const regDate = (emailMap && emailMap.get(cleanEmail)) || p.createdAt;
      const month = regDate.getMonth();
      const date = regDate.getDate();

      let baseFee = 1700;
      if (month === 6 && date <= 15) {
        baseFee = 1500;
      } else if (month < 6) {
        baseFee = 1500;
      }
      actualBill += baseFee;

      if (egamesSet && egamesSet.has(cleanEmail)) {
        egamesCount++;
      }
    });

    const isNonMember = school.category === "NON_MEMBER";
    const competitorAdditional = isNonMember ? (schoolParticipants.length * 300) : 0;
    const institutionalFee = isNonMember ? 3500 : 0;
    
    const egamesPotMoney = egamesCount * 300;
    
    const grandTotal = (actualBill - school.discount) + egamesPotMoney + competitorAdditional + institutionalFee;

    return {
      id: school.id,
      name: school.name,
      abbreviation: school.abbreviation,
      category: school.category,
      discount: school.discount,
      billingPaid: school.billingPaid,
      participantCount: schoolParticipants.length,
      baseBill: actualBill,
      grandTotal
    };
  });

  return dashboardItems;
}

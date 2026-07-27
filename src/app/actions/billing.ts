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
    
    let baseFee = 0;
    let dateRegistered = "N/A";
    let isEgames = false;

    if (p.role === "FACULTY_COACH") {
      baseFee = p.category === "NON_MEMBER" ? 500 : 0;
    } else {
      const regDate = emailToEarliestRegDate.get(cleanEmail) || p.createdAt;
      const month = regDate.getMonth();
      const date = regDate.getDate();

      baseFee = 1700;
      if (month === 6 && date <= 15) {
        baseFee = 1500;
      } else if (month < 6) {
        baseFee = 1500;
      }
      dateRegistered = regDate.toLocaleDateString();
      isEgames = egamesEmails.has(cleanEmail);
    }

    return {
      name: p.name || (p.role === "FACULTY_COACH" ? "Pending Coach" : "Pending Registration"),
      email: p.email,
      role: p.role,
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
    const emailMap = schoolEmailToEarliestRegDate.get(school.name);
    const egamesSet = schoolEgamesEmails.get(school.name);

    let actualBill = 0;
    let egamesCount = 0;
    let participantCount = 0;

    schoolUsers.forEach(p => {
      if (p.role === "FACULTY_COACH") {
        const baseFee = p.category === "NON_MEMBER" ? 500 : 0;
        actualBill += baseFee;
      } else {
        participantCount++;
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
      }
    });

    const isNonMember = school.category === "NON_MEMBER";
    const competitorAdditional = isNonMember ? (participantCount * 300) : 0;
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
      participantCount: participantCount,
      baseBill: actualBill,
      grandTotal
    };
  });

  return dashboardItems;
}

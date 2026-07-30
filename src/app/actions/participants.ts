"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getAllParticipantsForExport, ParticipantFilters } from "@/lib/data/participants";
import { revalidatePath } from "next/cache";
import Papa from "papaparse";
import { cookies } from "next/headers";
import { getSchoolByName } from "@/lib/data/schools";
import { deleteSupabaseFile } from "@/lib/supabase";
import { sendBrevoEmail } from "@/lib/email";
import { env } from "@/env";

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
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const requester = await db.user.findUnique({ where: { clerkId: userId } });
    if (!requester || (requester.role !== "ADMIN" && requester.role !== "FACULTY_COACH" && requester.role !== "SUB_ADMIN")) {
      return { success: false, error: "Only Admins, Sub-Admins, and Faculty Coaches can register competitors." };
    }

    if (requester.role === "FACULTY_COACH" && !requester.approved) {
      return { success: false, error: "Your account must be approved by an Admin before you can register competitors." };
    }

    const schoolName = requester.school;
    if (!schoolName) {
      return { success: false, error: "Your profile must have a school assigned before you can register competitors." };
    }

    const schoolRecord = await getSchoolByName(schoolName);
    const schoolAbbr = schoolRecord?.abbreviation || schoolName
      .split(" ")
      .filter(word => !["of", "the", "and"].includes(word.toLowerCase()))
      .map(word => word[0])
      .join("")
      .toUpperCase();

    // Email Domain Validation check
    const coachEmail = requester.email;
    const coachDomain = coachEmail.split("@")[1]?.toLowerCase();
    const publicDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"];
    const isPublicDomain = publicDomains.includes(coachDomain);

    for (const p of participants) {
      const email = p.email.trim().toLowerCase();
      const isValidEmail = 
        email.endsWith("@gmail.com") || 
        (!isPublicDomain && email.endsWith(`@${coachDomain}`)) ||
        (isPublicDomain && (email.endsWith(".edu.ph") || email.endsWith(".edu") || /@[a-zA-Z0-9.-]+\.edu(\.[a-zA-Z]{2,})?$/.test(email)));

      if (!isValidEmail) {
        const allowedMsg = isPublicDomain 
          ? "gmail.com or any school email (.edu or .edu.ph)" 
          : `gmail.com or your school domain (${coachDomain})`;
        return { success: false, error: `Invalid email address for ${p.name}: ${p.email}. Email must end with ${allowedMsg}.` };
      }
    }

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
            approved: true,
          },
          create: {
            email: p.email,
            name: p.name,
            course: p.course,
            school: schoolName,
            role: "PARTICIPANT",
            clerkId: null,
            approved: true,
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
    }, { timeout: 600000 });

    revalidatePath("/admin/users");
    const cookieStore = await cookies();
    cookieStore.delete("non_member_fee_acknowledged");
    return { success: true, count: results.length };
  } catch (error: any) {
    console.error("Bulk registration failed:", error);
    return { success: false, error: error.message || "Failed to register competitors. Please try again." };
  }
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

  // Faculty Coach and Sub-Admin can only see participants from their school
  if (requester.role === "FACULTY_COACH" || requester.role === "SUB_ADMIN") {
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
      approved: true,
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

export async function updateParticipant(id: string, data: { name: string; email: string; course?: string }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const requester = await db.user.findUnique({ where: { clerkId: userId } });
  if (!requester || (requester.role !== "ADMIN" && requester.role !== "FACULTY_COACH" && requester.role !== "SUB_ADMIN")) {
    throw new Error("Forbidden");
  }

  const participant = await db.user.findUnique({ where: { id } });
  if (!participant || participant.role !== "PARTICIPANT") {
    throw new Error("Participant not found");
  }

  if ((requester.role === "FACULTY_COACH" || requester.role === "SUB_ADMIN") && requester.school !== participant.school) {
    throw new Error("Forbidden: You can only update participants from your own school.");
  }

  const updated = await db.user.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      course: data.course || null,
    },
  });

  revalidatePath("/admin/users");
  revalidatePath("/registrations/competitors");
  revalidatePath("/register/step-2");
  return { success: true, user: updated };
}

export async function deleteParticipant(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const requester = await db.user.findUnique({ where: { clerkId: userId } });
  if (!requester || (requester.role !== "ADMIN" && requester.role !== "FACULTY_COACH" && requester.role !== "SUB_ADMIN")) {
    throw new Error("Forbidden");
  }

  const participant = await db.user.findUnique({ where: { id } });
  if (!participant || participant.role !== "PARTICIPANT") {
    throw new Error("Participant not found");
  }

  if ((requester.role === "FACULTY_COACH" || requester.role === "SUB_ADMIN") && requester.school !== participant.school) {
    throw new Error("Forbidden: You can only delete participants from your own school.");
  }

  await db.$transaction(async (tx) => {
    // Delete registrations
    await tx.registration.deleteMany({
      where: { userId: id }
    });
    // Delete user
    await tx.user.delete({
      where: { id }
    });
  });

  if (participant.coachCertificateUrl) {
    await deleteSupabaseFile(participant.coachCertificateUrl);
  }

  revalidatePath("/admin/users");
  revalidatePath("/registrations/competitors");
  revalidatePath("/register/step-2");
  return { success: true };
}

export async function toggleUserApproval(id: string, category?: "MEMBER" | "NON_MEMBER") {
  await checkAdmin();

  const user = await db.user.findUnique({ where: { id } });
  if (!user) throw new Error("User not found");

  const isApproving = !user.approved;
  const dataToUpdate: any = { approved: isApproving };

  if (user.role === "FACULTY_COACH" && isApproving) {
    if (!category) {
      throw new Error("Category is required when approving a faculty coach.");
    }
    dataToUpdate.category = category;
  }

  const updated = await db.user.update({
    where: { id },
    data: dataToUpdate,
  });

  if (user.role === "FACULTY_COACH" && isApproving) {
    try {
      await sendBrevoEmail({
        subject: "RAITE 2026 - Faculty Coach Account Approved",
        to: [{ email: user.email }],
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #0038a8; margin: 0; font-size: 24px; font-weight: 800;">RAITE 2026</h2>
              <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">PSITE Region III</p>
            </div>
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <h3 style="color: #111827; font-size: 18px; font-weight: 700; margin-top: 0;">Account Approved!</h3>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">Hello <strong>${user.name || "Faculty Coach"}</strong>,</p>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">We are pleased to inform you that your registration as a <strong>Faculty Coach</strong> representing <strong>${user.school || "your school"}</strong> has been officially approved.</p>
            <div style="margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #4b5563;"><strong>Verification Status:</strong> Approved</p>
              <p style="margin: 0; font-size: 13px; color: #4b5563;"><strong>Classification:</strong> ${category === "MEMBER" ? "MEMBER" : "NON-MEMBER"}</p>
            </div>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">You can now log in to the portal to start registering your competitors and accessing dashboard resources.</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${env.NEXT_PUBLIC_APP_URL || "http://localhost:3000/"}" style="display: inline-block; padding: 12px 24px; background-color: #0038a8; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">Go to Dashboard</a>
            </div>
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0 20px 0;" />
            <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 0;">This is an automated notification. Please do not reply directly to this email.</p>
          </div>
        `
      });
    } catch (emailErr) {
      console.error("Failed to send coach approval email:", emailErr);
    }
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/coaches");
  return { success: true, approved: updated.approved, category: updated.category };
}

export async function deleteUser(userId: string) {
  try {
    await checkAdmin();

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    // If the user has a clerkId, delete them from Clerk first
    if (user.clerkId) {
      try {
        const { createClerkClient } = await import("@clerk/nextjs/server");
        const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
        await clerk.users.deleteUser(user.clerkId);
      } catch (clerkErr) {
        console.error("Failed to delete user from Clerk (they might not exist in Clerk):", clerkErr);
      }
    }

    await db.$transaction(async (tx) => {
      // Delete registrations first
      await tx.registration.deleteMany({
        where: { userId },
      });
      // Delete user record
      await tx.user.delete({
        where: { id: userId },
      });
    });

    if (user.coachCertificateUrl) {
      await deleteSupabaseFile(user.coachCertificateUrl);
    }
    if (user.schoolIdUrl) {
      await deleteSupabaseFile(user.schoolIdUrl);
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    console.error("deleteUser failed:", error);
    return { success: false, error: error.message || "Failed to delete user." };
  }
}

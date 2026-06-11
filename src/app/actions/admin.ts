"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { RegistrationStatus } from "@prisma/client";

import { 
  getDashboardStats, 
  getRegistrationsPerCompetition, 
  getRegistrationsByClassification, 
  getRegistrationTrends 
} from "@/lib/data/admin";

export async function getDashboardData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const admin = await db.user.findUnique({ where: { clerkId: userId } });
  if (!admin || admin.role !== "ADMIN") throw new Error("Forbidden");

  const [stats, competitionData, classificationData, trends] = await Promise.all([
    getDashboardStats(),
    getRegistrationsPerCompetition(),
    getRegistrationsByClassification(),
    getRegistrationTrends(),
  ]);

  return {
    stats,
    competitionData,
    classificationData,
    trends,
  };
}

const schoolSchema = z.object({
  name: z.string().min(1, "School name is required"),
  abbreviation: z.string().min(1, "Abbreviation is required"),
});

export async function addSchool(data: z.infer<typeof schoolSchema>) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const admin = await db.user.findUnique({ where: { clerkId: userId } });
  if (!admin || admin.role !== "ADMIN") throw new Error("Forbidden");

  const validated = schoolSchema.safeParse(data);
  if (!validated.success) return { error: "Invalid school data" };

  try {
    await db.school.create({
      data: validated.data,
    });
    revalidatePath("/admin/settings"); // Or wherever you place the school management
    return { success: true };
  } catch (err) {
    return { error: "Failed to add school (name or abbreviation may already exist)" };
  }
}

export async function deleteSchool(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const admin = await db.user.findUnique({ where: { clerkId: userId } });
  if (!admin || admin.role !== "ADMIN") throw new Error("Forbidden");

  try {
    await db.school.delete({
      where: { id },
    });
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (err) {
    return { error: "Failed to delete school" };
  }
}

"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { RegistrationStatus } from "@prisma/client";

import { 
  getDashboardStats, 
  getRegistrationsPerCompetition, 
  getRegistrationsByCourse, 
  getRegistrationTrends 
} from "@/lib/data/admin";

export async function getDashboardData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const admin = await db.user.findUnique({ where: { clerkId: userId } });
  if (!admin || admin.role !== "ADMIN") throw new Error("Forbidden");

  const [stats, competitionData, courseData, trends] = await Promise.all([
    getDashboardStats(),
    getRegistrationsPerCompetition(),
    getRegistrationsByCourse(),
    getRegistrationTrends(),
  ]);

  return {
    stats,
    competitionData,
    courseData,
    trends,
  };
}

const batchUpdateSchema = z.object({
  ids: z.array(z.string()),
  status: z.nativeEnum(RegistrationStatus),
});

export async function batchUpdateStatus(data: z.infer<typeof batchUpdateSchema>) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const admin = await db.user.findUnique({ where: { clerkId: userId } });
  if (!admin || admin.role !== "ADMIN") throw new Error("Forbidden");

  const validated = batchUpdateSchema.safeParse(data);
  if (!validated.success) return { error: "Invalid data" };

  const { ids, status } = validated.data;

  try {
    await db.registration.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });

    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (err) {
    return { error: "Failed to update registrations" };
  }
}

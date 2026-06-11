"use server";

import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/data/users";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateSystemSetting(key: string, value: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Unauthorized" };

    const user = await getUserByClerkId(userId);
    if (!user || user.role !== "ADMIN") {
      return { error: "Forbidden: Admin access required" };
    }

    // Defensive check to ensure the model exists on the db object
    // In some environments, Prisma might map the model name differently during hot-reloads
    const model = (db as any).systemSetting || (db as any).system_setting;
    
    if (!model) {
      console.error("Critical: SystemSetting model missing from Prisma Client", Object.keys(db));
      return { error: "System error: Configuration module is currently initializing. Please try again in a few seconds." };
    }

    await model.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    revalidatePath("/");
    revalidatePath("/admin/settings");
    
    return { success: true };
  } catch (error: any) {
    console.error(`Error updating system setting ${key}:`, error);
    return { error: error.message || "Failed to update setting" };
  }
}

export async function fetchSystemSetting(key: string) {
  try {
    const model = (db as any).systemSetting || (db as any).system_setting;
    if (!model) return null;

    const setting = await model.findUnique({
      where: { key },
    });
    return setting?.value || null;
  } catch (error) {
    console.error(`Error fetching system setting ${key}:`, error);
    return null;
  }
}

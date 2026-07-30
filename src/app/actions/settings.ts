"use server";

import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/data/users";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redis } from "@/lib/redis";

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

    if (key === "EVENT_PROGRAMME_URL") {
      const oldSetting = await model.findUnique({ where: { key } });
      if (oldSetting && oldSetting.value && oldSetting.value !== value) {
        try {
          const { deleteSupabaseFile } = await import("@/lib/supabase");
          await deleteSupabaseFile(oldSetting.value);
        } catch (err) {
          console.error("Error deleting old programme file from storage:", err);
        }
      }
    }

    await model.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    // Invalidate Redis cache for this setting
    if (redis) {
      try {
        const SETTINGS_CACHE_PREFIX = "setting:";
        await redis.del(`${SETTINGS_CACHE_PREFIX}${key}`);
      } catch (redisErr) {
        console.error("Failed to clear redis cache for setting:", redisErr);
      }
    }

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

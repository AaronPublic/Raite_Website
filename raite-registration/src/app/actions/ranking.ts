"use server";

import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/data/users";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateLeaderboard(entries: { place: number; name: string; university: string }[]) {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Unauthorized" };

    const user = await getUserByClerkId(userId);
    if (!user || user.role !== "ADMIN") {
      return { error: "Forbidden: Admin access required" };
    }

    // Transaction to update leaderboard entries
    await db.$transaction(
      entries.map((entry) => 
        db.leaderboardEntry.upsert({
          where: { place: entry.place },
          update: { name: entry.name, university: entry.university },
          create: { place: entry.place, name: entry.name, university: entry.university },
        })
      )
    );

    revalidatePath("/");
    revalidatePath("/admin/ranking");
    
    return { success: true };
  } catch (error: any) {
    console.error("Error updating leaderboard:", error);
    return { error: error.message || "Failed to update leaderboard" };
  }
}

export async function getLeaderboard() {
  try {
    return await db.leaderboardEntry.findMany({
      orderBy: { place: "asc" },
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
}

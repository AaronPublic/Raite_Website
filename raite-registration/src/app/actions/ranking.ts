"use server";

import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/data/users";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateLeaderboard(entries: { place: number; university: string }[]) {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Unauthorized" };

    const user = await getUserByClerkId(userId);
    if (!user || user.role !== "ADMIN") {
      return { error: "Forbidden: Admin access required" };
    }

    // Since we now support ties (multiple entries per place), 
    // we'll replace the entire set in a transaction
    await db.$transaction([
      db.leaderboardEntry.deleteMany({}),
      db.leaderboardEntry.createMany({
        data: entries.map(e => ({
          place: e.place,
          university: e.university,
        })),
      }),
    ]);

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
      select: {
        id: true,
        place: true,
        university: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { place: "asc" },
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
}

export async function updateCompetitionWinners(winners: { id?: string; competitionName: string; champion: string; firstRunnerUp: string; secondRunnerUp: string }[]) {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Unauthorized" };

    const user = await getUserByClerkId(userId);
    if (!user || user.role !== "ADMIN") {
      return { error: "Forbidden: Admin access required" };
    }

    // This is a simple implementation that replaces existing winners with the new set
    // For a more robust one, we could use separate add/delete actions
    const winnerModel = (db as any).competitionWinner;
    if (!winnerModel) {
      return { error: "Database error: CompetitionWinner model not found in client" };
    }

    await db.$transaction([
      winnerModel.deleteMany({}),
      winnerModel.createMany({
        data: winners.map(({ id, ...w }) => w),
      }),
    ]);

    revalidatePath("/");
    revalidatePath("/admin/ranking");
    
    return { success: true };
  } catch (error: any) {
    console.error("Error updating competition winners:", error);
    return { error: error.message || "Failed to update competition winners" };
  }
}

export async function getCompetitionWinners() {
  try {
    console.log("DB Keys:", Object.keys(db).filter(k => !k.startsWith('_') && !k.startsWith('$')));
    
    // Defensive access to avoid crash if model is missing from cached client
    const winnerModel = (db as any).competitionWinner;
    if (!winnerModel) {
      console.warn("competitionWinner model is missing from Prisma Client instance!");
      return [];
    }

    return await winnerModel.findMany({
      orderBy: { competitionName: "asc" },
    });
  } catch (error) {
    console.error("Error fetching competition winners:", error);
    return [];
  }
}

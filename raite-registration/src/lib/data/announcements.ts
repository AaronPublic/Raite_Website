// Refreshing module to pick up Prisma schema changes
import { db } from "@/lib/db";
import { Announcement } from "@prisma/client";

export async function getLatestAnnouncements(limit: number = 3): Promise<Announcement[]> {
  return await db.announcement.findMany({
    where: {
      isArchived: false,
    },
    orderBy: [
      { pinned: "desc" },
      { createdAt: "desc" },
    ],
    take: limit,
  });
}

export async function getAnnouncementById(id: string) {
  return await db.announcement.findUnique({
    where: { id },
  });
}

export async function getAllAnnouncements(): Promise<Announcement[]> {
  return await db.announcement.findMany({
    orderBy: [
      { pinned: "desc" },
      { createdAt: "desc" },
    ],
  });
}

"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const announcementSchema = z.object({
  title: z.string().min(2, "Title is required"),
  content: z.string().min(10, "Content is required"),
  pinned: z.boolean().default(false),
});

async function checkAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user || user.role !== "ADMIN") throw new Error("Forbidden");
  return user;
}

export async function createAnnouncement(data: z.infer<typeof announcementSchema>) {
  await checkAdmin();
  const validated = announcementSchema.parse(data);

  try {
    await db.announcement.create({
      data: validated,
    });
    revalidatePath("/admin/announcements");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: "Failed to create announcement" };
  }
}

export async function updateAnnouncement(id: string, data: z.infer<typeof announcementSchema>) {
  await checkAdmin();
  const validated = announcementSchema.parse(data);

  try {
    await db.announcement.update({
      where: { id },
      data: validated,
    });
    revalidatePath("/admin/announcements");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: "Failed to update announcement" };
  }
}

export async function togglePinAnnouncement(id: string, pinned: boolean) {
  await checkAdmin();

  try {
    await db.announcement.update({
      where: { id },
      data: { pinned },
    });
    revalidatePath("/admin/announcements");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: "Failed to pin announcement" };
  }
}

export async function toggleArchiveAnnouncement(id: string, isArchived: boolean) {
  await checkAdmin();

  try {
    await db.announcement.update({
      where: { id },
      data: { isArchived },
    });
    revalidatePath("/admin/announcements");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: "Failed to archive announcement" };
  }
}

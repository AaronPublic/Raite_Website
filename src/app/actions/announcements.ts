"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { resend } from "@/lib/email";
import { AnnouncementNotification } from "@/emails/AnnouncementNotification";
import { getAllUserEmails } from "@/lib/data/users";
import { render } from "@react-email/render";


const announcementSchema = z.object({
  title: z.string().min(2, "Title is required"),
  facebookUrl: z.string().trim().url("Invalid Facebook URL").optional().or(z.literal("")),
  imageUrl: z.string().trim().url("Invalid image URL").optional().or(z.literal("")),
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
  try {
    await checkAdmin();
    const validated = announcementSchema.parse(data);

    const announcement = await db.announcement.create({
      data: validated,
    });

    // Broadcast email
    const emails = await getAllUserEmails();
    if (emails.length > 0) {
      await resend.emails.send({
        from: "RAITE 2026 <no-reply@raite.ph>", // Assuming the domain/sender
        to: emails,
        subject: `New Announcement: ${announcement.title}`,
        react: AnnouncementNotification({
          title: announcement.title,
          content: announcement.content,
          url: announcement.facebookUrl || undefined,
        }),
      });
    }

    revalidatePath("/admin/announcements");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Create announcement error:", error);
    return { error: error.message || "Failed to create announcement" };
  }
}


export async function updateAnnouncement(id: string, data: z.infer<typeof announcementSchema>) {
  try {
    await checkAdmin();
    const validated = announcementSchema.parse(data);

    await db.announcement.update({
      where: { id },
      data: validated,
    });
    revalidatePath("/admin/announcements");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Update announcement error:", error);
    return { error: error.message || "Failed to update announcement" };
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

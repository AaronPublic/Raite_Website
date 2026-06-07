"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { RegistrationStatus } from "@prisma/client";

const updateStatusSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(RegistrationStatus),
});

const batchUpdateSchema = z.object({
  ids: z.array(z.string()),
  status: z.nativeEnum(RegistrationStatus),
});

const revisionSchema = z.object({
  id: z.string(),
  comment: z.string().min(5, "Comment must be at least 5 characters"),
});

async function checkAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user || user.role !== "ADMIN") throw new Error("Forbidden");
  return user;
}

export async function updateRegistrationStatus(data: z.infer<typeof updateStatusSchema>) {
  await checkAdmin();
  const { id, status } = updateStatusSchema.parse(data);

  try {
    await db.registration.update({
      where: { id },
      data: { status },
    });
    revalidatePath("/admin/registrations");
    return { success: true };
  } catch (error) {
    return { error: "Failed to update status" };
  }
}

export async function batchUpdateRegistrationStatus(data: z.infer<typeof batchUpdateSchema>) {
  await checkAdmin();
  const { ids, status } = batchUpdateSchema.parse(data);

  try {
    await db.registration.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
    revalidatePath("/admin/registrations");
    return { success: true };
  } catch (error) {
    return { error: "Failed to update registrations" };
  }
}

export async function submitRevisionRequest(data: z.infer<typeof revisionSchema>) {
  await checkAdmin();
  const { id, comment } = revisionSchema.parse(data);

  try {
    await db.registration.update({
      where: { id },
      data: { 
        status: "WAITLISTED", // Or a specific revision state if we had one
        adminComment: comment 
      },
    });
    revalidatePath("/admin/registrations");
    return { success: true };
  } catch (error) {
    return { error: "Failed to submit revision request" };
  }
}

export async function deleteRegistration(id: string) {
  await checkAdmin();

  try {
    await db.registration.delete({
      where: { id },
    });
    revalidatePath("/admin/registrations");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete registration" };
  }
}

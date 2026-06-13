"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { RegistrationStatus } from "@prisma/client";
import { getFilteredRegistrations, RegistrationFilters } from "@/lib/data/registrations";
import Papa from "papaparse";

const updateStatusSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(RegistrationStatus),
  comment: z.string().optional(),
});

const batchUpdateSchema = z.object({
  ids: z.array(z.string()),
  status: z.nativeEnum(RegistrationStatus),
});

const revisionSchema = z.object({
  id: z.string(),
  comment: z.string().min(5, "Comment must be at least 5 characters"),
});

export async function checkAccess(registrationId?: string, registrationIds?: string[]) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("Forbidden");
  
  if (user.role === "ADMIN") return user;
  
  if (user.role === "SUB_ADMIN") {
    if (registrationId) {
      const reg = await db.registration.findUnique({
        where: { id: registrationId },
        include: { event: true }
      });
      if (reg && reg.event.subAdminId === user.id) return user;
    }
    
    if (registrationIds && registrationIds.length > 0) {
      const regs = await db.registration.findMany({
        where: { id: { in: registrationIds } },
        include: { event: true }
      });
      const allAssigned = regs.every(reg => reg.event.subAdminId === user.id);
      if (allAssigned && regs.length === registrationIds.length) return user;
    }
  }
  
  throw new Error("Forbidden");
}

export async function updateRegistrationStatus(data: z.infer<typeof updateStatusSchema>) {
  const { id, status, comment } = updateStatusSchema.parse(data);
  await checkAccess(id);

  try {
    await db.registration.update({
      where: { id },
      data: { 
        status,
        adminComment: comment || null,
        requirementsVerified: status === "APPROVED" ? true : undefined
      },
    });
    revalidatePath("/admin/registrations");
    revalidatePath("/sub-admin/competitions");
    return { success: true };
  } catch (error) {
    return { error: "Failed to update status" };
  }
}

export async function toggleRequirementsVerified(id: string) {
  await checkAccess(id);

  try {
    const registration = await db.registration.findUnique({
      where: { id },
      select: { requirementsVerified: true }
    });

    if (!registration) return { error: "Registration not found" };

    await db.registration.update({
      where: { id },
      data: { requirementsVerified: !registration.requirementsVerified },
    });
    
    revalidatePath("/admin/registrations");
    revalidatePath("/sub-admin/competitions");
    return { success: true };
  } catch (error) {
    return { error: "Failed to toggle verification" };
  }
}


export async function batchUpdateRegistrationStatus(data: z.infer<typeof batchUpdateSchema>) {
  const { ids, status } = batchUpdateSchema.parse(data);
  await checkAccess(undefined, ids);

  try {
    await db.registration.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
    revalidatePath("/admin/registrations");
    revalidatePath("/sub-admin/competitions");
    return { success: true };
  } catch (error) {
    return { error: "Failed to update registrations" };
  }
}

export async function submitRevisionRequest(data: z.infer<typeof revisionSchema>) {
  const { id, comment } = revisionSchema.parse(data);
  await checkAccess(id);

  try {
    await db.registration.update({
      where: { id },
      data: { 
        status: "WAITLISTED", // Or a specific revision state if we had one
        adminComment: comment 
      },
    });
    revalidatePath("/admin/registrations");
    revalidatePath("/sub-admin/competitions");
    return { success: true };
  } catch (error) {
    return { error: "Failed to submit revision request" };
  }
}

export async function deleteRegistration(id: string) {
  await checkAccess(id);

  try {
    await db.registration.delete({
      where: { id },
    });
    revalidatePath("/admin/registrations");
    revalidatePath("/sub-admin/competitions");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete registration" };
  }
}

export async function exportRegistrationsCSV(filters: RegistrationFilters) {
  await checkAccess(); // Admin check
  const registrations = await getFilteredRegistrations(filters);
  
  const data = registrations.map(r => ({
    School: r.user.school,
    Competition: r.event.title,
    Status: r.status,
    Coach: r.user.name,
    Email: r.user.email,
    RegisteredAt: r.createdAt
  }));
  
  return Papa.unparse(data);
}

export async function getRegistrationsForPDF(filters: RegistrationFilters) {
  await checkAccess(); // Admin check
  const registrations = await getFilteredRegistrations(filters);
  
  return registrations.map(r => ({
    school: r.user.school || "N/A",
    competition: r.event.title,
    status: r.status,
    coach: r.user.name || "N/A",
    date: new Date(r.createdAt).toLocaleDateString()
  }));
}

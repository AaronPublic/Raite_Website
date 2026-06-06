"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { EventStatus, EventSubcategory } from "@prisma/client";

const competitionSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  category: z.string().min(2, "Category is required"),
  subcategory: z.nativeEnum(EventSubcategory, {
    required_error: "Subcategory is required",
    invalid_type_error: "Invalid subcategory selected",
  }),
  startDate: z.date(),
  endDate: z.date(),
  maxParticipantsPerRegistration: z.number().int().positive().default(1),
  maxRegistrations: z.number().int().positive().nullable(),
  rules: z.string().optional(),
  rulesPdfUrl: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  status: z.nativeEnum(EventStatus).default("UPCOMING"),
});

async function checkAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user || user.role !== "ADMIN") throw new Error("Forbidden");
  return user;
}

export async function createCompetition(data: z.infer<typeof competitionSchema>) {
  await checkAdmin();
  
  try {
    const validated = competitionSchema.parse(data);
    
    // Convert empty string to null for the database
    const dbData = {
      ...validated,
      imageUrl: validated.imageUrl === "" ? null : validated.imageUrl,
      rulesPdfUrl: validated.rulesPdfUrl === "" ? null : validated.rulesPdfUrl,
      subcategory: validated.subcategory || null,
    };

    await db.event.create({
      data: dbData,
    });
    
    revalidatePath("/admin/competitions");
    revalidatePath("/competitions");
    return { success: true };
  } catch (error: any) {
    console.error("Prisma Create Error:", error);
    // If it's a Zod error, return the specific message
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: error.message || "Failed to create competition" };
  }
}

export async function updateCompetition(id: string, data: z.infer<typeof competitionSchema>) {
  await checkAdmin();

  try {
    const validated = competitionSchema.parse(data);
    
    // Convert empty string to null for the database
    const dbData = {
      ...validated,
      imageUrl: validated.imageUrl === "" ? null : validated.imageUrl,
      rulesPdfUrl: validated.rulesPdfUrl === "" ? null : validated.rulesPdfUrl,
      subcategory: validated.subcategory || null,
    };

    await db.event.update({
      where: { id },
      data: dbData,
    });
    
    revalidatePath("/admin/competitions");
    revalidatePath(`/competitions/${id}`);
    revalidatePath("/competitions");
    return { success: true };
  } catch (error: any) {
    console.error("Prisma Update Error:", error);
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: error.message || "Failed to update competition" };
  }
}

export async function deleteCompetition(id: string) {
  await checkAdmin();

  try {
    // Note: Registration model has @@unique([userId, eventId]) 
    // and belongs to Event. Prisma will handle cascade if configured,
    // otherwise we delete manually.
    await db.$transaction([
      db.registration.deleteMany({ where: { eventId: id } }),
      db.event.delete({ where: { id } }),
    ]);
    
    revalidatePath("/admin/competitions");
    revalidatePath("/competitions");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete competition" };
  }
}

export async function toggleRegistrationStatus(id: string, isOpen: boolean) {
  await checkAdmin();

  try {
    await db.event.update({
      where: { id },
      data: {
        status: isOpen ? "UPCOMING" : "COMPLETED",
      },
    });
    revalidatePath("/admin/competitions");
    revalidatePath(`/competitions/${id}`);
    return { success: true };
  } catch (error) {
    return { error: "Failed to toggle status" };
  }
}

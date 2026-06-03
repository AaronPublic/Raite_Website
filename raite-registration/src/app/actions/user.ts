"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const profileSchema = z.object({
  school: z.string().min(2, "School name is required"),
  course: z.string().min(2, "Course is required"),
  yearLevel: z.string().min(1, "Year level is required"),
});

export async function completeProfile(formData: z.infer<typeof profileSchema>) {
  console.log("completeProfile: Starting for user");
  try {
    const user = await currentUser();
    console.log("completeProfile: clerk user =", user?.id);

    if (!user) {
      throw new Error("Unauthorized");
    }

    const validatedFields = profileSchema.safeParse(formData);

    if (!validatedFields.success) {
      console.log("completeProfile: Validation failed", validatedFields.error.format());
      return { error: "Invalid fields" };
    }

    const { school, course, yearLevel } = validatedFields.data;
    const email = user.emailAddresses[0].emailAddress;
    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();

    console.log("completeProfile: Upserting user in DB...");
    const updatedUser = await db.user.upsert({
      where: { clerkId: user.id },
      update: {
        school,
        course,
        yearLevel,
      },
      create: {
        clerkId: user.id,
        email,
        name: name || null,
        school,
        course,
        yearLevel,
        role: "PARTICIPANT",
      },
    });
    console.log("completeProfile: User upserted successfully", updatedUser.id);

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("completeProfile: Error occurred:", error);
    return { error: error.message || "Failed to update profile" };
  }
}

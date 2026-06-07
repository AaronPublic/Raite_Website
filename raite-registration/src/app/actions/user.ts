"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  school: z.string().min(2, "School name is required"),
  classification: z.enum(["Participant", "Faculty Coach"]),
});

export async function completeProfile(formData: z.infer<typeof profileSchema>) {
  console.log("completeProfile: Starting for user");
  try {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const validatedFields = profileSchema.safeParse(formData);
    if (!validatedFields.success) return { error: "Invalid fields" };

    const { firstName, lastName, school, classification } = validatedFields.data;
    const email = user.emailAddresses[0]?.emailAddress;
    
    if (!email) throw new Error("No email found for user");

    const name = `${firstName} ${lastName}`.trim();
    const role = classification === "Faculty Coach" ? "FACULTY_COACH" : "PARTICIPANT";

    console.log("completeProfile: Upserting user in DB...");
    
    const existingUserByEmail = await db.user.findUnique({ where: { email } });

    let updatedUser;
    if (existingUserByEmail && existingUserByEmail.clerkId !== user.id) {
        updatedUser = await db.user.update({
            where: { email },
            data: {
                clerkId: user.id,
                school,
                role,
                name: name || null,
            },
        });
    } else {
        updatedUser = await db.user.upsert({
            where: { clerkId: user.id },
            update: {
                school,
                role,
                name: name || null,
            },
            create: {
                clerkId: user.id,
                email,
                name: name || null,
                school,
                role,
            },
        });
    }
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("completeProfile: Error occurred:", error);
    return { error: error.message || "Failed to update profile" };
  }
}

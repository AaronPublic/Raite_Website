"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function checkAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user || (user.role !== "ADMIN" && user.role !== "SUB_ADMIN")) {
    throw new Error("Forbidden");
  }
  return user;
}

export async function getFacultyCoaches() {
  await checkAdmin();

  return await db.user.findMany({
    where: {
      role: "FACULTY_COACH"
    },
    orderBy: [
      { school: "asc" },
      { name: "asc" }
    ]
  });
}

export async function updateCoachCategory(id: string, category: "MEMBER" | "NON_MEMBER" | null) {
  await checkAdmin();

  const updated = await db.user.update({
    where: { id },
    data: { category }
  });

  revalidatePath("/admin/coaches");
  revalidatePath("/admin/users");
  return { success: true, category: updated.category };
}

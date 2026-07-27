"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

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

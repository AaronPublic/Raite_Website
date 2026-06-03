import { db } from "@/lib/db";

export async function getUserById(id: string) {
  return await db.user.findUnique({
    where: { id },
  });
}

export async function getUserByClerkId(clerkId: string) {
  return await db.user.findUnique({
    where: { clerkId },
  });
}

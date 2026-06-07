import { db } from "@/lib/db";
import { Prisma, RegistrationStatus } from "@prisma/client";

export interface RegistrationFilters {
  search?: string;
  status?: RegistrationStatus;
  eventId?: string;
}

export async function getFilteredRegistrations(filters: RegistrationFilters = {}) {
  const where: Prisma.RegistrationWhereInput = {
    AND: [
      filters.search ? {
        user: {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            { email: { contains: filters.search, mode: "insensitive" } },
          ],
        },
      } : {},
      filters.status ? { status: filters.status } : {},
      filters.eventId ? { eventId: filters.eventId } : {},
    ],
  };

  return await db.registration.findMany({
    where,
    include: {
      user: true,
      event: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getRegistrationsByUserId(userId: string) {
  return await db.registration.findMany({
    where: { userId },
    include: {
      event: true,
    },
  });
}

export async function getAllRegistrations() {
  return await db.registration.findMany({
    include: {
      user: true,
      event: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

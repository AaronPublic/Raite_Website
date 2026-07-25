import { db } from "@/lib/db";
import { Prisma, RegistrationStatus } from "@prisma/client";

export interface RegistrationFilters {
  search?: string;
  status?: string;
  eventId?: string;
}

export async function getFilteredRegistrations(filters: RegistrationFilters = {}) {
  try {
    const where: Prisma.RegistrationWhereInput = {
      AND: [
        filters.search ? {
          user: {
            OR: [
              { name: { contains: filters.search, mode: "insensitive" } },
              { email: { contains: filters.search, mode: "insensitive" } },
              { school: { contains: filters.search, mode: "insensitive" } },
            ],
          },
        } : {},
        filters.status ? (
          filters.status === "SUBMITTED" ? { entryUrl: { not: null } } :
          filters.status === "NOT_SUBMITTED" ? { entryUrl: null, event: { subcategory: "ONLINE" } } :
          { status: filters.status as RegistrationStatus }
        ) : {},
        filters.eventId ? { eventId: filters.eventId } : {},
      ],
    };

    return await db.registration.findMany({
      where,
      include: {
        user: true,
        event: true,
        coach: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    console.error("Failed to fetch filtered registrations:", error);
    return [];
  }
}

export async function getRegistrationsByUserId(userId: string) {
  try {
    return await db.registration.findMany({
      where: { userId },
      include: {
        event: true,
      },
    });
  } catch (error) {
    console.error(`Failed to fetch registrations for user ${userId}:`, error);
    return [];
  }
}

export async function getAllRegistrations() {
  try {
    return await db.registration.findMany({
      include: {
        user: true,
        event: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    console.error("Failed to fetch all registrations:", error);
    return [];
  }
}

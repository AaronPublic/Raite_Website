import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export interface ParticipantFilters {
  search?: string;
  school?: string;
  course?: string; // Added course filter
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function getPaginatedParticipants(page: number = 1, limit: number = 10, filters: ParticipantFilters = {}) {
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {
    role: { in: ["PARTICIPANT", "FACULTY_COACH"] }, // Restrict to these roles
    AND: [
      filters.search ? {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" } },
          { school: { contains: filters.search, mode: "insensitive" } },
        ],
      } : {},
      filters.school ? { school: filters.school } : {},
      filters.course ? { course: filters.course } : {},
      filters.role ? { role: filters.role as any } : {},
    ],
  };
// ... rest of function ...

  const orderBy: Prisma.UserOrderByWithRelationInput = filters.sortBy 
    ? { [filters.sortBy]: filters.sortOrder || "asc" }
    : { createdAt: "desc" };

  const [participants, totalCount] = await Promise.all([
    db.user.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),
    db.user.count({ where }),
  ]);

  return {
    participants,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
  };
}

export async function getAllParticipantsForExport(filters: ParticipantFilters = {}) {
  const where: Prisma.UserWhereInput = {
    role: "PARTICIPANT",
    AND: [
      filters.search ? {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" } },
          { school: { contains: filters.search, mode: "insensitive" } },
        ],
      } : {},
      filters.school ? { school: filters.school } : {},
      filters.course ? { course: filters.course } : {},
    ],
  };

  return await db.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

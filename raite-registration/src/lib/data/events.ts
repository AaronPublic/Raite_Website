import { db } from "@/lib/db";

export async function getUpcomingEvents() {
  return await db.event.findMany({
    where: {
      status: "UPCOMING",
    },
    orderBy: {
      startDate: "asc",
    },
  });
}

export async function getAllEvents() {
  return await db.event.findMany({
    orderBy: {
      startDate: "asc",
    },
  });
}

export async function getEventById(id: string) {
  return await db.event.findUnique({
    where: { id },
  });
}

export async function getDistinctCategories() {
  const events = await db.event.findMany({
    select: {
      category: true,
    },
    distinct: ["category"],
    where: {
      category: {
        not: null,
      },
    },
  });

  return events.map((e) => e.category as string);
}

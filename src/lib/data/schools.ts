import { db } from "@/lib/db";

export async function getSchools() {
  return await db.school.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getSchoolByAbbreviation(abbreviation: string) {
  return await db.school.findUnique({
    where: { abbreviation },
  });
}

export async function getSchoolByName(name: string) {
  return await db.school.findUnique({
    where: { name },
  });
}

import { db } from "@/lib/db";

export async function getSystemSetting(key: string) {
  try {
    const model = (db as any).systemSetting;
    if (!model) {
      console.warn("systemSetting model is missing from Prisma Client instance!");
      return null;
    }

    const setting = await model.findUnique({
      where: { key },
    });
    return setting?.value || null;
  } catch (error) {
    console.error(`Error fetching system setting ${key}:`, error);
    return null;
  }
}

export async function getAllSystemSettings() {
  try {
    const model = (db as any).systemSetting;
    if (!model) {
      console.warn("systemSetting model is missing from Prisma Client instance!");
      return {};
    }

    const settings = await model.findMany();
    return settings.reduce((acc: any, setting: any) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);
  } catch (error) {
    console.error("Error fetching all system settings:", error);
    return {};
  }
}

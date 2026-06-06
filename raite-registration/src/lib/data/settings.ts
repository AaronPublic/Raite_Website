import { db } from "@/lib/db";

export async function getSystemSetting(key: string) {
  try {
    const setting = await db.systemSetting.findUnique({
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
    const settings = await db.systemSetting.findMany();
    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);
  } catch (error) {
    console.error("Error fetching all system settings:", error);
    return {};
  }
}

import { db } from "@/lib/db";
import { redis } from "@/lib/redis";

const SETTINGS_CACHE_KEY = "system_settings";
const CACHE_TTL = 3600; // 1 hour

export async function getSystemSetting(key: string) {
  "use cache";
  try {
    // Try cache first if redis is available
    if (redis) {
      const cachedValue = await redis.hget(SETTINGS_CACHE_KEY, key);
      if (cachedValue) return cachedValue as string;
    }

    const setting = await db.systemSetting.findUnique({
      where: { key },
    });
    
    if (setting && redis) {
      await redis.hset(SETTINGS_CACHE_KEY, { [key]: setting.value });
      await redis.expire(SETTINGS_CACHE_KEY, CACHE_TTL);
    }
    
    return setting?.value || null;
  } catch (error) {
    console.error(`Error fetching system setting ${key}:`, error);
    return null;
  }
}

export async function getAllSystemSettings() {
  "use cache";
  try {
    // Try cache first if redis is available
    if (redis) {
      const cachedSettings = await redis.hgetall(SETTINGS_CACHE_KEY);
      if (cachedSettings && Object.keys(cachedSettings).length > 0) {
        return cachedSettings as Record<string, string>;
      }
    }

    const settings = await db.systemSetting.findMany();
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);

    if (Object.keys(settingsMap).length > 0 && redis) {
      await redis.hset(SETTINGS_CACHE_KEY, settingsMap);
      await redis.expire(SETTINGS_CACHE_KEY, CACHE_TTL);
    }

    return settingsMap;
  } catch (error) {
    console.error("Error fetching all system settings:", error);
    return {};
  }
}

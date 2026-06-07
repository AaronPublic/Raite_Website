import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { env } from "@/env";

export const redis = env.UPSTASH_REDIS_REST_URL && 
                       env.UPSTASH_REDIS_REST_TOKEN && 
                       env.UPSTASH_REDIS_REST_URL !== "https://..." 
  ? new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    }) 
  : null;

// Create a new ratelimiter, that allows 5 requests per 1 minute
export const ratelimit = redis ? new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
}) : null;

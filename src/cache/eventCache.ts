import { redisClient } from "../redis";
import { Event } from "../generated/prisma/client";
import { CACHE_TTL_SECONDS } from "../config";

const CACHE_KEY = "events:list";

/**
 * Get cached list of events from redis
 *
 * @returns Event[] or null
 */
export async function getCachedEvents(): Promise<Event[] | null> {
  const cached = await redisClient.get(CACHE_KEY);
  return cached ? JSON.parse(cached) : null;
}

/**
 * Caches a list of events on redis
 *
 * @param events    List of events to cache
 */
export async function setCachedEvents(events: Event[]): Promise<void> {
  await redisClient.set(CACHE_KEY, JSON.stringify(events), {
    EX: CACHE_TTL_SECONDS,
  });
}

/**
 * Removes the cached list of events in redis
 */
export async function invalidateCachedEvents(): Promise<void> {
  await redisClient.del(CACHE_KEY);
}

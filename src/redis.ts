import { createClient } from "redis";

export const redisClient = createClient({
  url: process.env.REDIS_URl,
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}

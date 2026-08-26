import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { getUserId } from "./requireAuth";
import { redisClient } from "../redis";

export const bookingRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  message: "Too many booking attempts. Please try again in a minute.",
  statusCode: 429,
  keyGenerator: (req) => getUserId(req),
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
});

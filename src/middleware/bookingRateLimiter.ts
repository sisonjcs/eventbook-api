import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { getUserId } from "./requireAuth";
import { redisClient } from "../redis";
import {
  BOOKING_RATE_LIMIT_WINDOW_MS,
  BOOKING_RATE_LIMIT_MAX,
} from "../config";

export const bookingRateLimiter = rateLimit({
  windowMs: BOOKING_RATE_LIMIT_WINDOW_MS,
  limit: BOOKING_RATE_LIMIT_MAX,
  message: "Too many booking attempts. Please try again in a minute.",
  statusCode: 429,
  keyGenerator: (req) => getUserId(req),
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
});

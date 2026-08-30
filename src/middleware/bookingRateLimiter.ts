import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { getUserId } from "./requireAuth";
import { redisClient } from "../redis";
import {
  BOOKING_RATE_LIMIT_WINDOW_MS,
  BOOKING_RATE_LIMIT_MAX,
} from "../config";
import { logger } from "../logger";

/**
 * Rate limiter for the booking endpoint (/events/:id/book)
 *
 * Maximum of 10 requests per second
 */
export const bookingRateLimiter = rateLimit({
  windowMs: BOOKING_RATE_LIMIT_WINDOW_MS,
  limit: BOOKING_RATE_LIMIT_MAX,
  message: "Too many booking attempts. Please try again in a minute.",
  statusCode: 429,
  keyGenerator: (req) => getUserId(req),
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
  handler: (req, res) => {
    logger.warn(
      {
        userId: getUserId(req),
        path: req.path,
      },
      "Rate limit exceeded",
    );

    res.status(429).send({ error: "Too many booking attempts" });
  },
});

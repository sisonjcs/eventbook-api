import rateLimit from "express-rate-limit";

export const bookingRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  message: "Too many booking attempts. Please try again in a minute.",
  statusCode: 429,
});

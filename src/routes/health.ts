import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import { redisClient } from "../redis";

export const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Check API and infrastructure health
 *     description: Verifies connectivity to PostgreSQL and Redis. Returns 200 only if both are reachable.
 *     responses:
 *       200:
 *         description: All dependencies are healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 postgres:
 *                   type: boolean
 *                 redis:
 *                   type: boolean
 *       503:
 *         description: One or more dependencies are unreachable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 postgres:
 *                   type: boolean
 *                 redis:
 *                   type: boolean
 */
router.get("/health", async (req: Request, res: Response) => {
  const checks = { postgres: false, redis: false };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.postgres = true;
  } catch {
    checks.postgres = false;
  }

  try {
    await redisClient.ping();
    checks.redis = true;
  } catch {
    checks.redis = false;
  }

  const healthy = checks.postgres && checks.redis;
  return res.status(healthy ? 200 : 503).send(checks);
});

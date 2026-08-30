import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import { redisClient } from "../redis";

export const router = Router();

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

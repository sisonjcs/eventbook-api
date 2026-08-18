import { NextFunction, Request, Response } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).send({ error: "Not authenticated" });
  }
  next();
}

export function getUserId(req: Request): string {
  return req.session.userId as string;
}

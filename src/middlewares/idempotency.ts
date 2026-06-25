import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";

declare global {
  namespace Express {
    interface Request {
      idempotencyKey?: string;
    }
  }
}

/**
 * Middleware to extract and validate the Idempotency-Key header
 * Attaches the key to req.idempotencyKey for use in controllers
 */
export function requireIdempotencyKey(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const idempotencyKey = req.header("Idempotency-Key");

  if (!idempotencyKey) {
    throw new AppError("Idempotency-Key header is required", 400);
  }

  req.idempotencyKey = idempotencyKey;
  next();
}

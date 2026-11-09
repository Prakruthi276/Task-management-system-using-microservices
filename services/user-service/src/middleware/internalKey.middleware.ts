import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

// Only trusted services (Auth, Task) know this key.
export const requireInternalKey = (req: Request, _res: Response, next: NextFunction) => {
  const provided = Buffer.from(req.header("x-internal-api-key") ?? "");
  const expected = Buffer.from(env.internalApiKey);

  // timingSafeEqual compares in constant time, so response timing can't leak the key.
  // Buffers must be the same length first, otherwise timingSafeEqual throws.
  const isValid =
    provided.length === expected.length && crypto.timingSafeEqual(provided, expected);

  // 403, not 401: the frontend treats 401 as "token expired" and would try to refresh.
  if (!isValid) return next(new AppError("Forbidden: internal use only", 403));
  next();
};

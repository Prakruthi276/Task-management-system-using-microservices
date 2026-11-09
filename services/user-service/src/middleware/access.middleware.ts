import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { authenticate } from "./auth.middleware";
import { requireInternalKey } from "./internalKey.middleware";

// Accepts a trusted service (internal key header) OR a logged-in user (JWT).
export const internalOrAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.header("x-internal-api-key")) {
    return requireInternalKey(req, res, (err?: unknown) => {
      if (err) return next(err);
      req.internalCall = true;
      next();
    });
  }
  return authenticate(req, res, next);
};

// For GET /api/users/:id: a service, an admin, or the user looking at their own record.
export const requireAdminSelfOrInternal = (req: Request, _res: Response, next: NextFunction) => {
  if (req.internalCall) return next();
  if (!req.user) return next(new AppError("Authentication required", 401));
  if (req.user.role === "ADMIN" || req.user.id === req.params.id) return next();
  next(new AppError("You do not have permission to do this", 403));
};

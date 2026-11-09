import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";
import { AuthUser, Role, ROLES } from "../types/auth.types";
import { AppError } from "../utils/AppError";

// Who is calling? Verifies the access token issued by the Auth service.
export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.header("authorization");
  if (!header || !header.startsWith("Bearer ")) {
    return next(new AppError("Authentication required", 401));
  }
  const token = header.slice("Bearer ".length).trim();

  try {
    const payload = jwt.verify(token, env.jwtAccessSecret, {
      algorithms: ["HS256"], // pinning the algorithm stops "alg" tampering attacks
    }) as JwtPayload;

    if (
      typeof payload.sub !== "string" ||
      typeof payload.sid !== "string" ||
      !ROLES.includes(payload.role as Role)
    ) {
      throw new Error("Unexpected token claims");
    }

    const user: AuthUser = { id: payload.sub, role: payload.role as Role, sessionId: payload.sid };
    req.user = user;
    next();
  } catch (err) {
    const message =
      err instanceof jwt.TokenExpiredError ? "Access token expired" : "Invalid access token";
    next(new AppError(message, 401));
  }
};

// Is this kind of user allowed to do this kind of action?
export const requireRole =
  (...allowed: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError("Authentication required", 401));
    if (!allowed.includes(req.user.role)) {
      return next(new AppError("You do not have permission to do this", 403));
    }
    next();
  };

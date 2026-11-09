import { Response } from "express";
import { env } from "../config/env";

export const REFRESH_COOKIE = "refreshToken";

const baseOptions = {
  httpOnly: true,   // JavaScript can't read it, so XSS can't steal it
  secure: env.nodeEnv === "production", // HTTPS only in production
  sameSite: "lax" as const, // not sent on cross-site requests
  path: "/api/auth", // the browser sends it only to the auth endpoints
};

export const setRefreshCookie = (res: Response, token: string) =>
  res.cookie(REFRESH_COOKIE, token, { ...baseOptions, maxAge: env.refreshTtlSeconds * 1000 });

export const clearRefreshCookie = (res: Response) => res.clearCookie(REFRESH_COOKIE, baseOptions);

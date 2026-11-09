import crypto from "crypto";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "./AppError";

// SHA-256 hash of a token. We store this, never the token itself.
export const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

export const signAccessToken = (userId: string, role: string, sessionId: string): string =>
  jwt.sign({ role, sid: sessionId }, env.jwtAccessSecret, {
    algorithm: "HS256",
    subject: userId,
    expiresIn: env.accessTtlSeconds,
  });

export const signRefreshToken = (userId: string, sessionId: string): string =>
  jwt.sign({ sid: sessionId }, env.jwtRefreshSecret, {
    algorithm: "HS256",
    subject: userId,
    jwtid: crypto.randomUUID(), // makes every refresh token unique, even within the same second
    expiresIn: env.refreshTtlSeconds,
  });

export interface RefreshClaims {
  userId: string;
  sessionId: string;
}

const readClaims = (payload: JwtPayload): RefreshClaims | null => {
  if (typeof payload.sub !== "string" || typeof payload.sid !== "string") return null;
  return { userId: payload.sub, sessionId: payload.sid };
};

// Strict check, used by refresh: signature, algorithm and expiry must all be valid.
export const verifyRefreshToken = (token: string): RefreshClaims => {
  try {
    const payload = jwt.verify(token, env.jwtRefreshSecret, {
      algorithms: ["HS256"], // pinning the algorithm stops "alg" tampering attacks
    }) as JwtPayload;
    const claims = readClaims(payload);
    if (claims) return claims;
  } catch {
    // fall through to the error below
  }
  throw new AppError("Invalid or expired refresh token", 401);
};

// Lenient check, used by logout: the signature must be valid, but an expired token is fine.
// Returns null instead of throwing, so logout can always answer 200.
export const readRefreshTokenIgnoringExpiry = (token: string): RefreshClaims | null => {
  try {
    const payload = jwt.verify(token, env.jwtRefreshSecret, {
      algorithms: ["HS256"],
      ignoreExpiration: true,
    }) as JwtPayload;
    return readClaims(payload);
  } catch {
    return null;
  }
};

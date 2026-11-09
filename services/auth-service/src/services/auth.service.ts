import crypto from "crypto";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { userClient } from "../clients/user.client";
import { AppError } from "../utils/AppError";
import {
  hashToken,
  readRefreshTokenIgnoringExpiry,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/tokens";
import { LoginInput, RegisterInput } from "../validators/auth.validator";

export interface ClientInfo {
  userAgent?: string;
  ipAddress?: string;
}

const refreshExpiry = () => new Date(Date.now() + env.refreshTtlSeconds * 1000);

const tokenResponse = (accessToken: string, refreshToken: string) => ({
  accessToken,
  refreshToken,
  tokenType: "Bearer",
  expiresIn: env.accessTtlSeconds,
});

export const authService = {
  // Register only creates the account. No tokens and no session.
  async register(input: RegisterInput) {
    // Role is always EMPLOYEE here. Admins and managers are promoted later by an admin.
    return userClient.createUser({
      name: input.name,
      email: input.email,
      password: input.password,
      role: "EMPLOYEE",
    });
  },

  // Login creates a session and issues both tokens.
  async login({ email, password }: LoginInput, client: ClientInfo) {
    // The User Service checks the password. Wrong email or wrong password both give the same 401.
    const user = await userClient.verifyCredentials(email, password);
    if (user.status !== "ACTIVE") throw new AppError("Account is inactive", 403);

    const sessionId = crypto.randomUUID();
    const refreshToken = signRefreshToken(user.id, sessionId);
    const accessToken = signAccessToken(user.id, user.role, sessionId);

    await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshTokenHash: hashToken(refreshToken), // only the hash is stored
        userAgent: client.userAgent?.slice(0, 255),
        ipAddress: client.ipAddress,
        expiresAt: refreshExpiry(),
      },
    });

    return { user, ...tokenResponse(accessToken, refreshToken) };
  },

  async refresh(refreshToken: string) {
    const { userId, sessionId } = verifyRefreshToken(refreshToken); // signature and expiry

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) {
      throw new AppError("Invalid refresh token", 401);
    }
    if (session.revokedAt || session.expiresAt <= new Date()) {
      throw new AppError("Session has ended. Please log in again", 401);
    }

    // The session is alive, but this is not its current token: an old token came back.
    // It may be stolen, so end this session (and only this one).
    if (session.refreshTokenHash !== hashToken(refreshToken)) {
      await prisma.session.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new AppError("Refresh token reuse detected. Please log in again", 401);
    }

    // Ask the User Service again: the role may have changed or the account may be deactivated.
    const user = await userClient.getUser(session.userId);
    if (user.status !== "ACTIVE") {
      await prisma.session.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new AppError("Account is inactive", 403);
    }

    // Rotate inside the same session. The where clause makes this atomic:
    // two simultaneous refreshes with the same token can't both succeed.
    const newRefreshToken = signRefreshToken(user.id, session.id);
    const rotated = await prisma.session.updateMany({
      where: { id: session.id, refreshTokenHash: session.refreshTokenHash, revokedAt: null },
      data: {
        refreshTokenHash: hashToken(newRefreshToken),
        lastUsedAt: new Date(),
        expiresAt: refreshExpiry(),
      },
    });
    if (rotated.count === 0) throw new AppError("Refresh token already used", 401);

    const accessToken = signAccessToken(user.id, user.role, session.id);
    return { user, ...tokenResponse(accessToken, newRefreshToken) };
  },

  async logout(refreshToken: string) {
    // Idempotent: an invalid token revokes nothing, and the answer is still 200.
    const claims = readRefreshTokenIgnoringExpiry(refreshToken);
    if (!claims) return;

    await prisma.session.updateMany({
      where: { id: claims.sessionId, userId: claims.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },
};

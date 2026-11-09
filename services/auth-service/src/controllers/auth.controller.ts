import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { AppError } from "../utils/AppError";
import { REFRESH_COOKIE, clearRefreshCookie, setRefreshCookie } from "../utils/cookies";

// Device details saved with the session
const clientInfo = (req: Request) => ({
  userAgent: req.get("user-agent"),
  ipAddress: req.ip,
});

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.register(req.body);
      res.status(201).json({
        success: true,
        message: "Registration successful. Please log in.",
        data: user,
      });
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken, ...result } = await authService.login(req.body, clientInfo(req));
      setRefreshCookie(res, refreshToken); // the refresh token goes into the cookie only
      res.json({ success: true, data: result }); // body has the user and the access token
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.[REFRESH_COOKIE];
      if (!token) throw new AppError("Refresh token cookie missing", 401);

      const { refreshToken, ...result } = await authService.refresh(token);
      setRefreshCookie(res, refreshToken); // rotated token replaces the old cookie
      res.json({ success: true, data: result });
    } catch (err) {
      // Session is gone or token is bad — cookie is useless, remove it.
      // A 503 (User Service down) keeps the cookie, because the session is still valid.
      if (err instanceof AppError && (err.statusCode === 401 || err.statusCode === 403)) {
        clearRefreshCookie(res);
      }
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.[REFRESH_COOKIE];
      if (token) await authService.logout(token);
      clearRefreshCookie(res);
      res.json({ success: true, message: "Logged out" });
    } catch (err) {
      next(err);
    }
  },
};

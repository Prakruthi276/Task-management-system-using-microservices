import { Request, Response, NextFunction } from "express";
import { userService } from "../services/user.service";
import { AppError } from "../utils/AppError";
import { listUsersQuerySchema } from "../validators/user.validator";

export const userController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.create(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = listUsersQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        const details = parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        }));
        throw new AppError("Invalid query parameters", 400, details);
      }
      const { users, meta } = await userService.getAll(parsed.data);
      res.json({ success: true, meta, data: users });
    } catch (err) {
      next(err);
    }
  },

  async getDirectory(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = listUsersQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        const details = parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        }));
        throw new AppError("Invalid query parameters", 400, details);
      }
      const { users, meta } = await userService.getDirectory(parsed.data);
      res.json({ success: true, meta, data: users });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getById(req.params.id as string);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.update(req.params.id as string, req.body);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.updateStatus(req.params.id as string, req.body.status);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  async verifyCredentials(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.verifyCredentials(req.body);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },
};

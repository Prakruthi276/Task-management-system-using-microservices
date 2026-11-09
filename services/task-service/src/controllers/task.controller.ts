import { Request, Response, NextFunction } from "express";
import { taskService } from "../services/task.service";
import { AuthUser } from "../types/auth.types";
import { TaskPriority, TaskStatus } from "../types/task.types";
import { AppError } from "../types/utils/AppError";

// authenticate has already run, but we never trust that blindly
const currentUser = (req: Request): AuthUser => {
  if (!req.user) throw new AppError("Authentication required", 401);
  return req.user;
};

export const taskController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.create(req.body, currentUser(req));
      res.status(201).json({ success: true, data: task });
    } catch (err) {
      next(err);
    }
  },

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const user = currentUser(req);
      const { status, priority, assigneeId } = req.query;
      const tasks = await taskService.getAll({
        status: status as TaskStatus | undefined,
        priority: priority as TaskPriority | undefined,
        // assigneeId=me is a shortcut for "my own tasks"
        assigneeId: assigneeId === "me" ? user.id : (assigneeId as string | undefined),
      });
      res.json({ success: true, count: tasks.length, data: tasks });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.getById(req.params.id as string);
      res.json({ success: true, data: task });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.update(req.params.id as string, req.body, currentUser(req));
      res.json({ success: true, data: task });
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.updateStatus(
        req.params.id as string,
        req.body.status,
        currentUser(req)
      );
      res.json({ success: true, data: task });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await taskService.delete(req.params.id as string, currentUser(req));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};

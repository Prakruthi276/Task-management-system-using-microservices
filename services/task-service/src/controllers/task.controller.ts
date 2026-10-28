import { Request, Response, NextFunction } from "express";
import { taskService } from "../services/task.service";
import { TaskPriority, TaskStatus } from "../types/task.types";

export const taskController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.create(req.body);
      res.status(201).json({ success: true, data: task });
    } catch (err) {
      next(err);
    }
  },

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, priority, assigneeId } = req.query;
      const tasks = await taskService.getAll({
        status: status as TaskStatus | undefined,
        priority: priority as TaskPriority | undefined,
        assigneeId: assigneeId as string | undefined,
      });
      res.json({ success: true, count: tasks.length, data: tasks });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.getById(req.params.id);
      res.json({ success: true, data: task });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.update(req.params.id, req.body);
      res.json({ success: true, data: task });
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.updateStatus(req.params.id, req.body.status);
      res.json({ success: true, data: task });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await taskService.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};

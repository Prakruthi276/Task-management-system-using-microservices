import { Task } from "@prisma/client";
import { prisma } from "../config/prisma";
import {
  STATUS_TRANSITIONS,
  TaskPriority,
  TaskStatus,
} from "../types/task.types";
import { AppError } from "../utils/AppError";

interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
}

interface TaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: string; // ISO string from the API
}

const toDate = (value?: string) => (value ? new Date(value) : undefined);

export const taskService = {
  async create(data: TaskInput): Promise<Task> {
    return prisma.task.create({
      data: { ...data, dueDate: toDate(data.dueDate) },
    });
  },

  async getAll(filters: TaskFilters = {}): Promise<Task[]> {
    return prisma.task.findMany({
      where: filters, // undefined values are ignored by Prisma
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: string): Promise<Task> {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw new AppError("Task not found", 404);
    return task;
  },

  async update(id: string, data: Partial<TaskInput>): Promise<Task> {
    await taskService.getById(id); // throws 404 if missing
    return prisma.task.update({
      where: { id },
      data: { ...data, dueDate: toDate(data.dueDate) },
    });
  },

  async updateStatus(id: string, newStatus: TaskStatus): Promise<Task> {
    const task = await taskService.getById(id);

    if (task.status === newStatus) {
      throw new AppError(`Task is already ${newStatus}`, 400);
    }

    const allowed = STATUS_TRANSITIONS[task.status];
    if (!allowed.includes(newStatus)) {
      throw new AppError(
        `Invalid status change: ${task.status} → ${newStatus}. Allowed: ${
          allowed.length ? allowed.join(", ") : "none (task is final)"
        }`,
        400
      );
    }

    return prisma.task.update({ where: { id }, data: { status: newStatus } });
  },

  async delete(id: string): Promise<void> {
    await taskService.getById(id);
    await prisma.task.delete({ where: { id } });
  },
};

import { prisma } from "../config/prisma";
import { TaskPriority, TaskStatus, STATUS_TRANSITIONS } from "../types/task.types";
import { AppError } from "../utils/AppError";
import { Task as PrismaTask } from "@prisma/client";

// Prisma returns DateTime objects; we serialise them to ISO strings
// so the rest of the app (controllers, types) stays unchanged.
function serialise(task: PrismaTask) {
  return {
    ...task,
    dueDate: task.dueDate?.toISOString() ?? undefined,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
}

export const taskService = {
  async create(data: {
    title: string;
    description?: string;
    priority?: TaskPriority;
    assigneeId?: string;
    dueDate?: string;
  }) {
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority ?? "MEDIUM",
        assigneeId: data.assigneeId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });
    return serialise(task);
  },

  async getAll(filters: TaskFilters = {}) {
    const tasks = await prisma.task.findMany({
      where: {
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.assigneeId && { assigneeId: filters.assigneeId }),
      },
      orderBy: { createdAt: "desc" },
    });
    return tasks.map(serialise);
  },

  async getById(id: string) {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw new AppError("Task not found", 404);
    return serialise(task);
  },

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      priority?: TaskPriority;
      assigneeId?: string;
      dueDate?: string;
    }
  ) {
    await this.getById(id); // throws 404 if missing
    const task = await prisma.task.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });
    return serialise(task);
  },

  async updateStatus(id: string, newStatus: TaskStatus) {
    const task = await this.getById(id);

    if (task.status === newStatus) {
      throw new AppError(`Task is already ${newStatus}`, 400);
    }

    const allowed = STATUS_TRANSITIONS[task.status as TaskStatus];
    if (!allowed.includes(newStatus)) {
      throw new AppError(
        `Invalid status change: ${task.status} → ${newStatus}. Allowed: ${
          allowed.length ? allowed.join(", ") : "none (task is final)"
        }`,
        400
      );
    }

    const updated = await prisma.task.update({
      where: { id },
      data: { status: newStatus },
    });
    return serialise(updated);
  },

  async delete(id: string) {
    await this.getById(id); // throws 404 if missing
    await prisma.task.delete({ where: { id } });
  },
};

import { Task } from "@prisma/client";
import { prisma } from "../config/prisma";
import { userClient } from "../clients/user.client";
import { AuthUser } from "../types/auth.types";
import { STATUS_TRANSITIONS, TaskPriority, TaskStatus } from "../types/task.types";
import { AppError } from "../types/utils/AppError";

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

// Ownership rule for editing, reassigning and deleting:
// admin can manage any task, a manager only tasks they created, an employee none.
const assertCanManage = (task: Task, user: AuthUser) => {
  if (user.role === "ADMIN") return;
  if (user.role === "MANAGER" && task.createdBy === user.id) return;
  throw new AppError("You are not allowed to change this task", 403);
};

// Ownership rule for status changes:
// an employee only on tasks assigned to them, everyone else follows the manage rule.
const assertCanChangeStatus = (task: Task, user: AuthUser) => {
  if (user.role === "EMPLOYEE") {
    if (task.assigneeId === user.id) return;
    throw new AppError("You can only change the status of tasks assigned to you", 403);
  }
  assertCanManage(task, user);
};

// The assignee must exist in the User Service and be active
const assertAssigneeIsValid = async (assigneeId?: string) => {
  if (!assigneeId) return;
  const assignee = await userClient.getUser(assigneeId);
  if (assignee.status !== "ACTIVE") throw new AppError("Assignee account is inactive", 400);
};

export const taskService = {
  async create(data: TaskInput, user: AuthUser): Promise<Task> {
    await assertAssigneeIsValid(data.assigneeId);
    return prisma.task.create({
      data: { ...data, dueDate: toDate(data.dueDate), createdBy: user.id },
    });
  },

  // Every logged-in user can view tasks
  async getAll(filters: TaskFilters = {}): Promise<Task[]> {
    return prisma.task.findMany({ where: filters, orderBy: { createdAt: "desc" } });
  },

  async getById(id: string): Promise<Task> {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw new AppError("Task not found", 404);
    return task;
  },

  async update(id: string, data: Partial<TaskInput>, user: AuthUser): Promise<Task> {
    const task = await taskService.getById(id);
    assertCanManage(task, user);
    await assertAssigneeIsValid(data.assigneeId);
    return prisma.task.update({
      where: { id },
      data: { ...data, dueDate: toDate(data.dueDate) },
    });
  },

  async updateStatus(id: string, newStatus: TaskStatus, user: AuthUser): Promise<Task> {
    const task = await taskService.getById(id);

    // Permission first, so an unauthorized user learns nothing about the task's state
    assertCanChangeStatus(task, user);

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

    // Conditional update: only succeeds if nobody changed the status in the meantime
    const result = await prisma.task.updateMany({
      where: { id, status: task.status },
      data: { status: newStatus },
    });
    if (result.count === 0) {
      throw new AppError("Task was changed by someone else, please retry", 409);
    }
    return taskService.getById(id);
  },

  async delete(id: string, user: AuthUser): Promise<void> {
    const task = await taskService.getById(id);
    assertCanManage(task, user);
    await prisma.task.delete({ where: { id } });
  },
};

import { z } from "zod";
import { TASK_PRIORITIES, TASK_STATUSES } from "../types/task.types";

export const createTaskSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().trim().max(1000).optional(),
  priority: z.enum(TASK_PRIORITIES).default("MEDIUM"),
  assigneeId: z.string().uuid("assigneeId must be a user id").optional(),
  dueDate: z.string().datetime({ message: "dueDate must be an ISO date" }).optional(),
});

export const updateTaskSchema = createTaskSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });

export const updateStatusSchema = z.object({
  status: z.enum(TASK_STATUSES),
});

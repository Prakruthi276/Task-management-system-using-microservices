export const TASK_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "TO_BE_TESTED",
  "TESTING_IN_PROGRESS",
  "DONE",
] as const;

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeId?: string;
  dueDate?: string; // ISO date string
  createdAt: string;
  updatedAt: string;
}

// Allowed next statuses for each current status
export const STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TODO: ["IN_PROGRESS"],
  IN_PROGRESS: ["TO_BE_TESTED"],
  TO_BE_TESTED: ["TESTING_IN_PROGRESS"],
  TESTING_IN_PROGRESS: ["DONE", "IN_PROGRESS"],
  DONE: [],
};

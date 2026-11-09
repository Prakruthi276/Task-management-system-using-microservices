export type Role = "ADMIN" | "MANAGER" | "EMPLOYEE";
export type UserStatus = "ACTIVE" | "INACTIVE";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
}

export interface DirectoryUser {
  id: string;
  name: string;
}

export type TaskStatus = "TODO" | "IN_PROGRESS" | "TO_BE_TESTED" | "TESTING_IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeId: string | null;
  dueDate: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Every successful response from our services looks like this
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PageMeta;
  count?: number;
}

// Every error response from our services looks like this
export interface ApiErrorBody {
  success: false;
  message: string;
  details?: { field: string; message: string }[];
}

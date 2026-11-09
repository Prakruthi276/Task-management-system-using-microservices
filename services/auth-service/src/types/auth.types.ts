// Role and UserStatus mirror the user-service enums.
// Defined here as plain const arrays so swagger.ts and validators can use them
// without depending on the user-service's Prisma client.
export const ROLES = ["ADMIN", "MANAGER", "EMPLOYEE"] as const;
export const USER_STATUSES = ["ACTIVE", "INACTIVE"] as const;

export type Role = (typeof ROLES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];

// Shape of the user object returned by the User Service API
export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

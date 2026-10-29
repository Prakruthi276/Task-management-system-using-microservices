export const ROLES = ["ADMIN", "MANAGER", "EMPLOYEE"] as const;
export const USER_STATUSES = ["ACTIVE", "INACTIVE"] as const;

export type Role = (typeof ROLES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];

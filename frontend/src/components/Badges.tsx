import type { Role } from "../types";

export const RoleBadge = ({ role }: { role: Role }) => (
  <span className={`badge role-${role}`}>{role.charAt(0) + role.slice(1).toLowerCase()}</span>
);

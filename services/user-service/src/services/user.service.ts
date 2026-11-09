import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { Role, UserStatus } from "../types/user.types";
import { CreateUserInput, ListUsersQuery, VerifyCredentialsInput } from "../validators/user.validator";

// passwordHash is never selected, so it can never leak in a response
const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

const SALT_ROUNDS = 10;

// The system must never end up with no active admin.
const assertNotRemovingLastAdmin = async (
  target: { id: string; role: Role; status: UserStatus },
  change: { role?: Role; status?: UserStatus }
) => {
  const losesAdmin =
    target.role === "ADMIN" &&
    target.status === "ACTIVE" &&
    ((change.role !== undefined && change.role !== "ADMIN") || change.status === "INACTIVE");
  if (!losesAdmin) return;

  const otherAdmins = await prisma.user.count({
    where: { role: "ADMIN", status: "ACTIVE", id: { not: target.id } },
  });
  if (otherAdmins === 0) throw new AppError("Cannot remove the last active admin", 409);
};

export const userService = {
  async create(input: CreateUserInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new AppError("Email already registered", 409);

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    try {
      return await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          role: input.role,
        },
        select: safeUserSelect,
      });
    } catch (err) {
      // Two requests with the same email at the same moment: the DB unique rule catches it
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new AppError("Email already registered", 409);
      }
      throw err;
    }
  },

  async getAll({ page, limit, role, status }: ListUsersQuery) {
    const where = { role, status };

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: safeUserSelect,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  // Names only, for dropdowns and for showing who a task is assigned to
  async getDirectory({ page, limit, status }: ListUsersQuery) {
    const where = { status };
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: { id: true, name: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: "asc" },
      }),
      prisma.user.count({ where }),
    ]);
    return { users, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async getById(id: string) {
    const user = await prisma.user.findUnique({ where: { id }, select: safeUserSelect });
    if (!user) throw new AppError("User not found", 404);
    return user;
  },

  async update(id: string, data: { name?: string; role?: Role }) {
    const user = await userService.getById(id);
    await assertNotRemovingLastAdmin(user, { role: data.role });
    return prisma.user.update({ where: { id }, data, select: safeUserSelect });
  },

  async updateStatus(id: string, status: UserStatus) {
    const user = await userService.getById(id);
    if (user.status === status) throw new AppError(`User is already ${status}`, 400);
    await assertNotRemovingLastAdmin(user, { status });
    return prisma.user.update({ where: { id }, data: { status }, select: safeUserSelect });
  },

  // Called by the auth-service at login time. Checks the password and returns the safe user.
  // Both wrong email and wrong password return the same 401 to prevent user enumeration.
  async verifyCredentials({ email, password }: VerifyCredentialsInput) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError("Invalid email or password", 401);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError("Invalid email or password", 401);

    // Return the safe shape — passwordHash never leaves this service
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  },
};

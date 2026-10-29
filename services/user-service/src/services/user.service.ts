import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { Role, UserStatus } from "../types/user.types";
import { CreateUserInput, ListUsersQuery } from "../validators/user.validator";

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

  async getById(id: string) {
    const user = await prisma.user.findUnique({ where: { id }, select: safeUserSelect });
    if (!user) throw new AppError("User not found", 404);
    return user;
  },

  async update(id: string, data: { name?: string; role?: Role }) {
    await userService.getById(id);
    return prisma.user.update({ where: { id }, data, select: safeUserSelect });
  },

  async updateStatus(id: string, status: UserStatus) {
    const user = await userService.getById(id);
    if (user.status === status) throw new AppError(`User is already ${status}`, 400);
    return prisma.user.update({ where: { id }, data: { status }, select: safeUserSelect });
  },
};

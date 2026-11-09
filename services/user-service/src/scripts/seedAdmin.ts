import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "System Admin";

  if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env");
  if (
    password.length < 8 ||
    password.length > 72 ||
    !/^(?=.*[A-Za-z])(?=.*\d).+$/.test(password)
  ) {
    throw new Error("ADMIN_PASSWORD must be 8–72 characters with a letter and a number");
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role === "ADMIN" && existing.status === "ACTIVE") {
      console.log(`${email} is already an active admin. Nothing changed.`);
      return;
    }
    // The account was registered earlier as an employee: promote it
    await prisma.user.update({ where: { email }, data: { role: "ADMIN", status: "ACTIVE" } });
    console.log(`Existing user ${email} promoted to ADMIN.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name, email, passwordHash, role: "ADMIN" } });
  console.log(`Admin created: ${email}`);
}

main()
  .catch((err) => {
    console.error((err as Error).message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

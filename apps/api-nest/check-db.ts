import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findUnique({ where: { email: 'juan.perez@student.edu' } });
  if (!user) {
    console.log("User not found!");
    return;
  }
  console.log("User found:", user.email, "role:", user.role);
  const isValid = await bcrypt.compare('Admin123!', user.password_hash);
  console.log("Password Admin123! valid?", isValid);
}
check().finally(() => prisma.$disconnect());

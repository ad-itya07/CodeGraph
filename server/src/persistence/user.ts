import { DatabaseError } from "@/errors/DatabaseError.js";
import prisma from "@/lib/prisma.js";

async function findUserByEmail(email: string) {
  try {
    return await prisma.user.findUnique({
      where: { email },
    });
  } catch (err: any) {
    throw new DatabaseError(err.message);
  }
}

async function findUserById(id: string) {
  try {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } catch (err: any) {
    throw new DatabaseError(err.message);
  }
}

async function createUser(name: string, email: string, hashedPassword: string) {
  try {
    return await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } catch (err: any) {
    throw new DatabaseError(err.message);
  }
}

export { findUserByEmail, findUserById, createUser };

import { DatabaseError } from "@/errors/DatabaseError.js";
import prisma from "@/lib/prisma.js";

async function findRepository(url: string) {
  try {
    return prisma.repository.findFirst({
      where: { url },
    });
  } catch (err: any) {
    throw new DatabaseError(err.message);
  }
}

async function findRepositoryById(id:string){
  try {
    return prisma.repository.findFirst({
      where: { id },
    });
  } catch (err: any) {
    throw new DatabaseError(err.message);
  }
}

async function createRepository(url: string) {
  try {
    return prisma.repository.create({
      data: { url, name: url.split("/")[url.split("/").length - 1] },
    });
  } catch (err: any) {
    throw new DatabaseError(err.message);
  }
}

async function getAllRepositories() {
  try {
    return prisma.repository.findMany();
  } catch (err: any) {
    throw new DatabaseError(err.message);
  }
}

export {
  findRepository,
  createRepository,
  getAllRepositories,
  findRepositoryById,
};
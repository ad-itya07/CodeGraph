import { RepositoryOverview } from "@/analytics/overview/models/RepositoryOverview.js";
import { DatabaseError } from "@/errors/DatabaseError.js";
import prisma from "@/lib/prisma.js";
import { Prisma } from "@prisma/client";

async function findRepository(url: string) {
  try {
    return await prisma.repository.findFirst({
      where: { url },
    });
  } catch (err: any) {
    throw new DatabaseError(err.message);
  }
}

async function findRepositoryById(id: string) {
  try {
    return await prisma.repository.findFirst({
      where: { id },
      include: {
        overview: true,
      },
    });
  } catch (err: any) {
    throw new DatabaseError(err.message);
  }
}

async function createRepository(url: string) {
  try {
    return await prisma.repository.create({
      data: { url, name: url.split("/")[url.split("/").length - 1] },
    });
  } catch (err: any) {
    throw new DatabaseError(err.message);
  }
}

async function getAllRepositories() {
  try {
    return await prisma.repository.findMany();
  } catch (err: any) {
    throw new DatabaseError(err.message);
  }
}

async function updateRepositoryCommitSha(repositoryId: string, commitSha: string) {
  try {
    return await prisma.repository.update({
      where: { id: repositoryId },
      data: { commitSha },
    });
  } catch (err: any) {
    throw new DatabaseError(err.message);
  }
}

async function upsertRepositoryOverview(repositoryId: string, overview: RepositoryOverview) {
    try {
        return await prisma.repositoryOverview.upsert({
            where: {
                repositoryId,
            },

            create: {
                repositoryId,
                statistics: overview.statistics as unknown as Prisma.InputJsonValue,
                health: overview.health as unknown as Prisma.InputJsonValue,
                insights: overview.insights as unknown as Prisma.InputJsonValue,
            },

            update: {
                statistics: overview.statistics as unknown as Prisma.InputJsonValue,
                health: overview.health as unknown as Prisma.InputJsonValue,
                insights: overview.insights as unknown as Prisma.InputJsonValue,
            },
        });
    } catch (err: any) {
        throw new DatabaseError(err.message);
    }
}

export {
  findRepository,
  createRepository,
  getAllRepositories,
  findRepositoryById,
  updateRepositoryCommitSha,
  upsertRepositoryOverview,
};
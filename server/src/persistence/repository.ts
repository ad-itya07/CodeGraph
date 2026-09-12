import { RepositoryOverview } from "@/analytics/overview/models/RepositoryOverview.js";
import { DatabaseError } from "@/errors/DatabaseError.js";
import prisma from "@/lib/prisma.js";
import { Prisma } from "@prisma/client";

async function findRepositoriesByUserId(userId: string) {
  try {
    return await prisma.repository.findMany({
      where: { userId },
      include: {
        overview: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (err: any) {
    throw new DatabaseError(err.message);
  }
}

async function findRepositoryByUrl(url: string, userId: string) {
  try {
    return await prisma.repository.findFirst({
      where: { url, userId },
    });
  } catch (err: any) {
    throw new DatabaseError(err.message);
  }
}

async function findRepositoryById(id: string, userId: string) {
  try {
    return await prisma.repository.findFirst({
      where: { id, userId },
      include: {
        overview: true,
      },
    });
  } catch (err: any) {
    throw new DatabaseError(err.message);
  }
}

async function createRepository(url: string, userId: string) {
  try {
    return await prisma.repository.create({
      data: {
        url,
        name: url.split("/")[url.split("/").length - 1],
        userId,
      },
    });
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
  findRepositoriesByUserId,
  findRepositoryByUrl,
  createRepository,
  findRepositoryById,
  updateRepositoryCommitSha,
  upsertRepositoryOverview,
};
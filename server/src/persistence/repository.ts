import { RepositoryOverview } from "@/analytics/overview/models/RepositoryOverview.js";
import { DatabaseError } from "@/errors/DatabaseError.js";
import prisma from "@/lib/prisma.js";
import { Prisma, RepositoryStatus, RepositoryStage } from "@prisma/client";

async function findRepositoriesByUserId(userId: string) {
  try {
    return await prisma.repository.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  } catch (err: any) {
    throw new DatabaseError(err.message);
  }
}

async function findRepositoryOverviewsByUserId(userId: string) {
  try {
    return await prisma.repositoryOverview.findMany({
      where: {
        repository: {
          userId,
          status: RepositoryStatus.READY,
        },
      },
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

async function findRepositoryById(id: string, userId?: string) {
  try {
    const whereClause: Prisma.RepositoryWhereInput = { id };
    if (userId) {
      whereClause.userId = userId;
    }
    return await prisma.repository.findFirst({
      where: whereClause,
      include: {
        overview: true,
      },
    });
  } catch (err: any) {
    throw new DatabaseError(err.message);
  }
}

async function findActiveRepositoryByUserId(userId: string) {
  try {
    return await prisma.repository.findFirst({
      where: {
        userId,
        status: {
          in: [RepositoryStatus.QUEUED, RepositoryStatus.PROCESSING],
        },
      },
    });
  } catch (err: any) {
    throw new DatabaseError(err.message);
  }
}

async function createRepository(url: string, userId: string) {
  try {
    const segments = url.split("/").filter(Boolean);
    const name = segments[segments.length - 1] || "repository";

    return await prisma.repository.create({
      data: {
        url,
        name,
        userId,
        status: RepositoryStatus.QUEUED,
        currentStage: null,
        failedStage: null,
        errorCode: null,
      },
    });
  } catch (err: any) {
    throw new DatabaseError(err.message);
  }
}

async function updateRepositoryStatus(
  id: string,
  params: {
    status: RepositoryStatus;
    currentStage?: RepositoryStage | null;
    failedStage?: RepositoryStage | null;
    errorCode?: string | null;
  }
) {
  try {
    return await prisma.repository.update({
      where: { id },
      data: {
        status: params.status,
        ...(params.currentStage !== undefined && { currentStage: params.currentStage }),
        ...(params.failedStage !== undefined && { failedStage: params.failedStage }),
        ...(params.errorCode !== undefined && { errorCode: params.errorCode }),
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

async function resetRepositoryForRetry(repositoryId: string) {
  try {
    return await prisma.repository.update({
      where: { id: repositoryId },
      data: {
        status: RepositoryStatus.QUEUED,
        currentStage: null,
        failedStage: null,
        errorCode: null,
      },
    });
  } catch (err: any) {
    throw new DatabaseError(err.message);
  }
}

async function deleteRepositoryGraphAndOverview(repositoryId: string) {
  try {
    await prisma.graph.deleteMany({
      where: { repositoryId },
    });
    await prisma.repositoryOverview.deleteMany({
      where: { repositoryId },
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
  findRepositoryOverviewsByUserId,
  findRepositoryByUrl,
  findRepositoryById,
  findActiveRepositoryByUserId,
  createRepository,
  updateRepositoryStatus,
  updateRepositoryCommitSha,
  resetRepositoryForRetry,
  deleteRepositoryGraphAndOverview,
  upsertRepositoryOverview,
};
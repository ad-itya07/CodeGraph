import { ConflictError } from "@/errors/ConfictError.js";
import { NotFoundError } from "@/errors/NotFoundError.js";
import { ValidationError } from "@/errors/ValidationError.js";
import { createGraph, getGraph } from "@/persistence/graph.js";
import {
  createRepository,
  findRepositoryByUrl,
  findRepositoryById,
  findRepositoriesByUserId,
  findActiveRepositoryByUserId,
  resetRepositoryForRetry,
  deleteRepositoryGraphAndOverview,
  findRepositoryOverviewsByUserId,
} from "@/persistence/repository.js";
import { analysisQueue } from "@/lib/queue.js";
import cacheService from "./cache.service.js";
import { RepositoryStatus } from "@prisma/client";

class RepositoryService {
  async createRepository(url: string, userId: string) {
    if (!url || typeof url !== "string") {
      throw new ValidationError("Valid URL is required");
    }

    // 1. Enforce: One active analysis per user rule
    const activeRepo = await findActiveRepositoryByUserId(userId);
    if (activeRepo) {
      throw new ConflictError(
        "An analysis is already in progress for another repository. Please wait for it to complete."
      );
    }

    // 2. Check duplicate repository rules
    const existingRepo = await findRepositoryByUrl(url, userId);

    if (existingRepo) {
      if (existingRepo.status === RepositoryStatus.READY) {
        throw new ConflictError("Repository already exists");
      }

      if (
        existingRepo.status === RepositoryStatus.QUEUED ||
        existingRepo.status === RepositoryStatus.PROCESSING
      ) {
        throw new ConflictError("Repository is currently being analyzed");
      }

      // If FAILED, reuse and reset for retry
      if (existingRepo.status === RepositoryStatus.FAILED) {
        await deleteRepositoryGraphAndOverview(existingRepo.id);
        const updatedRepo = await resetRepositoryForRetry(existingRepo.id);

        await analysisQueue.add(
          "analyze",
          { repositoryId: existingRepo.id, userId },
          { jobId: `repo:${existingRepo.id}:${Date.now()}` }
        );

        await cacheService.delete(`user:overview:${userId}`);
        await cacheService.delete(`repository:${userId}:${existingRepo.id}`);

        return {
          repository: updatedRepo,
        };
      }
    }

    // 3. Create repository row immediately with QUEUED status
    const repository = await createRepository(url, userId);

    // 4. Enqueue BullMQ analysis job
    await analysisQueue.add(
      "analyze",
      { repositoryId: repository.id, userId },
      { jobId: `repo:${repository.id}:${Date.now()}` }
    );

    // Invalidate dashboard overview cache
    await cacheService.delete(`user:overview:${userId}`);

    return {
      repository,
    };
  }

  async getRepositoryStatus(id: string, userId: string) {
    if (!id) throw new ValidationError("ID is required");

    const repository = await findRepositoryById(id, userId);
    if (!repository) {
      throw new NotFoundError("Repository not found");
    }

    return {
      id: repository.id,
      status: repository.status,
      currentStage: repository.currentStage,
      failedStage: repository.failedStage,
      errorCode: repository.errorCode,
      updatedAt: repository.updatedAt,
    };
  }

  async retryRepository(id: string, userId: string) {
    if (!id) throw new ValidationError("ID is required");

    const repository = await findRepositoryById(id, userId);
    if (!repository) {
      throw new NotFoundError("Repository not found");
    }

    if (repository.status !== RepositoryStatus.FAILED) {
      throw new ValidationError("Only failed repositories can be retried");
    }

    // Enforce 1 active analysis per user rule
    const activeRepo = await findActiveRepositoryByUserId(userId);
    if (activeRepo) {
      throw new ConflictError(
        "An analysis is already in progress for another repository. Please wait for it to complete."
      );
    }

    // Clean partial graph/overview records
    await deleteRepositoryGraphAndOverview(id);

    // Reset status to QUEUED
    const updated = await resetRepositoryForRetry(id);

    // Enqueue new job
    await analysisQueue.add(
      "analyze",
      { repositoryId: id, userId },
      { jobId: `repo:${id}:${Date.now()}` }
    );

    await cacheService.delete(`user:overview:${userId}`);
    await cacheService.delete(`repository:${userId}:${id}`);

    return {
      repository: updated,
    };
  }

  async getUserRepositories(userId: string) {
    return await findRepositoriesByUserId(userId);
  }

  async getRepository(id: string, userId: string) {
    if (!id) throw new ValidationError("ID is required");

    const cacheKey = `repository:${userId}:${id}`;

    const cachedRepository = await cacheService.get(cacheKey);
    if (cachedRepository) {
      return JSON.parse(cachedRepository);
    }

    const repository = await findRepositoryById(id, userId);
    if (!repository) throw new NotFoundError("Repository not found");

    if (repository.status === RepositoryStatus.READY) {
      await cacheService.set(
        cacheKey,
        JSON.stringify(repository),
        7 * 24 * 60 * 60
      );
    }

    return repository;
  }

  async getRepositoryGraph(id: string, userId: string) {
    if (!id) throw new ValidationError("ID is required");

    const repository = await findRepositoryById(id, userId);
    if (!repository) throw new NotFoundError("Repository not found");

    if (repository.status !== RepositoryStatus.READY) {
      throw new ValidationError("Repository analysis is still in progress or failed");
    }

    return await getGraph(id);
  }

  async getUserOverview(userId: string) {
    if (!userId) throw new ValidationError("User ID is required");

    const cacheKey = `user:overview:${userId}`;

    const cachedOverview = await cacheService.get(cacheKey);
    if (cachedOverview) {
      try {
        return JSON.parse(cachedOverview);
      } catch (err) {
        console.error("Failed to parse cached user overview:", err);
      }
    }

    const overviews = await findRepositoryOverviewsByUserId(userId);
    const repositories = await findRepositoriesByUserId(userId);
    const readyRepositories = repositories.filter(
      (r) => r.status === RepositoryStatus.READY
    );

    let totalCodeEntities = 0;
    let totalRelationships = 0;
    let totalHealthScore = 0;

    for (const overview of overviews) {
      const stats = overview.statistics as any;
      const health = overview.health as any;

      if (stats) {
        totalCodeEntities += stats.symbolCount || 0;
        totalRelationships += stats.relationshipCount || 0;
      }
      if (health && typeof health.index === "number") {
        totalHealthScore += health.index;
      }
    }

    const repositoryCount = readyRepositories.length;
    const averageHealthIndex =
      overviews.length > 0 ? Math.round(totalHealthScore / overviews.length) : 0;

    const result = {
      repositoryCount,
      totalCodeEntities,
      totalRelationships,
      averageHealthIndex,
    };

    await cacheService.set(
      cacheKey,
      JSON.stringify(result),
      7 * 24 * 60 * 60
    );

    return result;
  }
}

export default new RepositoryService();
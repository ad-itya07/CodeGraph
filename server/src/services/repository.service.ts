import { ConflictError } from "@/errors/ConfictError.js";
import { NotFoundError } from "@/errors/NotFoundError.js";
import { ValidationError } from "@/errors/ValidationError.js";
import { createGraph, getGraph } from "@/persistence/graph.js";
import { createRepository, findRepositoryByUrl, findRepositoryById, findRepositoriesByUserId, upsertRepositoryOverview } from "@/persistence/repository.js";
import repositoryProcessorService from "@/services/repositoryProcessor.service.js";
import cacheService from "./cache.service.js";

class RepositoryService {
  async createRepository(url: string, userId: string) {
    if (!url) throw new ValidationError("URL is required");

    const existingRepo = await findRepositoryByUrl(url, userId);

    if (existingRepo) throw new ConflictError("Repository already exists");

    const repository = await createRepository(url, userId);
    const result = await repositoryProcessorService.process(repository.id, repository.url);

    await createGraph(repository.id, result.graph);
    await upsertRepositoryOverview(repository.id, result.overview);

    return {
      repository,
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

    await cacheService.set(
      cacheKey,
      JSON.stringify(repository),
      7 * 24 * 60 * 60
    );

    return repository;
  }

  async getRepositoryGraph(id: string, userId: string) {
    if (!id) throw new ValidationError("ID is required");

    const repository = await findRepositoryById(id, userId);
    if (!repository) throw new NotFoundError("Repository not found");

    return await getGraph(id);
  }
}

export default new RepositoryService();
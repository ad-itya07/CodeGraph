import { ConflictError } from "@/errors/ConfictError.js";
import { NotFoundError } from "@/errors/NotFoundError.js";
import { ValidationError } from "@/errors/ValidationError.js";
import { createGraph } from "@/persistence/graph.js";
import { createRepository, findRepository, findRepositoryById } from "@/persistence/repository.js";
import repositoryProcessorService from "@/services/repositoryProcessor.service.js";

class RepositoryService {
  async createRepository(url: string) {
    if (!url) throw new ValidationError("URL is required");

    const existingRepo = await findRepository(url);

    if (existingRepo) throw new ConflictError("Repository already exists");

    const repository = await createRepository(url);
    const result = await repositoryProcessorService.process(repository.id, repository.url);

    await createGraph(repository.id, result.graph);

    return {
      repository,
    };
  }

  async getRepository(id: string) {
    if (!id) throw new ValidationError("ID is required");

    const repository = await findRepositoryById(id);

    if (!repository) throw new NotFoundError("Repository not found");
    return repository;
  }
}

export default new RepositoryService();
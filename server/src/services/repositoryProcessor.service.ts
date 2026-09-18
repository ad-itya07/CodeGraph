import fs from "fs";
import path from "path";
import { Parser, ParserStage } from "@/parser/index.js";
import {
  updateRepositoryCommitSha,
  updateRepositoryStatus,
  upsertRepositoryOverview,
  deleteRepositoryGraphAndOverview,
  findRepositoryById,
} from "@/persistence/repository.js";
import { createGraph } from "@/persistence/graph.js";
import { cloneRepo } from "@/utils/git/cloneRepo.js";
import { getCommitSha } from "@/utils/git/getCommitSha.js";
import { GraphBuilder } from "@/graph/GraphBuilder.js";
import RepositoryOverviewAnalyzer from "@/analytics/overview/RepositoryOverviewAnalyzer.js";
import cacheService from "./cache.service.js";
import { RepositoryStatus, RepositoryStage } from "@prisma/client";
import { NoSupportedFileError } from "@/errors/NoSupportedFileError.js";
import { RepoCloneError } from "@/errors/RepoCloneError.js";
import { CommitShaError } from "@/errors/CommitShaError.js";

class RepositoryProcessorService {
  async processJob(repositoryId: string, userId: string) {
    const repository = await findRepositoryById(repositoryId, userId);
    if (!repository) {
      console.error(`RepositoryProcessor: repository ${repositoryId} not found`);
      return;
    }

    const clonePath = path.join("uploads", `repo-${repositoryId}`);
    let activeStage: RepositoryStage = RepositoryStage.CLONING;

    try {
      // 1. Mark as PROCESSING in CLONING stage
      await updateRepositoryStatus(repositoryId, {
        status: RepositoryStatus.PROCESSING,
        currentStage: RepositoryStage.CLONING,
        failedStage: null,
        errorCode: null,
      });

      // Clear any partial graph/overview from previous runs
      await deleteRepositoryGraphAndOverview(repositoryId);

      // Ensure uploads directory exists
      if (!fs.existsSync("uploads")) {
        fs.mkdirSync("uploads", { recursive: true });
      }

      // Clone repository
      await cloneRepo(repository.url, clonePath);

      // Extract commit SHA (optional, non-fatal if git commit sha fails)
      try {
        const commitSha = getCommitSha(clonePath);
        if (commitSha) {
          await updateRepositoryCommitSha(repositoryId, commitSha);
        }
      } catch (shaErr) {
        console.warn(`Could not extract commit SHA for repo ${repositoryId}:`, shaErr);
      }

      // 2. Parse repository with stage updates
      const parser = new Parser();
      const parsedRepository = await parser.parse(
        clonePath,
        async (stage: ParserStage) => {
          activeStage = stage as RepositoryStage;
          await updateRepositoryStatus(repositoryId, {
            status: RepositoryStatus.PROCESSING,
            currentStage: stage as RepositoryStage,
          });
        }
      );

      // 3. Building Code Graph & Overview
      activeStage = RepositoryStage.BUILDING_GRAPH;
      await updateRepositoryStatus(repositoryId, {
        status: RepositoryStatus.PROCESSING,
        currentStage: RepositoryStage.BUILDING_GRAPH,
      });

      const graphBuilder = new GraphBuilder();
      const graph = graphBuilder.build(parsedRepository);

      const overview = new RepositoryOverviewAnalyzer(graph).analyze();

      // Persist graph and overview
      await createGraph(repositoryId, graph);
      await upsertRepositoryOverview(repositoryId, overview);

      // 4. Mark as READY
      await updateRepositoryStatus(repositoryId, {
        status: RepositoryStatus.READY,
        currentStage: null,
        failedStage: null,
        errorCode: null,
      });

      // Invalidate relevant Redis caches
      await cacheService.delete(`user:overview:${userId}`);
      await cacheService.delete(`repository:${userId}:${repositoryId}`);

      return {
        parsedRepository,
        graph,
        overview,
      };
    } catch (err: unknown) {
      console.error(`RepositoryProcessor: Failed to process repository ${repositoryId}:`, err);

      let errorCode = "ANALYSIS_FAILED";
      if (err instanceof RepoCloneError) {
        errorCode = "CLONE_FAILED";
      } else if (err instanceof NoSupportedFileError) {
        errorCode = "NO_SUPPORTED_FILES";
      } else if (err instanceof CommitShaError) {
        errorCode = "COMMIT_SHA_ERROR";
      }

      await updateRepositoryStatus(repositoryId, {
        status: RepositoryStatus.FAILED,
        currentStage: null,
        failedStage: activeStage,
        errorCode,
      });

      // Invalidate overview cache so counts stay fresh
      await cacheService.delete(`user:overview:${userId}`);
      await cacheService.delete(`repository:${userId}:${repositoryId}`);

      throw err;
    } finally {
      // Clean up cloned files from disk
      if (fs.existsSync(clonePath)) {
        try {
          fs.rmSync(clonePath, {
            recursive: true,
            force: true,
          });
        } catch (cleanupErr) {
          console.error(`Failed to clean up clone path ${clonePath}:`, cleanupErr);
        }
      }
    }
  }
}

export default new RepositoryProcessorService();
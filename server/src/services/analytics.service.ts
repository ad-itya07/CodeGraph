import { NotFoundError } from "@/errors/NotFoundError.js";
import { ValidationError } from "@/errors/ValidationError.js";
import { getGraph } from "@/persistence/graph.js";
import { findRepositoryById } from "@/persistence/repository.js";
import { AnalysisEngine } from "@/analytics/AnalysisEngine.js";
import { ImpactAnalysisOptions } from "@/analytics/impact/models/ImpactAnalysisOptions.js";
import { DependencyAnalysisOptions } from "@/analytics/dependency/models/DependencyAnalysisOptions.js";
import { CycleAnalysisOptions } from "@/analytics/cycles/models/CycleAnalysisOptions.js";
import cacheService from "./cache.service.js";


interface AnalyzeImpactParams {
    repositoryId: string;
    userId: string;
    sourceNodeId: string;
    options?: ImpactAnalysisOptions;
}

interface AnalyzeDependenciesParams {
    repositoryId: string;
    userId: string;
    sourceNodeId: string;
    options?: DependencyAnalysisOptions;
}

interface AnalyzeCallPathParams {
    repositoryId: string;
    userId: string;
    sourceNodeId: string;
    targetNodeId: string;
}

interface AnalyzeCyclesParams {
    repositoryId: string;
    userId: string;
    options?: CycleAnalysisOptions;
}

interface AnalyzeDependencyOrderingParams {
    repositoryId: string;
    userId: string;
    sourceNodeId: string;
}

interface AnalyzeConnectivityParams {
    repositoryId: string;
    userId: string;
    nodeId: string;
}

class AnalyticsService {
    async analyzeImpact({ repositoryId, userId, sourceNodeId, options }: AnalyzeImpactParams) {
        if (!repositoryId) {
            throw new ValidationError("Repository ID is required");
        }

        if (!sourceNodeId) {
            throw new ValidationError("Source node ID is required");
        }

        const maxDepth = options?.maxDepth ?? "default";

        const cacheKey = `analysis:impact:${repositoryId}:${sourceNodeId}:${maxDepth}`;
        const cachedResult = await cacheService.get(cacheKey);
        if (cachedResult) {
            return JSON.parse(cachedResult);
        }

        const repository = await findRepositoryById(repositoryId, userId);

        if (!repository) {
            throw new NotFoundError("Repository not found");
        }

        const graph = await getGraph(repositoryId);

        const analysisEngine = new AnalysisEngine(graph);

        const result = analysisEngine.analyzeImpact(sourceNodeId, options);

        const response = {
            sourceNodeId: result.sourceNodeId,
            impactedNodeIds: result.impactedNodeIds,
            depthByNode: Object.fromEntries(result.depthByNode),
        };

        await cacheService.set(
            cacheKey,
            JSON.stringify(response),
            12 * 60 * 60
        );

        return response;
    }

    async analyzeDependencies({ repositoryId, userId, sourceNodeId, options }: AnalyzeDependenciesParams) {
        if (!repositoryId) {
            throw new ValidationError("Repository ID is required");
        }

        if (!sourceNodeId) {
            throw new ValidationError("Source node ID is required");
        }

        const maxDepth = options?.maxDepth ?? "default";

        const cacheKey = `analysis:dependencies:${repositoryId}:${sourceNodeId}:${maxDepth}`;

        const cachedResult = await cacheService.get(cacheKey);

        if (cachedResult) {
            return JSON.parse(cachedResult);
        }

        const repository = await findRepositoryById(repositoryId, userId);

        if (!repository) {
            throw new NotFoundError("Repository not found");
        }

        const graph = await getGraph(repositoryId);

        const analysisEngine = new AnalysisEngine(graph);

        const result = analysisEngine.analyzeDependencies(sourceNodeId, options);

        const response = {
            sourceNodeId: result.sourceNodeId,
            dependencyNodeIds: result.dependencyNodeIds,
            depthByNode: Object.fromEntries(result.depthByNode),
        };

        await cacheService.set(
            cacheKey,
            JSON.stringify(response),
            12 * 60 * 60
        );

        return response;
    }

    async analyzeCallPath({ repositoryId, userId, sourceNodeId, targetNodeId }: AnalyzeCallPathParams) {
        if (!repositoryId) {
            throw new ValidationError("Repository ID is required");
        }

        if (!sourceNodeId) {
            throw new ValidationError("Source node ID is required");
        }

        if (!targetNodeId) {
            throw new ValidationError("Target node ID is required");
        }

        const cacheKey = `analysis:paths:${repositoryId}:${sourceNodeId}:${targetNodeId}`;

        const cachedResult = await cacheService.get(cacheKey);

        if (cachedResult) {
            return JSON.parse(cachedResult);
        }

        const repository = await findRepositoryById(repositoryId, userId);

        if (!repository) {
            throw new NotFoundError("Repository not found");
        }

        const graph = await getGraph(repositoryId);

        const analysisEngine = new AnalysisEngine(graph);

        const result = analysisEngine.analyzeCallPath(sourceNodeId, targetNodeId);

        await cacheService.set(
            cacheKey,
            JSON.stringify(result),
            12 * 60 * 60
        );

        return result;
    }

    async analyzeCycles({ repositoryId, userId, options }: AnalyzeCyclesParams) {
        if (!repositoryId) {
            throw new ValidationError("Repository ID is required");
        }

        const cacheKey = `analysis:cycles:${repositoryId}`;

        const cachedResult = await cacheService.get(cacheKey);

        if (cachedResult) {
            return JSON.parse(cachedResult);
        }

        const repository = await findRepositoryById(repositoryId, userId);

        if (!repository) {
            throw new NotFoundError("Repository not found");
        }

        const graph = await getGraph(repositoryId);

        const analysisEngine = new AnalysisEngine(graph);

        const result = analysisEngine.analyzeCycles(options);

        await cacheService.set(
            cacheKey,
            JSON.stringify(result),
            12 * 60 * 60
        );

        return result;
    }

    async analyzeDependencyOrdering({ repositoryId, userId, sourceNodeId }: AnalyzeDependencyOrderingParams) {
        if (!repositoryId) {
            throw new ValidationError("Repository ID is required");
        }

        if (!sourceNodeId) {
            throw new ValidationError("Source node ID is required");
        }

        const cacheKey = `analysis:ordering:${repositoryId}:${sourceNodeId}`;

        const cachedResult = await cacheService.get(cacheKey);

        if (cachedResult) {
            return JSON.parse(cachedResult);
        }

        const repository = await findRepositoryById(repositoryId, userId);

        if (!repository) {
            throw new NotFoundError("Repository not found");
        }

        const graph = await getGraph(repositoryId);

        const analysisEngine = new AnalysisEngine(graph);

        const result = analysisEngine.analyzeDependencyOrdering(sourceNodeId);

        await cacheService.set(
            cacheKey,
            JSON.stringify(result),
            12 * 60 * 60
        );

        return result;
    }

    async analyzeConnectivity({ repositoryId, userId, nodeId }: AnalyzeConnectivityParams) {
        if (!repositoryId) {
            throw new ValidationError("Repository ID is required");
        }

        if (!nodeId) {
            throw new ValidationError("Node ID is required");
        }

        const cacheKey = `analysis:connectivity:${repositoryId}:${nodeId}`;

        const cachedResult = await cacheService.get(cacheKey);

        if (cachedResult) {
            return JSON.parse(cachedResult);
        }

        const repository = await findRepositoryById(repositoryId, userId);

        if (!repository) {
            throw new NotFoundError("Repository not found");
        }

        const graph = await getGraph(repositoryId);

        const analysisEngine = new AnalysisEngine(graph);

        const result = analysisEngine.analyzeFanInOut(nodeId);

        await cacheService.set(
            cacheKey,
            JSON.stringify(result),
            12 * 60 * 60
        );

        return result;
    }
}

export default new AnalyticsService();
import { NotFoundError } from "@/errors/NotFoundError.js";
import { ValidationError } from "@/errors/ValidationError.js";
import { getGraph } from "@/persistence/graph.js";
import { findRepositoryById } from "@/persistence/repository.js";
import { AnalysisEngine } from "@/analytics/AnalysisEngine.js";
import { ImpactAnalysisOptions } from "@/analytics/impact/models/ImpactAnalysisOptions.js";
import { DependencyAnalysisOptions } from "@/analytics/dependency/models/DependencyAnalysisOptions.js";
import { CycleAnalysisOptions } from "@/analytics/cycles/models/CycleAnalysisOptions.js";


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

class AnalyticsService {
    async analyzeImpact({ repositoryId, userId, sourceNodeId, options }: AnalyzeImpactParams) {
        if (!repositoryId) {
            throw new ValidationError("Repository ID is required");
        }

        if (!sourceNodeId) {
            throw new ValidationError("Source node ID is required");
        }

        const repository = await findRepositoryById(repositoryId, userId);

        if (!repository) {
            throw new NotFoundError("Repository not found");
        }

        const graph = await getGraph(repositoryId);

        const analysisEngine = new AnalysisEngine(graph);

        const result = analysisEngine.analyzeImpact(sourceNodeId, options);

        return {
            sourceNodeId: result.sourceNodeId,
            impactedNodeIds: result.impactedNodeIds,
            depthByNode: Object.fromEntries(result.depthByNode),
        };
    }

    async analyzeDependencies({ repositoryId, userId, sourceNodeId, options }: AnalyzeDependenciesParams) {
        if (!repositoryId) {
            throw new ValidationError("Repository ID is required");
        }

        if (!sourceNodeId) {
            throw new ValidationError("Source node ID is required");
        }

        const repository = await findRepositoryById(repositoryId, userId);

        if (!repository) {
            throw new NotFoundError("Repository not found");
        }

        const graph = await getGraph(repositoryId);

        const analysisEngine = new AnalysisEngine(graph);

        const result = analysisEngine.analyzeDependencies(sourceNodeId, options);

        return {
            sourceNodeId: result.sourceNodeId,
            dependencyNodeIds: result.dependencyNodeIds,
            depthByNode: Object.fromEntries(result.depthByNode),
        };
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

        const repository = await findRepositoryById(repositoryId, userId);

        if (!repository) {
            throw new NotFoundError("Repository not found");
        }

        const graph = await getGraph(repositoryId);

        const analysisEngine = new AnalysisEngine(graph);

        return analysisEngine.analyzeCallPath(sourceNodeId, targetNodeId);
    }

    async analyzeCycles({ repositoryId, userId, options }: AnalyzeCyclesParams) {
        if (!repositoryId) {
            throw new ValidationError("Repository ID is required");
        }

        const repository = await findRepositoryById(repositoryId, userId);

        if (!repository) {
            throw new NotFoundError("Repository not found");
        }

        const graph = await getGraph(repositoryId);

        const analysisEngine = new AnalysisEngine(graph);

        return analysisEngine.analyzeCycles(options);
    }

    async analyzeDependencyOrdering({ repositoryId, userId, sourceNodeId }: AnalyzeDependencyOrderingParams) {
        if (!repositoryId) {
            throw new ValidationError("Repository ID is required");
        }

        if (!sourceNodeId) {
            throw new ValidationError("Source node ID is required");
        }

        const repository = await findRepositoryById(repositoryId, userId);

        if (!repository) {
            throw new NotFoundError("Repository not found");
        }

        const graph = await getGraph(repositoryId);

        const analysisEngine = new AnalysisEngine(graph);

        return analysisEngine.analyzeDependencyOrdering(sourceNodeId);
    }
}

export default new AnalyticsService();
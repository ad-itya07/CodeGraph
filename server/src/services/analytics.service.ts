import { NotFoundError } from "@/errors/NotFoundError.js";
import { ValidationError } from "@/errors/ValidationError.js";
import { getGraph } from "@/persistence/graph.js";
import { findRepositoryById } from "@/persistence/repository.js";
import { AnalysisEngine } from "@/analytics/AnalysisEngine.js";
import { ImpactAnalysisOptions } from "@/analytics/impact/models/ImpactAnalysisOptions.js";
import { DependencyAnalysisOptions } from "@/analytics/dependency/models/DependencyAnalysisOptions.js";
import { CycleAnalysisOptions } from "@/analytics/cycles/models/CycleAnalysisOptions.js";
import { Graph } from "@/graph/models/Graph.js";
import cacheService from "./cache.service.js";
import activityService from "./activity.service.js";

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

function extractNodeMeta(graph: Graph, nodeId: string) {
    const node = graph.nodes.get(nodeId);
    if (!node) {
        return { entityId: nodeId, entityName: nodeId };
    }
    if (node.kind === "symbol") {
        let path = node.fileId;
        const fileNode = graph.nodes.get(node.fileId);
        if (fileNode && fileNode.kind === "file") {
            path = fileNode.filePath;
        }
        return {
            entityId: node.id,
            entityName: node.name,
            entityKind: node.symbolKind || node.kind,
            entityPath: path,
        };
    }
    if (node.kind === "file") {
        return {
            entityId: node.id,
            entityName: node.filePath.split("/").pop() || node.filePath,
            entityKind: "file",
            entityPath: node.filePath,
        };
    }
    if (node.kind === "dependency") {
        return {
            entityId: node.id,
            entityName: node.name,
            entityKind: node.kind,
            entityPath: node.packageJsonPath,
        };
    }
    if (node.kind === "module") {
        return {
            entityId: node.id,
            entityName: node.name,
            entityKind: node.kind,
        };
    }
    return {
        entityId: (node as any).id || nodeId,
        entityName: (node as any).name || nodeId,
        entityKind: (node as any).kind,
    };
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

        const maxDepth = options?.maxDepth ?? "default";
        const cacheKey = `analysis:impact:${repositoryId}:${sourceNodeId}:${maxDepth}`;
        const cachedResult = await cacheService.get(cacheKey);

        const graph = await getGraph(repositoryId);
        const nodeMeta = extractNodeMeta(graph, sourceNodeId);

        let response: {
            sourceNodeId: string;
            impactedNodeIds: string[];
            depthByNode: Record<string, number>;
        };

        if (cachedResult) {
            response = JSON.parse(cachedResult);
        } else {
            const analysisEngine = new AnalysisEngine(graph);
            const result = analysisEngine.analyzeImpact(sourceNodeId, options);

            response = {
                sourceNodeId: result.sourceNodeId,
                impactedNodeIds: result.impactedNodeIds,
                depthByNode: Object.fromEntries(result.depthByNode),
            };

            await cacheService.set(
                cacheKey,
                JSON.stringify(response),
                12 * 60 * 60
            );
        }

        // Record activity in Redis (non-blocking)
        activityService.recordActivity({
            userId,
            repositoryId,
            analysisType: "impact",
            ...nodeMeta,
            details: {
                maxDepth: options?.maxDepth,
                impactedCount: response.impactedNodeIds.length,
            },
        });

        return response;
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

        const maxDepth = options?.maxDepth ?? "default";
        const cacheKey = `analysis:dependencies:${repositoryId}:${sourceNodeId}:${maxDepth}`;
        const cachedResult = await cacheService.get(cacheKey);

        const graph = await getGraph(repositoryId);
        const nodeMeta = extractNodeMeta(graph, sourceNodeId);

        let response: {
            sourceNodeId: string;
            dependencyNodeIds: string[];
            depthByNode: Record<string, number>;
        };

        if (cachedResult) {
            response = JSON.parse(cachedResult);
        } else {
            const analysisEngine = new AnalysisEngine(graph);
            const result = analysisEngine.analyzeDependencies(sourceNodeId, options);

            response = {
                sourceNodeId: result.sourceNodeId,
                dependencyNodeIds: result.dependencyNodeIds,
                depthByNode: Object.fromEntries(result.depthByNode),
            };

            await cacheService.set(
                cacheKey,
                JSON.stringify(response),
                12 * 60 * 60
            );
        }

        // Record activity in Redis (non-blocking)
        activityService.recordActivity({
            userId,
            repositoryId,
            analysisType: "dependencies",
            ...nodeMeta,
            details: {
                maxDepth: options?.maxDepth,
                dependencyCount: response.dependencyNodeIds.length,
            },
        });

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

        const repository = await findRepositoryById(repositoryId, userId);
        if (!repository) {
            throw new NotFoundError("Repository not found");
        }

        const cacheKey = `analysis:paths:${repositoryId}:${sourceNodeId}:${targetNodeId}`;
        const cachedResult = await cacheService.get(cacheKey);

        const graph = await getGraph(repositoryId);
        const sourceMeta = extractNodeMeta(graph, sourceNodeId);
        const targetMeta = extractNodeMeta(graph, targetNodeId);

        let result: {
            sourceNodeId: string;
            targetNodeId: string;
            path: string[] | null;
        };

        if (cachedResult) {
            result = JSON.parse(cachedResult);
        } else {
            const analysisEngine = new AnalysisEngine(graph);
            result = analysisEngine.analyzeCallPath(sourceNodeId, targetNodeId);

            await cacheService.set(
                cacheKey,
                JSON.stringify(result),
                12 * 60 * 60
            );
        }

        // Record activity in Redis (non-blocking)
        activityService.recordActivity({
            userId,
            repositoryId,
            analysisType: "call-path",
            entityId: sourceMeta.entityId,
            entityName: sourceMeta.entityName,
            entityKind: sourceMeta.entityKind,
            entityPath: sourceMeta.entityPath,
            targetEntityId: targetMeta.entityId,
            targetEntityName: targetMeta.entityName,
            targetEntityKind: targetMeta.entityKind,
            targetEntityPath: targetMeta.entityPath,
            details: {
                hasPath: Boolean(result.path),
                pathLength: result.path ? result.path.length : 0,
            },
        });

        return result;
    }

    async analyzeCycles({ repositoryId, userId, options }: AnalyzeCyclesParams) {
        if (!repositoryId) {
            throw new ValidationError("Repository ID is required");
        }

        const repository = await findRepositoryById(repositoryId, userId);
        if (!repository) {
            throw new NotFoundError("Repository not found");
        }

        const cacheKey = `analysis:cycles:${repositoryId}`;
        const cachedResult = await cacheService.get(cacheKey);

        let result: any;

        if (cachedResult) {
            result = JSON.parse(cachedResult);
        } else {
            const graph = await getGraph(repositoryId);
            const analysisEngine = new AnalysisEngine(graph);
            result = analysisEngine.analyzeCycles(options);

            await cacheService.set(
                cacheKey,
                JSON.stringify(result),
                12 * 60 * 60
            );
        }

        // Record activity in Redis (non-blocking)
        activityService.recordActivity({
            userId,
            repositoryId,
            analysisType: "cycles",
            details: {
                cycleCount: result.cycles?.length ?? 0,
            },
        });

        return result;
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

        const cacheKey = `analysis:ordering:${repositoryId}:${sourceNodeId}`;
        const cachedResult = await cacheService.get(cacheKey);

        const graph = await getGraph(repositoryId);
        const nodeMeta = extractNodeMeta(graph, sourceNodeId);

        let result: any;

        if (cachedResult) {
            result = JSON.parse(cachedResult);
        } else {
            const analysisEngine = new AnalysisEngine(graph);
            result = analysisEngine.analyzeDependencyOrdering(sourceNodeId);

            await cacheService.set(
                cacheKey,
                JSON.stringify(result),
                12 * 60 * 60
            );
        }

        // Record activity in Redis (non-blocking)
        activityService.recordActivity({
            userId,
            repositoryId,
            analysisType: "ordering",
            ...nodeMeta,
            details: {
                isOrderable: result.isOrderable,
                orderedCount: result.orderedNodeIds?.length ?? 0,
            },
        });

        return result;
    }

    async analyzeConnectivity({ repositoryId, userId, nodeId }: AnalyzeConnectivityParams) {
        if (!repositoryId) {
            throw new ValidationError("Repository ID is required");
        }

        if (!nodeId) {
            throw new ValidationError("Node ID is required");
        }

        const repository = await findRepositoryById(repositoryId, userId);
        if (!repository) {
            throw new NotFoundError("Repository not found");
        }

        const cacheKey = `analysis:connectivity:${repositoryId}:${nodeId}`;
        const cachedResult = await cacheService.get(cacheKey);

        const graph = await getGraph(repositoryId);
        const nodeMeta = extractNodeMeta(graph, nodeId);

        let result: any;

        if (cachedResult) {
            result = JSON.parse(cachedResult);
        } else {
            const analysisEngine = new AnalysisEngine(graph);
            result = analysisEngine.analyzeFanInOut(nodeId);

            await cacheService.set(
                cacheKey,
                JSON.stringify(result),
                12 * 60 * 60
            );
        }

        // Record activity in Redis (non-blocking)
        activityService.recordActivity({
            userId,
            repositoryId,
            analysisType: "connectivity",
            ...nodeMeta,
            details: {
                fanIn: result.fanIn,
                fanOut: result.fanOut,
            },
        });

        return result;
    }
}

export default new AnalyticsService();
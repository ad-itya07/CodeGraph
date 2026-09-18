import redis from "@/lib/redis.js";
import { findRepositoryById } from "@/persistence/repository.js";
import { getGraph } from "@/persistence/graph.js";
import { Graph } from "@/graph/models/Graph.js";
import { NotFoundError } from "@/errors/NotFoundError.js";
import { ValidationError } from "@/errors/ValidationError.js";

export type ActivityAnalysisType =
  | "impact"
  | "dependencies"
  | "call-path"
  | "cycles"
  | "ordering"
  | "connectivity";

export interface RecordActivityParams {
  userId: string;
  repositoryId: string;
  analysisType: ActivityAnalysisType;
  entityId?: string;
  entityName?: string;
  entityKind?: string;
  entityPath?: string;
  targetEntityId?: string;
  targetEntityName?: string;
  targetEntityKind?: string;
  targetEntityPath?: string;
  details?: Record<string, any>;
}

export interface ActivityItem {
  id: string;
  userId?: string;
  repositoryId: string;
  analysisType: ActivityAnalysisType;
  timestamp: string;
  entityId?: string;
  entityName?: string;
  entityKind?: string;
  entityPath?: string;
  targetEntityId?: string;
  targetEntityName?: string;
  targetEntityKind?: string;
  targetEntityPath?: string;
  details?: Record<string, any>;
}

export interface GetActivitiesParams {
  userId: string;
  repositoryId: string;
  analysisType?: string;
  entityKind?: string;
  limit?: number;
}

const MAX_ACTIVITIES_PER_REPO = 50;
const ANALYSIS_CACHE_MAX_TTL = 12 * 60 * 60; // 12 hours default TTL in analytics.service.ts

function sanitizeRelativePath(rawPath: string, repoId: string): string {
  if (!rawPath) return "";
  if (rawPath.includes(`repo-${repoId}/`)) {
    return rawPath.split(`repo-${repoId}/`)[1];
  }
  const parts = rawPath.split("/");
  return parts.length > 3 ? parts.slice(-3).join("/") : rawPath;
}

function resolveEntityMetadata(
  nodeId: string | undefined,
  graph: Graph | null,
  repoId: string
): {
  entityId?: string;
  entityName?: string;
  entityKind?: string;
  entityPath?: string;
} {
  if (!nodeId) return {};

  if (graph) {
    const node = graph.nodes.get(nodeId);
    if (node) {
      if (node.kind === "symbol") {
        const fileNode = graph.nodes.get(node.fileId);
        const rawPath =
          fileNode && fileNode.kind === "file"
            ? fileNode.filePath
            : node.fileId;
        const relPath = sanitizeRelativePath(rawPath, repoId);

        return {
          entityId: node.id,
          entityName: node.name,
          entityKind: node.symbolKind || node.kind,
          entityPath: relPath,
        };
      }

      if (node.kind === "file") {
        const relPath = sanitizeRelativePath(node.filePath, repoId);
        return {
          entityId: node.id,
          entityName: relPath.split("/").pop() || node.filePath,
          entityKind: "file",
          entityPath: relPath,
        };
      }

      if (node.kind === "dependency") {
        return {
          entityId: node.id,
          entityName: node.name,
          entityKind: "dependency",
          entityPath: sanitizeRelativePath(node.packageJsonPath, repoId),
        };
      }

      if (node.kind === "module") {
        return {
          entityId: node.id,
          entityName: node.name,
          entityKind: "module",
        };
      }
    }
  }

  // Fallback parsing from nodeId string format
  if (nodeId.startsWith("symbol:")) {
    const raw = nodeId.slice("symbol:".length);
    const parts = raw.split(":");
    const name = parts[parts.length - 1] || nodeId;
    const rawPath = parts.slice(0, -3).join(":") || parts[0];
    return {
      entityId: nodeId,
      entityName: name,
      entityKind: "symbol",
      entityPath: sanitizeRelativePath(rawPath, repoId),
    };
  }

  if (nodeId.startsWith("file:")) {
    const rawPath = nodeId.slice("file:".length);
    const relPath = sanitizeRelativePath(rawPath, repoId);
    return {
      entityId: nodeId,
      entityName: relPath.split("/").pop() || rawPath,
      entityKind: "file",
      entityPath: relPath,
    };
  }

  return {
    entityId: nodeId,
    entityName: nodeId.split(":").pop() || nodeId,
    entityKind: "symbol",
  };
}

class ActivityService {
  private getActivityKey(userId: string, repositoryId: string): string {
    return `activity:${userId}:${repositoryId}`;
  }

  /**
   * Records an analysis activity to Redis in a non-blocking, fail-safe manner.
   */
  async recordActivity(params: RecordActivityParams): Promise<void> {
    try {
      if (!params.userId || !params.repositoryId || !params.analysisType) {
        return;
      }

      const id = `act_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const timestamp = new Date().toISOString();

      const activity: ActivityItem = {
        id,
        userId: params.userId,
        repositoryId: params.repositoryId,
        analysisType: params.analysisType,
        timestamp,
        ...(params.entityId && { entityId: params.entityId }),
        ...(params.entityName && { entityName: params.entityName }),
        ...(params.entityKind && { entityKind: params.entityKind }),
        ...(params.entityPath && { entityPath: params.entityPath }),
        ...(params.targetEntityId && { targetEntityId: params.targetEntityId }),
        ...(params.targetEntityName && { targetEntityName: params.targetEntityName }),
        ...(params.targetEntityKind && { targetEntityKind: params.targetEntityKind }),
        ...(params.targetEntityPath && { targetEntityPath: params.targetEntityPath }),
        ...(params.details && { details: params.details }),
      };

      const key = this.getActivityKey(params.userId, params.repositoryId);

      await redis.lPush(key, JSON.stringify(activity));
      await redis.lTrim(key, 0, MAX_ACTIVITIES_PER_REPO - 1);
    } catch (err) {
      console.error("Failed to record activity in Redis:", err);
    }
  }

  /**
   * Retrieves recent analysis activities for a user in a specific repository
   * by reading the analysis data stored in Redis.
   */
  async getRecentActivities({
    userId,
    repositoryId,
    analysisType,
    entityKind,
    limit = MAX_ACTIVITIES_PER_REPO,
  }: GetActivitiesParams): Promise<ActivityItem[]> {
    if (!repositoryId) {
      throw new ValidationError("Repository ID is required");
    }

    if (!userId) {
      throw new ValidationError("User ID is required");
    }

    const repository = await findRepositoryById(repositoryId, userId);
    if (!repository) {
      throw new NotFoundError("Repository not found");
    }

    try {
      let graph: Graph | null = null;
      try {
        graph = await getGraph(repositoryId);
      } catch {
        // Continue if graph fails to load
      }

      const activitiesMap = new Map<string, ActivityItem>();

      // 1. Fetch from analysis cache keys in Redis: analysis:*:<repositoryId>*
      const analysisKeys = await redis.keys(`analysis:*:${repositoryId}*`);

      for (const k of analysisKeys) {
        try {
          const valStr = await redis.get(k);
          if (!valStr) continue;

          const ttl = await redis.ttl(k);
          const val = JSON.parse(valStr);
          const keyParts = k.split(":");
          const rawType = keyParts[1];
          const type: ActivityAnalysisType =
            rawType === "paths" ? "call-path" : (rawType as ActivityAnalysisType);

          // Calculate activity timestamp using remaining TTL
          const ageSeconds = ttl > 0 ? Math.max(0, ANALYSIS_CACHE_MAX_TTL - ttl) : 0;
          const timestamp = new Date(Date.now() - ageSeconds * 1000).toISOString();

          let entityInfo = {};
          let targetEntityInfo = {};
          let details: Record<string, any> = {};

          if (type === "cycles") {
            details = { cycleCount: val.cycles?.length ?? 0 };
          } else if (type === "connectivity") {
            const nodeId = val.nodeId || keyParts.slice(3).join(":");
            entityInfo = resolveEntityMetadata(nodeId, graph, repositoryId);
            details = { fanIn: val.fanIn ?? 0, fanOut: val.fanOut ?? 0 };
          } else if (type === "ordering") {
            const nodeId = val.sourceNodeId || keyParts.slice(3).join(":");
            entityInfo = resolveEntityMetadata(nodeId, graph, repositoryId);
            details = {
              orderedCount: val.orderedNodeIds?.length ?? 0,
              isOrderable: Boolean(val.isOrderable),
            };
          } else if (type === "impact") {
            const maxDepth = keyParts[keyParts.length - 1];
            const nodeId = val.sourceNodeId || keyParts.slice(3, -1).join(":");
            entityInfo = resolveEntityMetadata(nodeId, graph, repositoryId);
            details = {
              impactedCount: val.impactedNodeIds?.length ?? 0,
              maxDepth,
            };
          } else if (type === "dependencies") {
            const maxDepth = keyParts[keyParts.length - 1];
            const nodeId = val.sourceNodeId || keyParts.slice(3, -1).join(":");
            entityInfo = resolveEntityMetadata(nodeId, graph, repositoryId);
            details = {
              dependencyCount: val.dependencyNodeIds?.length ?? 0,
              maxDepth,
            };
          } else if (type === "call-path") {
            entityInfo = resolveEntityMetadata(val.sourceNodeId, graph, repositoryId);
            targetEntityInfo = resolveEntityMetadata(val.targetNodeId, graph, repositoryId);
            details = {
              hasPath: Boolean(val.path),
              pathLength: val.path ? val.path.length : 0,
            };
          }

          const targetObj = targetEntityInfo as any;

          const item: ActivityItem = {
            id: `act_${k}`,
            userId,
            repositoryId,
            analysisType: type,
            timestamp,
            ...entityInfo,
            ...(targetObj.entityName && {
              targetEntityId: targetObj.entityId,
              targetEntityName: targetObj.entityName,
              targetEntityKind: targetObj.entityKind,
              targetEntityPath: targetObj.entityPath,
            }),
            details,
          };

          activitiesMap.set(item.id, item);
        } catch (err) {
          console.error(`Failed to parse analysis key "${k}":`, err);
        }
      }

      // 2. Also check if any activity list keys exist (activity:userId:repoId)
      const listKey = this.getActivityKey(userId, repositoryId);
      const listItems = await redis.lRange(listKey, 0, MAX_ACTIVITIES_PER_REPO - 1);
      if (listItems && listItems.length > 0) {
        for (const raw of listItems) {
          try {
            const parsed = JSON.parse(raw) as ActivityItem;
            if (!activitiesMap.has(parsed.id)) {
              activitiesMap.set(parsed.id, parsed);
            }
          } catch {
            // Ignore malformed JSON
          }
        }
      }

      let activities = Array.from(activitiesMap.values());

      // Sort reverse chronologically (newest first)
      activities.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Apply filters if provided
      if (analysisType && analysisType !== "all") {
        activities = activities.filter((act) => act.analysisType === analysisType);
      }

      if (entityKind && entityKind !== "all") {
        activities = activities.filter(
          (act) => act.entityKind === entityKind || act.targetEntityKind === entityKind
        );
      }

      const boundedLimit = Math.min(Math.max(1, limit), MAX_ACTIVITIES_PER_REPO);
      return activities.slice(0, boundedLimit);
    } catch (err) {
      console.error("Failed to fetch activities from Redis:", err);
      return [];
    }
  }
}

export default new ActivityService();

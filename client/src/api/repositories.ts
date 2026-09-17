import { apiClient } from "./client";
import type {
  ApiResponse,
  Repository,
  SerializedGraph,
  ImpactAnalysisResult,
  DependencyAnalysisResult,
  CallPathResult,
  CycleAnalysisResult,
  DependencyOrderingResult,
} from "@/types";

export const repositoriesApi = {
  getOverview: async () => {
    const { data } = await apiClient.get<ApiResponse<{
      repositoryCount: number;
      totalCodeEntities: number;
      totalRelationships: number;
      averageHealthIndex: number;
    }>>("/repository/overview");
    return data.data;
  },

  list: async () => {
    const { data } = await apiClient.get<ApiResponse<Repository[]>>(
      "/repository"
    );
    return data.data;
  },

  get: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Repository>>(
      `/repository/${id}`
    );
    return data.data;
  },

  create: async (url: string) => {
    const { data } = await apiClient.post<ApiResponse<{ repository: Repository }>>(
      "/repository",
      { url }
    );
    return data.data;
  },

  getGraph: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<SerializedGraph>>(
      `/repository/${id}/graph`
    );
    return data.data;
  },
};

export const analyticsApi = {
  impact: async (id: string, nodeId: string, maxDepth?: number) => {
    const { data } = await apiClient.get<ApiResponse<ImpactAnalysisResult>>(
      `/repository/${id}/analysis/impact`,
      { params: { nodeId, ...(maxDepth !== undefined && { maxDepth }) } }
    );
    return data.data;
  },

  dependencies: async (id: string, nodeId: string, maxDepth?: number) => {
    const { data } = await apiClient.get<ApiResponse<DependencyAnalysisResult>>(
      `/repository/${id}/analysis/dependencies`,
      { params: { nodeId, ...(maxDepth !== undefined && { maxDepth }) } }
    );
    return data.data;
  },

  callPath: async (
    id: string,
    sourceNodeId: string,
    targetNodeId: string
  ) => {
    const { data } = await apiClient.get<ApiResponse<CallPathResult>>(
      `/repository/${id}/analysis/paths`,
      { params: { sourceNodeId, targetNodeId } }
    );
    return data.data;
  },

  cycles: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<CycleAnalysisResult>>(
      `/repository/${id}/analysis/cycles`
    );
    return data.data;
  },

  ordering: async (id: string, sourceNodeId: string) => {
    const { data } = await apiClient.get<ApiResponse<DependencyOrderingResult>>(
      `/repository/${id}/analysis/ordering`,
      { params: { sourceNodeId } }
    );
    return data.data;
  },
};

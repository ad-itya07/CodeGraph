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
  list: async () => {
    const { data } = await apiClient.get<ApiResponse<Repository[]>>(
      "/repositories"
    );
    return data.data;
  },

  get: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Repository>>(
      `/repositories/${id}`
    );
    return data.data;
  },

  create: async (url: string) => {
    const { data } = await apiClient.post<ApiResponse<{ repository: Repository }>>(
      "/repositories",
      { url }
    );
    return data.data;
  },

  getGraph: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<SerializedGraph>>(
      `/repositories/${id}/graph`
    );
    return data.data;
  },
};

export const analyticsApi = {
  impact: async (id: string, nodeId: string, maxDepth?: number) => {
    const { data } = await apiClient.get<ApiResponse<ImpactAnalysisResult>>(
      `/repositories/${id}/analysis/impact`,
      { params: { nodeId, ...(maxDepth !== undefined && { maxDepth }) } }
    );
    return data.data;
  },

  dependencies: async (id: string, nodeId: string, maxDepth?: number) => {
    const { data } = await apiClient.get<ApiResponse<DependencyAnalysisResult>>(
      `/repositories/${id}/analysis/dependencies`,
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
      `/repositories/${id}/analysis/paths`,
      { params: { sourceNodeId, targetNodeId } }
    );
    return data.data;
  },

  cycles: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<CycleAnalysisResult>>(
      `/repositories/${id}/analysis/cycles`
    );
    return data.data;
  },

  ordering: async (id: string, sourceNodeId: string) => {
    const { data } = await apiClient.get<ApiResponse<DependencyOrderingResult>>(
      `/repositories/${id}/analysis/ordering`,
      { params: { sourceNodeId } }
    );
    return data.data;
  },
};

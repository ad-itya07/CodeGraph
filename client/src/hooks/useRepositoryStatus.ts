"use client";

import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { repositoriesApi } from "@/api/repositories";
import type { RepositoryStatus, RepositoryStage, RepositoryStatusResponse } from "@/types";

export const STAGE_LABELS: Record<RepositoryStage, string> = {
  CLONING: "Cloning repository...",
  PARSING_METADATA: "Extracting package configuration...",
  PARSING_PATH_CONFIG: "Extracting compiler paths...",
  PARSING_SYMBOLS: "Extracting symbols & ASTs...",
  PARSING_RELATIONSHIPS: "Resolving symbol relationships...",
  BUILDING_GRAPH: "Building code graph & analytics...",
};

export const STAGE_STEPS: RepositoryStage[] = [
  "CLONING",
  "PARSING_METADATA",
  "PARSING_PATH_CONFIG",
  "PARSING_SYMBOLS",
  "PARSING_RELATIONSHIPS",
  "BUILDING_GRAPH",
];

export function getStageStepIndex(stage?: RepositoryStage | null): number {
  if (!stage) return 0;
  const idx = STAGE_STEPS.indexOf(stage);
  return idx >= 0 ? idx : 0;
}

export function formatErrorMessage(errorCode?: string | null, failedStage?: RepositoryStage | null): string {
  const stageName = failedStage
    ? STAGE_LABELS[failedStage]?.replace(/\.\.\.$/, "")
    : "analysis pipeline";

  switch (errorCode) {
    case "NO_SUPPORTED_FILES":
      return "No supported JavaScript or TypeScript source files found.";
    case "CLONE_FAILED":
      return "Failed to clone repository. Please verify the URL and repository accessibility.";
    case "COMMIT_SHA_ERROR":
      return "Failed to extract commit details from repository.";
    case "PARSING_ERROR":
      return `Failed while ${stageName.toLowerCase()}.`;
    default:
      return failedStage ? `Failed during ${stageName.toLowerCase()}.` : "Analysis encountered an unexpected failure.";
  }
}

interface UseRepositoryStatusOptions {
  initialStatus?: RepositoryStatus;
  initialStage?: RepositoryStage | null;
  enabled?: boolean;
}

export function useRepositoryStatus(
  repositoryId: string,
  options: UseRepositoryStatusOptions = {}
) {
  const queryClient = useQueryClient();
  const prevStatusRef = useRef<RepositoryStatus | undefined>(options.initialStatus);

  const isInitiallyActive =
    options.initialStatus === "QUEUED" || options.initialStatus === "PROCESSING";

  const { data: statusData, isLoading, error, refetch } = useQuery<RepositoryStatusResponse>({
    queryKey: ["repository", repositoryId, "status"],
    queryFn: () => repositoriesApi.getStatus(repositoryId),
    enabled: !!repositoryId && (options.enabled ?? isInitiallyActive),
    refetchInterval: (query) => {
      const status = query.state.data?.status || options.initialStatus;
      if (status === "QUEUED" || status === "PROCESSING") {
        return 1500;
      }
      return false;
    },
    staleTime: 1000,
  });

  const currentStatus = statusData?.status || options.initialStatus || "READY";
  const currentStage = statusData?.currentStage ?? options.initialStage ?? null;
  const failedStage = statusData?.failedStage ?? null;
  const errorCode = statusData?.errorCode ?? null;

  useEffect(() => {
    if (prevStatusRef.current && prevStatusRef.current !== currentStatus) {
      if (currentStatus === "READY" || currentStatus === "FAILED") {
        queryClient.invalidateQueries({ queryKey: ["repository", "list"] });
        queryClient.invalidateQueries({ queryKey: ["repository", "overview"] });
        queryClient.invalidateQueries({ queryKey: ["repository", repositoryId] });
      }
    }
    prevStatusRef.current = currentStatus;
  }, [currentStatus, repositoryId, queryClient]);

  const isQueued = currentStatus === "QUEUED";
  const isProcessing = currentStatus === "PROCESSING";
  const isReady = currentStatus === "READY";
  const isFailed = currentStatus === "FAILED";

  const stageLabel = currentStage
    ? STAGE_LABELS[currentStage]
    : isQueued
    ? "Queued in analysis pipeline..."
    : isProcessing
    ? "Processing repository..."
    : "";

  const stepIndex = getStageStepIndex(currentStage);
  const totalSteps = STAGE_STEPS.length;
  const progressPercent = isReady
    ? 100
    : isQueued
    ? 5
    : Math.min(95, Math.round(((stepIndex + 1) / totalSteps) * 100));

  return {
    status: currentStatus,
    stage: currentStage,
    failedStage,
    errorCode,
    errorMessage: formatErrorMessage(errorCode, failedStage),
    stageLabel,
    stepIndex,
    totalSteps,
    progressPercent,
    isQueued,
    isProcessing,
    isReady,
    isFailed,
    isLoading,
    error,
    refetch,
  };
}

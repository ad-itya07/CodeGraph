"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { repositoriesApi } from "@/api/repositories";
import { AnalyticsWorkspace } from "@/components/analytics/AnalyticsWorkspace";
import { AnalysisErrorState } from "@/components/analytics/shared/AnalysisStateDisplay";

export default function RepositoryAnalyzePage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const unwrappedParams =
    typeof (params as any).then === "function"
      ? use(params as Promise<{ id: string }>)
      : (params as { id: string });
  const id = unwrappedParams.id;

  const {
    data: repository,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["repository", id],
    queryFn: () => repositoriesApi.get(id),
    enabled: !!id,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex-1 min-h-full flex items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 border-2 border-muted/30 border-t-accent rounded-full animate-spin" />
          <span className="text-xs font-mono text-muted">
            Loading analytics workspace...
          </span>
        </div>
      </div>
    );
  }

  if (isError || !repository) {
    return (
      <div className="flex-1 p-6 lg:p-8 flex flex-col items-center justify-center min-h-full bg-background">
        <div className="max-w-md w-full">
          <AnalysisErrorState
            title="Failed to Load Repository"
            error={error || "Repository data could not be retrieved from the CodeGraph server."}
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  return <AnalyticsWorkspace repository={repository} />;
}

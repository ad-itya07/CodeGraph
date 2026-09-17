"use client";

import { useMemo, use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle, RefreshCw, FolderGit2 } from "lucide-react";
import { repositoriesApi } from "@/api/repositories";
import { normalizeGraph } from "@/lib/explorer/normalization";
import { useExplorerState } from "@/lib/explorer/useExplorerState";
import { ExplorerLayout } from "@/components/explorer/ExplorerLayout";

export default function RepositoryExplorerPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const unwrappedParams = typeof (params as any).then === "function" ? use(params as Promise<{ id: string }>) : (params as { id: string });
  const id = unwrappedParams.id;

  // Fetch repository metadata
  const {
    data: repository,
    isLoading: isRepoLoading,
    error: repoError,
  } = useQuery({
    queryKey: ["repository", id],
    queryFn: () => repositoriesApi.get(id),
    enabled: !!id,
  });

  // Fetch real repository graph data
  const {
    data: graphData,
    isLoading: isGraphLoading,
    error: graphError,
    refetch: refetchGraph,
  } = useQuery({
    queryKey: ["repository", id, "graph"],
    queryFn: () => repositoriesApi.getGraph(id),
    enabled: !!id,
  });

  // Normalize graph into fast index lookups
  const normalizedData = useMemo(() => {
    if (!graphData) return null;
    return normalizeGraph(graphData, repository?.name, id);
  }, [graphData, repository?.name, id]);

  const explorerState = useExplorerState(normalizedData);

  // Loading State
  if (isGraphLoading || isRepoLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-background text-muted select-none">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-accent" size={28} />
          <span className="text-sm font-mono font-medium text-foreground">
            Indexing repository graph...
          </span>
          <span className="text-xs text-subtle font-mono">
            Loading AST declarations, relationships, and dependencies
          </span>
        </div>
      </div>
    );
  }

  // Error State
  if (graphError || repoError || !normalizedData) {
    const errorMsg =
      (graphError as any)?.response?.data?.message ||
      (graphError as Error)?.message ||
      (repoError as any)?.response?.data?.message ||
      (repoError as Error)?.message ||
      "Unable to load repository graph.";

    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center bg-background select-none">
        <div className="max-w-md p-8 rounded-2xl bg-surface/60 border border-border flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-danger/10 border border-danger/20 flex items-center justify-center text-danger mb-4">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-lg font-bold font-heading text-foreground mb-2">
            Failed to Load Repository Explorer
          </h2>
          <p className="text-xs text-muted leading-relaxed mb-6 font-mono">
            {errorMsg}
          </p>
          <button
            onClick={() => refetchGraph()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-background text-xs font-semibold rounded-lg hover:bg-accent-light transition-colors cursor-pointer"
          >
            <RefreshCw size={13} />
            <span>Retry Loading Graph</span>
          </button>
        </div>
      </div>
    );
  }

  // Empty State (Repository has no parsed files or graph data)
  if (normalizedData.filesById.size === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center bg-background select-none">
        <div className="max-w-md p-8 rounded-2xl bg-surface/60 border border-border border-dashed flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4">
            <FolderGit2 size={24} />
          </div>
          <h2 className="text-lg font-bold font-heading text-foreground mb-2">
            No Files in Repository Graph
          </h2>
          <p className="text-xs text-muted leading-relaxed font-mono">
            No source files or code entities were extracted from this repository during parsing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ExplorerLayout
      repository={repository}
      data={normalizedData}
      explorerState={explorerState}
    />
  );
}

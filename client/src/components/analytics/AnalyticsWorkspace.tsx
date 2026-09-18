"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { repositoriesApi } from "@/api/repositories";
import { normalizeGraph } from "@/lib/explorer/normalization";
import { AnalyticsNavigation } from "./AnalyticsNavigation";
import { AnalyticsHome } from "./AnalyticsHome";
import { AnalysisErrorBanner } from "./shared/AnalysisStateDisplay";
import { AnalysisCoverageNotice } from "./shared/AnalysisCoverageNotice";
import { CycleAnalysisView } from "./views/CycleAnalysisView";
import { ImpactAnalysisView } from "./views/ImpactAnalysisView";
import { DependencyAnalysisView } from "./views/DependencyAnalysisView";
import { DependencyOrderingView } from "./views/DependencyOrderingView";
import { ConnectivityView } from "./views/ConnectivityView";
import { CallPathView } from "./views/CallPathView";
import type { Repository, AnalysisType } from "@/types";

interface AnalyticsWorkspaceProps {
  repository: Repository;
}

const VALID_ANALYSIS_TYPES: AnalysisType[] = [
  "home",
  "cycles",
  "impact",
  "dependencies",
  "ordering",
  "connectivity",
  "call-path",
];

export function AnalyticsWorkspace({ repository }: AnalyticsWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL state synchronization
  const rawParam = searchParams.get("analysis") as AnalysisType | null;
  const initialType: AnalysisType =
    rawParam && VALID_ANALYSIS_TYPES.includes(rawParam) ? rawParam : "home";

  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisType>(initialType);

  const initialEntityId = searchParams.get("entity");
  const initialSourceId = searchParams.get("source");
  const initialTargetId = searchParams.get("target");

  useEffect(() => {
    if (rawParam && VALID_ANALYSIS_TYPES.includes(rawParam)) {
      setActiveAnalysis(rawParam);
    }
  }, [rawParam]);

  // Fetch and normalize graph in-memory for fast entity resolution
  const {
    data: rawGraph,
    isLoading: isGraphLoading,
    isError: isGraphError,
    error: graphError,
    refetch: refetchGraph,
  } = useQuery({
    queryKey: ["repository-graph", repository.id],
    queryFn: () => repositoriesApi.getGraph(repository.id),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  const normalizedData = useMemo(() => {
    if (!rawGraph) return null;
    return normalizeGraph(rawGraph, repository.name, repository.id);
  }, [rawGraph, repository.name, repository.id]);

  const handleSelectAnalysis = (type: AnalysisType) => {
    setActiveAnalysis(type);
    const params = new URLSearchParams(searchParams.toString());
    if (type === "home") {
      params.delete("analysis");
    } else {
      params.set("analysis", type);
    }
    const newQuery = params.toString();
    router.push(`${pathname}${newQuery ? `?${newQuery}` : ""}`, {
      scroll: false,
    });
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0 h-full overflow-hidden bg-background">
      {/* Secondary Analytics Navigation Sidebar */}
      <AnalyticsNavigation
        activeAnalysis={activeAnalysis}
        onSelectAnalysis={handleSelectAnalysis}
      />

      {/* Main Analysis Workspace Pane */}
      <div className="flex-1 min-w-0 min-h-0 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-4">
        {/* Analysis Coverage & Static Model Disclosure */}
        <AnalysisCoverageNotice />

        {isGraphError && (
          <AnalysisErrorBanner
            title="Failed to Load Repository Graph Structure"
            error={graphError}
            onRetry={() => refetchGraph()}
          />
        )}
        {activeAnalysis === "home" && (
          <AnalyticsHome
            repository={repository}
            onSelectAnalysis={handleSelectAnalysis}
          />
        )}

        {activeAnalysis === "cycles" && (
          <CycleAnalysisView
            repository={repository}
            data={normalizedData}
          />
        )}

        {activeAnalysis === "impact" && (
          <ImpactAnalysisView
            repository={repository}
            data={normalizedData}
            initialNodeId={initialEntityId}
          />
        )}

        {activeAnalysis === "dependencies" && (
          <DependencyAnalysisView
            repository={repository}
            data={normalizedData}
            initialNodeId={initialEntityId}
          />
        )}

        {activeAnalysis === "ordering" && (
          <DependencyOrderingView
            repository={repository}
            data={normalizedData}
            initialNodeId={initialEntityId}
          />
        )}

        {activeAnalysis === "connectivity" && (
          <ConnectivityView
            repository={repository}
            data={normalizedData}
            initialNodeId={initialEntityId}
          />
        )}

        {activeAnalysis === "call-path" && (
          <CallPathView
            repository={repository}
            data={normalizedData}
            initialSourceId={initialSourceId}
            initialTargetId={initialTargetId}
          />
        )}
      </div>
    </div>
  );
}

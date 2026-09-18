"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  RotateCw,
  Play,
  CheckCircle2,
  ArrowRight,
  FolderTree,
  ExternalLink,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { analyticsApi } from "@/api/repositories";
import { AnalysisHeader } from "../shared/AnalysisHeader";
import { EntityCard } from "../shared/EntityCard";
import {
  AnalysisLoadingState,
  AnalysisErrorState,
  AnalysisEmptyState,
} from "../shared/AnalysisStateDisplay";
import {
  CYCLE_TYPE_CONFIG,
  resolveEntity,
} from "@/lib/analytics/entity-helpers";
import type { Repository, CycleType } from "@/types";
import type { NormalizedExplorerData } from "@/types/explorer";

interface CycleAnalysisViewProps {
  repository: Repository;
  data: NormalizedExplorerData | null | undefined;
}

export function CycleAnalysisView({
  repository,
  data,
}: CycleAnalysisViewProps) {
  const [hasTriggered, setHasTriggered] = useState(false);
  const [activeTypeFilter, setActiveTypeFilter] = useState<CycleType | "all">("all");

  const {
    data: cycleResult,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["analysis-cycles", repository.id],
    queryFn: () => analyticsApi.cycles(repository.id),
    enabled: hasTriggered,
    retry: false,
  });

  const isRunning = isLoading || isFetching;

  const handleRun = () => {
    setHasTriggered(true);
    if (hasTriggered) {
      refetch();
    }
  };

  // Group counts by type
  const typeCounts = {
    "file-import": 0,
    "symbol-call": 0,
    "symbol-inheritance": 0,
    "symbol-implementation": 0,
    "symbol-instantiation": 0,
  };

  if (cycleResult?.cycles) {
    for (const c of cycleResult.cycles) {
      if (typeCounts[c.type] !== undefined) {
        typeCounts[c.type]++;
      }
    }
  }

  const filteredCycles = (cycleResult?.cycles || []).filter((c) => {
    if (activeTypeFilter === "all") return true;
    return c.type === activeTypeFilter;
  });

  return (
    <div className="space-y-6">
      <AnalysisHeader
        title="Cycle Analysis"
        question="Where are the circular dependencies and recursive loops across the entire repository?"
        category="Repository Analysis"
        icon={RotateCw}
        iconColor="text-blue-400"
        badgeColor="bg-blue-500/10 text-blue-400 border-blue-500/20"
      />

      {/* Control Card */}
      <div className="p-5 rounded-2xl border border-border bg-surface/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold font-heading text-foreground">
            Repository-Wide Circular Dependency Detection
          </h2>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            Performs Tarjan&apos;s Strongly Connected Components (SCC) analysis across all file import graphs and symbol call graphs.
          </p>
        </div>

        <button
          onClick={handleRun}
          disabled={isRunning}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-light text-background text-xs font-semibold font-mono transition-all duration-150 shadow-md shadow-accent/10 disabled:opacity-50 cursor-pointer shrink-0"
        >
          <Play size={14} className={cn("fill-current", isRunning && "animate-spin")} />
          <span>{isRunning ? "Analyzing..." : "Run Cycle Analysis"}</span>
        </button>
      </div>

      {/* Loading State */}
      {isRunning && (
        <AnalysisLoadingState
          message="Running Repository Cycle Analysis..."
          subMessage="Extracting subgraphs and computing strongly connected components"
        />
      )}

      {/* Error State */}
      {!isRunning && isError && (
        <AnalysisErrorState
          title="Cycle Analysis Failed"
          error={error}
          onRetry={handleRun}
        />
      )}

      {/* Results */}
      {!isRunning && !isError && cycleResult && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div
              onClick={() => setActiveTypeFilter("all")}
              className={cn(
                "p-3.5 rounded-xl border bg-surface/70 cursor-pointer transition-all",
                activeTypeFilter === "all"
                  ? "border-accent ring-1 ring-accent/30 bg-surface-elevated"
                  : "border-border hover:border-border-highlight"
              )}
            >
              <div className="text-[11px] font-mono text-muted truncate">
                Total Cycles
              </div>
              <div className="text-xl font-bold font-mono text-foreground mt-1">
                {cycleResult.cycles.length}
              </div>
            </div>

            {(Object.keys(CYCLE_TYPE_CONFIG) as CycleType[]).map((type) => {
              const meta = CYCLE_TYPE_CONFIG[type];
              const count = typeCounts[type];
              const isActive = activeTypeFilter === type;

              return (
                <div
                  key={type}
                  onClick={() => setActiveTypeFilter(isActive ? "all" : type)}
                  className={cn(
                    "p-3.5 rounded-xl border bg-surface/70 cursor-pointer transition-all",
                    isActive
                      ? "border-accent ring-1 ring-accent/30 bg-surface-elevated"
                      : "border-border hover:border-border-highlight"
                  )}
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted truncate">
                    <span className={cn("w-1.5 h-1.5 rounded-full", meta.dotClass)} />
                    <span className="truncate">{meta.shortLabel}</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-foreground mt-1">
                    {count}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cycles List or Empty State */}
          {cycleResult.cycles.length === 0 ? (
            <AnalysisEmptyState
              title="No Circular Dependencies Found"
              description="Great news! The repository structure is completely acyclic across all file imports, symbol calls, and inheritance relationships."
              icon={<CheckCircle2 size={24} className="text-emerald-400" />}
            />
          ) : filteredCycles.length === 0 ? (
            <AnalysisEmptyState
              title={`No ${activeTypeFilter} cycles found`}
              description="Try selecting a different cycle category from the summary cards above."
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-muted">
                  Detected Cycles ({filteredCycles.length})
                </h2>
                {activeTypeFilter !== "all" && (
                  <button
                    onClick={() => setActiveTypeFilter("all")}
                    className="text-[11px] font-mono text-accent hover:underline"
                  >
                    Clear filter
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {filteredCycles.map((cycle, index) => {
                  const meta = CYCLE_TYPE_CONFIG[cycle.type];
                  return (
                    <div
                      key={index}
                      className="p-4 rounded-2xl border border-border bg-surface/90 space-y-3"
                    >
                      {/* Cycle Card Header */}
                      <div className="flex items-center justify-between gap-3 pb-2 border-b border-border/50">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-surface-elevated border border-border text-[10px] font-mono font-bold flex items-center justify-center text-muted">
                            {index + 1}
                          </span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-md text-[10px] font-mono font-medium border",
                              meta.badgeClass
                            )}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-muted">
                          {cycle.nodeIds.length} {cycle.nodeIds.length === 1 ? "self-referential node" : "nodes in loop"}
                        </span>
                      </div>

                      {/* Step-by-Step Cycle Loop */}
                      <div className="space-y-2 pt-1">
                        {cycle.nodeIds.map((nodeId, nodeIndex) => {
                          const isLast = nodeIndex === cycle.nodeIds.length - 1;
                          return (
                            <div key={nodeId} className="space-y-2">
                              <EntityCard
                                nodeId={nodeId}
                                data={data}
                                repositoryId={repository.id}
                                stepNumber={nodeIndex + 1}
                              />
                              {!isLast && (
                                <div className="flex items-center justify-center py-0.5 text-muted/60">
                                  <ArrowRight size={14} className="rotate-90 sm:rotate-0" />
                                </div>
                              )}
                              {isLast && cycle.nodeIds.length > 1 && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/5 border border-red-500/20 text-[11px] font-mono text-red-400">
                                  <RotateCw size={12} className="animate-spin" />
                                  <span>
                                    Loops back to Step 1 (
                                    {resolveEntity(cycle.nodeIds[0], data, repository.id).displayName}
                                    )
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

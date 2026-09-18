"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Boxes, Play, ArrowDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { analyticsApi } from "@/api/repositories";
import { AnalysisHeader } from "../shared/AnalysisHeader";
import { EntityPicker } from "../pickers/EntityPicker";
import { EntityCard } from "../shared/EntityCard";
import {
  AnalysisLoadingState,
  AnalysisErrorState,
  AnalysisEmptyState,
} from "../shared/AnalysisStateDisplay";
import { resolveEntity } from "@/lib/analytics/entity-helpers";
import type { Repository } from "@/types";
import type { NormalizedExplorerData } from "@/types/explorer";

interface DependencyAnalysisViewProps {
  repository: Repository;
  data: NormalizedExplorerData | null | undefined;
  initialNodeId?: string | null;
}

const DEPTH_OPTIONS = [
  { value: "all", label: "Full Dependencies (All Hops)" },
  { value: "1", label: "Direct Dependencies Only (1 Hop)" },
  { value: "2", label: "Up to 2 Hops" },
  { value: "3", label: "Up to 3 Hops" },
  { value: "5", label: "Up to 5 Hops" },
];

export function DependencyAnalysisView({
  repository,
  data,
  initialNodeId = null,
}: DependencyAnalysisViewProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialNodeId);
  const [depthOption, setDepthOption] = useState<string>("all");
  const [hasTriggered, setHasTriggered] = useState(false);

  const numericDepth = depthOption === "all" ? undefined : Number(depthOption);

  const {
    data: dependencyResult,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["analysis-dependencies", repository.id, selectedNodeId, depthOption],
    queryFn: () => {
      if (!selectedNodeId) throw new Error("No entity selected");
      return analyticsApi.dependencies(repository.id, selectedNodeId, numericDepth);
    },
    enabled: hasTriggered && !!selectedNodeId,
    retry: false,
  });

  const isRunning = isLoading || isFetching;

  const handleRun = () => {
    if (!selectedNodeId) return;
    setHasTriggered(true);
    if (hasTriggered) {
      refetch();
    }
  };

  // Group dependencies into Direct (depth 1) vs Transitive (depth >= 2)
  const groupedDeps = (() => {
    if (!dependencyResult?.dependencyNodeIds || !dependencyResult.depthByNode) {
      return { direct: [], transitive: [] };
    }

    const direct: string[] = [];
    const transitive: string[] = [];

    for (const nodeId of dependencyResult.dependencyNodeIds) {
      const d = dependencyResult.depthByNode[nodeId] || 1;
      if (d === 1) {
        direct.push(nodeId);
      } else {
        transitive.push(nodeId);
      }
    }

    return { direct, transitive };
  })();

  const selectedEntity = selectedNodeId
    ? resolveEntity(selectedNodeId, data, repository.id)
    : null;

  return (
    <div className="space-y-6">
      <AnalysisHeader
        title="Dependency Analysis"
        question="What functions, classes, modules, and packages does this entity depend on?"
        category="Entity Analysis"
        icon={Boxes}
        iconColor="text-indigo-400"
        badgeColor="bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
      />

      {/* Input Selection & Controls */}
      <div className="p-5 rounded-2xl border border-border bg-surface/80 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <EntityPicker
              label="Select Entity to Inspect"
              placeholder="Search functions, classes, or files..."
              selectedNodeId={selectedNodeId}
              onSelectNode={(id) => {
                setSelectedNodeId(id);
                setHasTriggered(false);
              }}
              data={data}
              repositoryId={repository.id}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold font-mono text-muted mb-1.5">
              Traversal Depth
            </label>
            <select
              value={depthOption}
              onChange={(e) => {
                setDepthOption(e.target.value);
                setHasTriggered(false);
              }}
              className="w-full h-[46px] px-3.5 rounded-xl bg-surface border border-border text-xs font-mono text-foreground focus:outline-none focus:border-accent"
            >
              {DEPTH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted">
            <Info size={13} className="text-subtle" />
            <span>
              Performs forward downstream traversal through calls, imports, extensions, and instantiations.
            </span>
          </div>

          <button
            onClick={handleRun}
            disabled={!selectedNodeId || isRunning}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-light text-background text-xs font-semibold font-mono transition-all duration-150 shadow-md shadow-accent/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            <Play size={14} className={cn("fill-current", isRunning && "animate-spin")} />
            <span>{isRunning ? "Analyzing..." : "Run Dependency Analysis"}</span>
          </button>
        </div>
      </div>

      {/* Loading */}
      {isRunning && (
        <AnalysisLoadingState
          message={`Tracing downstream dependencies for ${selectedEntity?.displayName || "entity"}...`}
          subMessage="Walking outward calls, imports, and inheritance chains"
        />
      )}

      {/* Error */}
      {!isRunning && isError && (
        <AnalysisErrorState
          title="Dependency Analysis Failed"
          error={error}
          onRetry={handleRun}
        />
      )}

      {/* Results */}
      {!isRunning && !isError && dependencyResult && (
        <div className="space-y-6">
          {/* Summary Metric Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-border bg-surface/70">
              <span className="text-[11px] font-mono text-muted">
                Total Reachable Dependencies
              </span>
              <div className="text-2xl font-bold font-mono text-foreground mt-1">
                {dependencyResult.dependencyNodeIds.length}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <span className="text-[11px] font-mono text-emerald-400">
                Direct Dependencies (1 hop)
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {groupedDeps.direct.length}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
              <span className="text-[11px] font-mono text-indigo-400">
                Transitive Dependencies (2+ hops)
              </span>
              <div className="text-2xl font-bold font-mono text-indigo-400 mt-1">
                {groupedDeps.transitive.length}
              </div>
            </div>
          </div>

          {/* Dependencies List or Empty State */}
          {dependencyResult.dependencyNodeIds.length === 0 ? (
            <AnalysisEmptyState
              title="No Dependencies Found"
              description="This entity is a pure leaf node — it does not call, import, extend, or instantiate any other internal code entities."
            />
          ) : (
            <div className="space-y-6">
              {/* Direct Dependencies */}
              {groupedDeps.direct.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-400">
                      Direct Dependencies ({groupedDeps.direct.length})
                    </h2>
                  </div>
                  <div className="space-y-2">
                    {groupedDeps.direct.map((nodeId) => (
                      <EntityCard
                        key={nodeId}
                        nodeId={nodeId}
                        data={data}
                        repositoryId={repository.id}
                        depth={1}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Transitive Dependencies */}
              {groupedDeps.transitive.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-indigo-400">
                      Transitive Dependencies ({groupedDeps.transitive.length})
                    </h2>
                  </div>
                  <div className="space-y-2">
                    {groupedDeps.transitive.map((nodeId) => (
                      <EntityCard
                        key={nodeId}
                        nodeId={nodeId}
                        data={data}
                        repositoryId={repository.id}
                        depth={dependencyResult.depthByNode[nodeId] || 2}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

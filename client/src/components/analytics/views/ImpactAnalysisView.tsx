"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Flame,
  Play,
  Layers,
  Sparkles,
  ArrowDown,
  Info,
} from "lucide-react";
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

interface ImpactAnalysisViewProps {
  repository: Repository;
  data: NormalizedExplorerData | null | undefined;
  initialNodeId?: string | null;
}

const DEPTH_OPTIONS = [
  { value: "all", label: "Full Impact (All Hops)" },
  { value: "1", label: "Direct Impact Only (1 Hop)" },
  { value: "2", label: "Up to 2 Hops" },
  { value: "3", label: "Up to 3 Hops" },
  { value: "5", label: "Up to 5 Hops" },
];

export function ImpactAnalysisView({
  repository,
  data,
  initialNodeId = null,
}: ImpactAnalysisViewProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialNodeId);
  const [depthOption, setDepthOption] = useState<string>("all");
  const [hasTriggered, setHasTriggered] = useState(false);

  const numericDepth = depthOption === "all" ? undefined : Number(depthOption);

  const {
    data: impactResult,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["analysis-impact", repository.id, selectedNodeId, depthOption],
    queryFn: () => {
      if (!selectedNodeId) throw new Error("No entity selected");
      return analyticsApi.impact(repository.id, selectedNodeId, numericDepth);
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

  // Group impacted nodes by depth
  const depthGroups = (() => {
    if (!impactResult?.impactedNodeIds || !impactResult.depthByNode) {
      return { 1: [], 2: [], transitive: [] };
    }

    const d1: string[] = [];
    const d2: string[] = [];
    const d3Plus: string[] = [];

    for (const nodeId of impactResult.impactedNodeIds) {
      const d = impactResult.depthByNode[nodeId] || 1;
      if (d === 1) d1.push(nodeId);
      else if (d === 2) d2.push(nodeId);
      else d3Plus.push(nodeId);
    }

    return { 1: d1, 2: d2, transitive: d3Plus };
  })();

  const selectedEntity = selectedNodeId
    ? resolveEntity(selectedNodeId, data, repository.id)
    : null;

  return (
    <div className="space-y-6">
      <AnalysisHeader
        title="Impact Analysis"
        question="What components and files will be affected if I modify this entity?"
        category="Entity Analysis"
        icon={Flame}
        iconColor="text-rose-400"
        badgeColor="bg-rose-500/10 text-rose-400 border-rose-500/20"
      />

      {/* Input Selection & Controls */}
      <div className="p-5 rounded-2xl border border-border bg-surface/80 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <EntityPicker
              label="Target Entity to Change"
              placeholder="Search functions, classes, or files to analyze..."
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
              Impact Traversal Depth
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
              Performs backward reachability traversal through calls, imports, extensions, and instantiations.
            </span>
          </div>

          <button
            onClick={handleRun}
            disabled={!selectedNodeId || isRunning}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-light text-background text-xs font-semibold font-mono transition-all duration-150 shadow-md shadow-accent/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            <Play size={14} className={cn("fill-current", isRunning && "animate-spin")} />
            <span>{isRunning ? "Tracing Impact..." : "Run Impact Analysis"}</span>
          </button>
        </div>
      </div>

      {/* Loading */}
      {isRunning && (
        <AnalysisLoadingState
          message={`Tracing impact blast radius for ${selectedEntity?.displayName || "entity"}...`}
          subMessage="Walking upstream callers and importers across the dependency graph"
        />
      )}

      {/* Error */}
      {!isRunning && isError && (
        <AnalysisErrorState
          title="Impact Analysis Failed"
          error={error}
          onRetry={handleRun}
        />
      )}

      {/* Results */}
      {!isRunning && !isError && impactResult && (
        <div className="space-y-6">
          {/* Summary Metric Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border border-border bg-surface/70">
              <span className="text-[11px] font-mono text-muted">
                Total Affected Entities
              </span>
              <div className="text-2xl font-bold font-mono text-foreground mt-1">
                {impactResult.impactedNodeIds.length}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <span className="text-[11px] font-mono text-emerald-400">
                Direct Impact (1 hop)
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {depthGroups[1].length}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
              <span className="text-[11px] font-mono text-indigo-400">
                2 Hops Impact
              </span>
              <div className="text-2xl font-bold font-mono text-indigo-400 mt-1">
                {depthGroups[2].length}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5">
              <span className="text-[11px] font-mono text-purple-400">
                3+ Hops Transitive
              </span>
              <div className="text-2xl font-bold font-mono text-purple-400 mt-1">
                {depthGroups.transitive.length}
              </div>
            </div>
          </div>

          {/* Impact Results Groups or Empty State */}
          {impactResult.impactedNodeIds.length === 0 ? (
            <AnalysisEmptyState
              title="No Impacted Entities Found"
              description="No other repository entities directly or transitively depend on this target. Changes here have zero upstream blast radius."
            />
          ) : (
            <div className="space-y-6">
              {/* Direct Impact Section */}
              {depthGroups[1].length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-400">
                      Direct Impact ({depthGroups[1].length} entities)
                    </h2>
                  </div>
                  <div className="space-y-2">
                    {depthGroups[1].map((nodeId) => (
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

              {/* 2 Hops Section */}
              {depthGroups[2].length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-indigo-400">
                      2 Hops Impact ({depthGroups[2].length} entities)
                    </h2>
                  </div>
                  <div className="space-y-2">
                    {depthGroups[2].map((nodeId) => (
                      <EntityCard
                        key={nodeId}
                        nodeId={nodeId}
                        data={data}
                        repositoryId={repository.id}
                        depth={2}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 3+ Hops Section */}
              {depthGroups.transitive.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-purple-400">
                      3+ Hops Transitive Impact ({depthGroups.transitive.length} entities)
                    </h2>
                  </div>
                  <div className="space-y-2">
                    {depthGroups.transitive.map((nodeId) => (
                      <EntityCard
                        key={nodeId}
                        nodeId={nodeId}
                        data={data}
                        repositoryId={repository.id}
                        depth={impactResult.depthByNode[nodeId] || 3}
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

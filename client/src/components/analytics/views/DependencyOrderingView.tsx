"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ListOrdered,
  Play,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { analyticsApi } from "@/api/repositories";
import { AnalysisHeader } from "../shared/AnalysisHeader";
import { SymbolPicker } from "../pickers/SymbolPicker";
import { EntityCard } from "../shared/EntityCard";
import {
  AnalysisLoadingState,
  AnalysisErrorState,
  AnalysisEmptyState,
} from "../shared/AnalysisStateDisplay";
import { resolveEntity } from "@/lib/analytics/entity-helpers";
import type { Repository } from "@/types";
import type { NormalizedExplorerData } from "@/types/explorer";

interface DependencyOrderingViewProps {
  repository: Repository;
  data: NormalizedExplorerData | null | undefined;
  initialNodeId?: string | null;
}

export function DependencyOrderingView({
  repository,
  data,
  initialNodeId = null,
}: DependencyOrderingViewProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialNodeId);
  const [hasTriggered, setHasTriggered] = useState(false);

  const {
    data: orderingResult,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["analysis-ordering", repository.id, selectedNodeId],
    queryFn: () => {
      if (!selectedNodeId) throw new Error("No symbol selected");
      return analyticsApi.ordering(repository.id, selectedNodeId);
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

  const selectedEntity = selectedNodeId
    ? resolveEntity(selectedNodeId, data, repository.id)
    : null;

  return (
    <div className="space-y-6">
      <AnalysisHeader
        title="Dependency Ordering"
        question="What is the safe initialization and execution order for this symbol and all its dependencies?"
        category="Entity Analysis"
        icon={ListOrdered}
        iconColor="text-teal-400"
        badgeColor="bg-teal-500/10 text-teal-400 border-teal-500/20"
      />

      {/* Input Selection */}
      <div className="p-5 rounded-2xl border border-border bg-surface/80 space-y-4">
        <SymbolPicker
          label="Target Symbol to Order"
          placeholder="Select a function, method, class, or interface..."
          selectedNodeId={selectedNodeId}
          onSelectNode={(id) => {
            setSelectedNodeId(id);
            setHasTriggered(false);
          }}
          data={data}
          repositoryId={repository.id}
        />

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted">
            <Info size={13} className="text-subtle" />
            <span>
              Collects the symbol dependency subgraph and performs Kahn&apos;s topological sort (dependency-first).
            </span>
          </div>

          <button
            onClick={handleRun}
            disabled={!selectedNodeId || isRunning}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-light text-background text-xs font-semibold font-mono transition-all duration-150 shadow-md shadow-accent/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            <Play size={14} className={cn("fill-current", isRunning && "animate-spin")} />
            <span>{isRunning ? "Computing Order..." : "Compute Dependency Order"}</span>
          </button>
        </div>
      </div>

      {/* Loading */}
      {isRunning && (
        <AnalysisLoadingState
          message={`Computing topological order for ${selectedEntity?.displayName || "symbol"}...`}
          subMessage="Building dependency dag and evaluating in-degrees"
        />
      )}

      {/* Error */}
      {!isRunning && isError && (
        <AnalysisErrorState
          title="Dependency Ordering Failed"
          error={error}
          onRetry={handleRun}
        />
      )}

      {/* Results */}
      {!isRunning && !isError && orderingResult && (
        <div className="space-y-6">
          {/* Orderability Status Banner */}
          {orderingResult.isOrderable ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold font-mono text-emerald-400">
                  Fully Orderable (Acyclic Dependency Subgraph)
                </div>
                <div className="text-[11px] font-mono text-muted mt-0.5">
                  A complete topological ordering was successfully computed across {orderingResult.orderedNodeIds.length} symbols.
                  Initialize dependencies starting from Step 1 down to the root target symbol.
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold font-mono text-amber-400">
                  Cycle Detected in Dependency Subgraph
                </div>
                <div className="text-[11px] font-mono text-muted mt-0.5">
                  The dependency subgraph contains a circular relationship, preventing a full topological order.
                  Only a partial order ({orderingResult.orderedNodeIds.length} symbols) could be determined.
                </div>
              </div>
            </div>
          )}

          {/* Sequence List or Empty State */}
          {orderingResult.orderedNodeIds.length === 0 ? (
            <AnalysisEmptyState
              title="No Dependencies to Order"
              description="This symbol has no downstream dependencies, so no ordering sequence is required."
            />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-muted">
                  Initialization Sequence ({orderingResult.orderedNodeIds.length} steps)
                </h2>
                <span className="text-[11px] font-mono text-subtle">
                  Step 1 = First to Initialize
                </span>
              </div>

              <div className="space-y-2">
                {orderingResult.orderedNodeIds.map((nodeId, idx) => {
                  const isRoot = nodeId === orderingResult.sourceNodeId;
                  return (
                    <EntityCard
                      key={nodeId}
                      nodeId={nodeId}
                      data={data}
                      repositoryId={repository.id}
                      stepNumber={idx + 1}
                      highlight={isRoot}
                      action={
                        isRoot ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-accent/10 text-accent border border-accent/20">
                            Root Target
                          </span>
                        ) : undefined
                      }
                    />
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

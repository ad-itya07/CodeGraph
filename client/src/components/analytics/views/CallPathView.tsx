"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  GitFork,
  Play,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  Info,
  ArrowRight,
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

interface CallPathViewProps {
  repository: Repository;
  data: NormalizedExplorerData | null | undefined;
  initialSourceId?: string | null;
  initialTargetId?: string | null;
}

export function CallPathView({
  repository,
  data,
  initialSourceId = null,
  initialTargetId = null,
}: CallPathViewProps) {
  const [sourceNodeId, setSourceNodeId] = useState<string | null>(initialSourceId);
  const [targetNodeId, setTargetNodeId] = useState<string | null>(initialTargetId);
  const [hasTriggered, setHasTriggered] = useState(false);

  const isValidSelection = !!sourceNodeId && !!targetNodeId && sourceNodeId !== targetNodeId;

  const {
    data: pathResult,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["analysis-callpath", repository.id, sourceNodeId, targetNodeId],
    queryFn: () => {
      if (!sourceNodeId || !targetNodeId) {
        throw new Error("Source and target symbols are required");
      }
      return analyticsApi.callPath(repository.id, sourceNodeId, targetNodeId);
    },
    enabled: hasTriggered && isValidSelection,
    retry: false,
  });

  const isRunning = isLoading || isFetching;

  const handleRun = () => {
    if (!isValidSelection) return;
    setHasTriggered(true);
    if (hasTriggered) {
      refetch();
    }
  };

  const sourceEntity = sourceNodeId
    ? resolveEntity(sourceNodeId, data, repository.id)
    : null;
  const targetEntity = targetNodeId
    ? resolveEntity(targetNodeId, data, repository.id)
    : null;

  return (
    <div className="space-y-6">
      <AnalysisHeader
        title="Call Path Analysis"
        question="Is there an active function/method invocation path between these two symbols?"
        category="Relationship Analysis"
        icon={GitFork}
        iconColor="text-purple-400"
        badgeColor="bg-purple-500/10 text-purple-400 border-purple-500/20"
      />

      {/* Input Selection Dual Pickers */}
      <div className="p-5 rounded-2xl border border-border bg-surface/80 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SymbolPicker
            label="1. Source Symbol (Caller / Entry)"
            placeholder="Select starting function or method..."
            selectedNodeId={sourceNodeId}
            onSelectNode={(id) => {
              setSourceNodeId(id);
              setHasTriggered(false);
            }}
            data={data}
            repositoryId={repository.id}
          />

          <SymbolPicker
            label="2. Target Symbol (Callee / Destination)"
            placeholder="Select target function or method..."
            selectedNodeId={targetNodeId}
            onSelectNode={(id) => {
              setTargetNodeId(id);
              setHasTriggered(false);
            }}
            data={data}
            repositoryId={repository.id}
          />
        </div>

        {sourceNodeId && targetNodeId && sourceNodeId === targetNodeId && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-400 flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>Source and target must be two distinct symbols.</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted">
            <Info size={13} className="text-subtle" />
            <span>
              Performs depth-first search (DFS) over &apos;calls&apos; edges connecting code entities.
            </span>
          </div>

          <button
            onClick={handleRun}
            disabled={!isValidSelection || isRunning}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-light text-background text-xs font-semibold font-mono transition-all duration-150 shadow-md shadow-accent/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            <Play size={14} className={cn("fill-current", isRunning && "animate-spin")} />
            <span>{isRunning ? "Searching Path..." : "Find Call Path"}</span>
          </button>
        </div>
      </div>

      {/* Loading */}
      {isRunning && (
        <AnalysisLoadingState
          message={`Searching call path from ${sourceEntity?.displayName || "source"} to ${targetEntity?.displayName || "target"}...`}
          subMessage="Traversing invocation relationships across functions and methods"
        />
      )}

      {/* Error */}
      {!isRunning && isError && (
        <AnalysisErrorState
          title="Call Path Analysis Failed"
          error={error}
          onRetry={handleRun}
        />
      )}

      {/* Results */}
      {!isRunning && !isError && pathResult && (
        <div className="space-y-6">
          {pathResult.path && pathResult.path.length > 0 ? (
            <div className="space-y-4">
              {/* Path Success Banner */}
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="text-purple-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold font-mono text-purple-400">
                      Call Path Found ({pathResult.path.length - 1} {pathResult.path.length - 1 === 1 ? "call hop" : "call hops"})
                    </div>
                    <div className="text-[11px] font-mono text-muted mt-0.5">
                      Direct invocation sequence from {sourceEntity?.displayName} to {targetEntity?.displayName}.
                    </div>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-surface border border-border text-foreground shrink-0">
                  {pathResult.path.length} symbols in chain
                </span>
              </div>

              {/* Linear Step-by-Step Directed Chain */}
              <div className="space-y-2">
                {pathResult.path.map((nodeId, idx) => {
                  const isSource = idx === 0;
                  const isTarget = idx === pathResult.path!.length - 1;
                  const isLast = idx === pathResult.path!.length - 1;

                  return (
                    <div key={nodeId} className="space-y-2">
                      <EntityCard
                        nodeId={nodeId}
                        data={data}
                        repositoryId={repository.id}
                        stepNumber={idx + 1}
                        highlight={isSource || isTarget}
                        action={
                          isSource ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              Entry Source
                            </span>
                          ) : isTarget ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Target Destination
                            </span>
                          ) : undefined
                        }
                      />

                      {!isLast && (
                        <div className="flex items-center justify-center py-1">
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-elevated/70 border border-border text-[10px] font-mono text-purple-400">
                            <span>calls</span>
                            <ArrowDown size={12} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <AnalysisEmptyState
              title="No Call Path Found"
              description={`No sequence of 'calls' relationships connects ${sourceEntity?.displayName || "source"} to ${targetEntity?.displayName || "target"}.`}
            />
          )}
        </div>
      )}
    </div>
  );
}

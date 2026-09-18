"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  History,
  Zap,
  Network,
  Route,
  RefreshCw,
  ListOrdered,
  Activity,
  Filter,
  ArrowRight,
  FolderTree,
  RotateCcw,
  Sparkles,
  Search,
  X,
  Clock,
} from "lucide-react";
import { repositoriesApi } from "@/api/repositories";
import { AnalysisCoverageNotice } from "@/components/analytics/shared/AnalysisCoverageNotice";
import { AnalysisErrorState } from "@/components/analytics/shared/AnalysisStateDisplay";
import type { AnalysisActivity } from "@/types";

const ANALYSIS_CONFIG: Record<
  string,
  {
    label: string;
    icon: typeof Zap;
    colorClass: string;
    badgeClass: string;
  }
> = {
  impact: {
    label: "Impact Analysis",
    icon: Zap,
    colorClass: "text-amber-400",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  dependencies: {
    label: "Dependency Analysis",
    icon: Network,
    colorClass: "text-blue-400",
    badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  "call-path": {
    label: "Call Path Analysis",
    icon: Route,
    colorClass: "text-indigo-400",
    badgeClass: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  },
  cycles: {
    label: "Cycle Detection",
    icon: RefreshCw,
    colorClass: "text-rose-400",
    badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  },
  ordering: {
    label: "Dependency Ordering",
    icon: ListOrdered,
    colorClass: "text-emerald-400",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  connectivity: {
    label: "Connectivity Analysis",
    icon: Activity,
    colorClass: "text-cyan-400",
    badgeClass: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  },
};

function formatTimeAgo(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (isNaN(diffInSeconds) || diffInSeconds < 0) return "Just now";
    if (diffInSeconds < 60) return "Just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

function getAnalyzeUrl(repoId: string, activity: AnalysisActivity): string {
  const base = `/repository/${repoId}/analyze?analysis=${activity.analysisType}`;
  if (activity.analysisType === "call-path") {
    const params = new URLSearchParams({ analysis: "call-path" });
    if (activity.entityId) params.set("source", activity.entityId);
    if (activity.targetEntityId) params.set("target", activity.targetEntityId);
    return `/repository/${repoId}/analyze?${params.toString()}`;
  }
  if (activity.entityId) {
    return `${base}&entity=${encodeURIComponent(activity.entityId)}`;
  }
  return base;
}

function getActivitySummary(activity: AnalysisActivity): string {
  const d = activity.details || {};
  switch (activity.analysisType) {
    case "impact": {
      const count = d.impactedCount ?? 0;
      const depthStr = d.maxDepth && d.maxDepth !== "default" ? ` (depth ${d.maxDepth})` : "";
      return `Impacted ${count} downstream ${count === 1 ? "node" : "nodes"}${depthStr}`;
    }
    case "dependencies": {
      const count = d.dependencyCount ?? 0;
      const depthStr = d.maxDepth && d.maxDepth !== "default" ? ` (depth ${d.maxDepth})` : "";
      return `Traced ${count} upstream ${count === 1 ? "dependency" : "dependencies"}${depthStr}`;
    }
    case "call-path": {
      if (d.hasPath) {
        return `Path verified (${d.pathLength} ${d.pathLength === 1 ? "step" : "steps"})`;
      }
      return "No direct path between target nodes";
    }
    case "cycles": {
      const count = d.cycleCount ?? 0;
      return `Scanned repository · ${count} ${count === 1 ? "cycle" : "cycles"} identified`;
    }
    case "ordering": {
      const count = d.orderedCount ?? 0;
      return d.isOrderable
        ? `Topological order computed (${count} nodes)`
        : `Topological ordering blocked by cyclic dependencies`;
    }
    case "connectivity": {
      const fanIn = d.fanIn ?? 0;
      const fanOut = d.fanOut ?? 0;
      return `Fan-in: ${fanIn} callers · Fan-out: ${fanOut} dependencies`;
    }
    default:
      return "Analysis executed";
  }
}

export default function RepositoryActivityPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const unwrappedParams =
    typeof (params as any).then === "function"
      ? use(params as Promise<{ id: string }>)
      : (params as { id: string });
  const id = unwrappedParams.id;

  const [selectedAnalysis, setSelectedAnalysis] = useState<string>("all");
  const [selectedEntityKind, setSelectedEntityKind] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const {
    data: activities = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["repository-activity", id],
    queryFn: () => repositoriesApi.getActivity(id),
    enabled: !!id,
    refetchOnWindowFocus: true,
  });

  // Dynamically extract available analysis types and their overall counts
  const availableAnalysisTypes = useMemo(() => {
    const types = new Set<string>();
    for (const act of activities) {
      if (act.analysisType) {
        types.add(act.analysisType);
      }
    }
    return Array.from(types);
  }, [activities]);

  // Dynamically compute available entity kinds and their counts BASED ON the currently selected analysis
  const { availableEntityKinds, entityKindCounts, totalForSelectedAnalysis } = useMemo(() => {
    const baseActivities =
      selectedAnalysis === "all"
        ? activities
        : activities.filter((act) => act.analysisType === selectedAnalysis);

    const counts = new Map<string, number>();
    for (const act of baseActivities) {
      if (act.entityKind) {
        counts.set(act.entityKind, (counts.get(act.entityKind) || 0) + 1);
      }
      if (act.targetEntityKind && act.targetEntityKind !== act.entityKind) {
        counts.set(act.targetEntityKind, (counts.get(act.targetEntityKind) || 0) + 1);
      }
    }

    return {
      availableEntityKinds: Array.from(counts.keys()).sort(),
      entityKindCounts: counts,
      totalForSelectedAnalysis: baseActivities.length,
    };
  }, [activities, selectedAnalysis]);

  // Handle analysis selection and auto-reset entity kind if no longer present in that analysis
  const handleAnalysisChange = (newAnalysis: string) => {
    setSelectedAnalysis(newAnalysis);
    if (selectedEntityKind !== "all") {
      const matchingActivities =
        newAnalysis === "all"
          ? activities
          : activities.filter((a) => a.analysisType === newAnalysis);

      const hasKind = matchingActivities.some(
        (a) => a.entityKind === selectedEntityKind || a.targetEntityKind === selectedEntityKind
      );

      if (!hasKind) {
        setSelectedEntityKind("all");
      }
    }
  };

  // Filter activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (selectedAnalysis !== "all" && act.analysisType !== selectedAnalysis) {
        return false;
      }
      if (
        selectedEntityKind !== "all" &&
        act.entityKind !== selectedEntityKind &&
        act.targetEntityKind !== selectedEntityKind
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = act.entityName?.toLowerCase().includes(query);
        const matchesPath = act.entityPath?.toLowerCase().includes(query);
        const matchesTarget = act.targetEntityName?.toLowerCase().includes(query);
        const matchesType = act.analysisType.toLowerCase().includes(query);
        if (!matchesName && !matchesPath && !matchesTarget && !matchesType) {
          return false;
        }
      }
      return true;
    });
  }, [activities, selectedAnalysis, selectedEntityKind, searchQuery]);

  const hasActiveFilters =
    selectedAnalysis !== "all" ||
    selectedEntityKind !== "all" ||
    searchQuery.trim().length > 0;

  const handleResetFilters = () => {
    setSelectedAnalysis("all");
    setSelectedEntityKind("all");
    setSearchQuery("");
  };

  return (
    <div className="flex-1 min-w-0 min-h-0 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <History size={17} />
            </div>
            <h1 className="text-xl font-bold font-heading text-foreground tracking-tight">
              Recent Activity
            </h1>
          </div>
          <p className="text-xs text-muted font-mono leading-relaxed">
            Audit trail of analysis runs, dependency traces, and architectural investigations in this repository.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh activity history"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface border border-border hover:border-border-highlight text-xs font-mono font-medium text-foreground transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCcw size={13} className={isFetching ? "animate-spin text-accent" : ""} />
            <span>{isFetching ? "Refreshing..." : "Refresh"}</span>
          </button>

          <Link
            href={`/repository/${id}/analyze`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent text-background hover:bg-accent-light text-xs font-mono font-semibold transition-colors"
          >
            <Sparkles size={13} />
            <span>Analyze Workspace</span>
          </Link>
        </div>
      </div>

      {/* Analysis Coverage Notice */}
      <AnalysisCoverageNotice />

      {/* Filter Toolbar */}
      {activities.length > 0 && (
        <div className="p-3.5 rounded-xl bg-surface/50 border border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-mono text-muted pr-1">
              <Filter size={13} className="text-subtle" />
              <span>Filter by:</span>
            </div>

            {/* Analysis Type Select */}
            <select
              value={selectedAnalysis}
              onChange={(e) => handleAnalysisChange(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-border hover:border-border-highlight text-xs font-mono text-foreground focus:outline-none focus:border-accent transition-colors cursor-pointer"
            >
              <option value="all">All Analyses ({activities.length})</option>
              {Object.entries(ANALYSIS_CONFIG).map(([key, config]) => {
                const count = activities.filter((a) => a.analysisType === key).length;
                if (count === 0 && !availableAnalysisTypes.includes(key)) return null;
                return (
                  <option key={key} value={key}>
                    {config.label} ({count})
                  </option>
                );
              })}
            </select>

            {/* Entity Kind Select - Dynamically scoped to the selected analysis */}
            {availableEntityKinds.length > 0 && (
              <select
                value={selectedEntityKind}
                onChange={(e) => setSelectedEntityKind(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-border hover:border-border-highlight text-xs font-mono text-foreground focus:outline-none focus:border-accent transition-colors cursor-pointer capitalize"
              >
                <option value="all">
                  All Entity Kinds ({totalForSelectedAnalysis})
                </option>
                {availableEntityKinds.map((kind) => {
                  const count = entityKindCounts.get(kind) || 0;
                  return (
                    <option key={kind} value={kind}>
                      {kind.charAt(0).toUpperCase() + kind.slice(1)} ({count})
                    </option>
                  );
                })}
              </select>
            )}

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface border border-border text-xs font-mono text-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <X size={12} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[200px] max-w-xs">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activity..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface-elevated border border-border hover:border-border-highlight text-xs font-mono text-foreground placeholder:text-subtle focus:outline-none focus:border-accent transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-subtle hover:text-foreground"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content Pane */}
      {isLoading ? (
        <div className="space-y-3 py-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-surface/40 border border-border/70 flex items-start gap-3.5 animate-pulse"
            >
              <div className="w-10 h-10 rounded-lg bg-surface-elevated shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-48 bg-surface-elevated rounded" />
                <div className="h-2.5 w-72 bg-surface-elevated/70 rounded" />
                <div className="h-2 w-32 bg-surface-elevated/50 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <AnalysisErrorState
          title="Failed to Load Recent Activity"
          error={error}
          onRetry={() => refetch()}
        />
      ) : activities.length === 0 ? (
        /* True Empty State */
        <div className="py-16 px-6 rounded-2xl border border-border border-dashed bg-surface/30 flex flex-col items-center justify-center text-center">
          <div className="w-13 h-13 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4 shadow-sm">
            <History size={26} />
          </div>
          <h3 className="text-base font-bold font-heading text-foreground mb-1.5">
            No recent activity
          </h3>
          <p className="text-xs text-muted max-w-md font-mono leading-relaxed mb-6">
            Analysis activity will appear here in real-time as you explore, trace dependencies, and run architectural queries on this repository.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/repository/${id}/analyze`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-background text-xs font-mono font-semibold rounded-lg hover:bg-accent-light transition-colors"
            >
              <Sparkles size={14} />
              <span>Launch Analysis Workspace</span>
            </Link>
            <Link
              href={`/repository/${id}/explorer`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-surface-elevated hover:bg-surface border border-border text-foreground text-xs font-mono font-medium rounded-lg transition-colors"
            >
              <FolderTree size={14} />
              <span>Browse Codebase</span>
            </Link>
          </div>
        </div>
      ) : filteredActivities.length === 0 ? (
        /* Filtered Empty State */
        <div className="py-14 px-6 rounded-2xl border border-border border-dashed bg-surface/20 flex flex-col items-center justify-center text-center">
          <div className="w-11 h-11 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-muted mb-3">
            <Filter size={20} />
          </div>
          <h3 className="text-sm font-semibold font-heading text-foreground mb-1">
            No activity matches your filters
          </h3>
          <p className="text-xs text-muted max-w-sm font-mono leading-relaxed mb-4">
            Try selecting another analysis category, clearing the entity filter, or resetting search keywords.
          </p>
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface border border-border text-xs font-mono font-medium text-foreground transition-colors cursor-pointer"
          >
            <X size={12} />
            <span>Reset Filters</span>
          </button>
        </div>
      ) : (
        /* Chronological Activity List */
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] font-mono text-muted px-1">
            <span>
              Showing {filteredActivities.length}{" "}
              {filteredActivities.length === 1 ? "record" : "records"}
            </span>
            <span>Sorted by newest first</span>
          </div>

          <div className="space-y-2.5">
            {filteredActivities.map((act) => {
              const config = ANALYSIS_CONFIG[act.analysisType] || {
                label: act.analysisType,
                icon: Activity,
                colorClass: "text-accent",
                badgeClass: "bg-accent/10 text-accent border-accent/20",
              };
              const Icon = config.icon;
              const analyzeUrl = getAnalyzeUrl(id, act);
              const summary = getActivitySummary(act);

              return (
                <div
                  key={act.id}
                  className="group relative p-4 rounded-xl bg-surface/50 hover:bg-surface border border-border/80 hover:border-border-highlight transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Left: Icon & Details */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${config.badgeClass}`}
                      title={config.label}
                    >
                      <Icon size={17} />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      {/* Analysis Header & Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold font-mono text-foreground">
                          {config.label}
                        </span>

                        {act.entityKind && (
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-surface-elevated border border-border text-muted">
                            {act.entityKind}
                          </span>
                        )}

                        <span
                          className="text-[11px] font-mono text-subtle flex items-center gap-1"
                          title={new Date(act.timestamp).toLocaleString()}
                        >
                          <Clock size={11} className="shrink-0" />
                          <span>{formatTimeAgo(act.timestamp)}</span>
                        </span>
                      </div>

                      {/* Primary Entity / Target */}
                      {act.entityName ? (
                        <div className="flex items-center gap-1.5 text-xs font-mono text-foreground truncate">
                          <span className="text-accent font-semibold truncate max-w-xs sm:max-w-md">
                            {act.entityName}
                          </span>
                          {act.targetEntityName && (
                            <>
                              <span className="text-subtle">→</span>
                              <span className="text-accent font-semibold truncate max-w-xs sm:max-w-md">
                                {act.targetEntityName}
                              </span>
                            </>
                          )}
                        </div>
                      ) : null}

                      {/* Path & Analysis Summary */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] font-mono text-muted">
                        {act.entityPath && (
                          <span className="truncate max-w-xs sm:max-w-md text-subtle" title={act.entityPath}>
                            {act.entityPath}
                          </span>
                        )}
                        <span className="text-foreground/80">{summary}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Action to open in Analyze */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Link
                      href={analyzeUrl}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-accent hover:text-background border border-border hover:border-transparent text-xs font-mono text-muted hover:text-background font-medium transition-all group/btn"
                    >
                      <span>Inspect</span>
                      <ArrowRight size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { use } from "react";
import Link from "next/link";
import {
  FolderTree,
  FolderGit2,
  Activity,
  ArrowRight,
  GitCommit,
  Calendar,
  ExternalLink,
  Files,
  Code2,
  Network,
  Package,
  Boxes,
  RotateCcw,
  Compass,
  AlertTriangle,
  Flame,
  Radio,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { repositoriesApi } from "@/api/repositories";
import { HealthIndexCard } from "@/components/overview/HealthIndexCard";
import { OverviewMetricCard } from "@/components/overview/OverviewMetricCard";
import { AnalysisCoverageCard } from "@/components/overview/AnalysisCoverageCard";
import { getRepositoryRelativePath } from "@/lib/explorer/paths";

function formatNumber(num?: number): string {
  if (num === undefined || num === null) return "—";
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toLocaleString();
}

function cleanFilePath(fileId: string | null | undefined, repositoryId?: string | null): string {
  if (!fileId) return "—";
  const raw = fileId.replace(/^file:/, "");
  const rel = getRepositoryRelativePath(raw, repositoryId);
  return rel || raw;
}

function cleanSymbolName(id: string | null | undefined): string {
  if (!id) return "—";
  const cleanId = id.replace(/^symbol:/, "");
  const parts = cleanId.split(":");
  return parts[parts.length - 1] || cleanId;
}

export default function RepositoryOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const {
    data: repository,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["repository", id],
    queryFn: () => repositoriesApi.get(id),
  });

  const overview = repository?.overview;
  const stats = overview?.statistics;
  const health = overview?.health;
  const insights = overview?.insights;

  const formattedDate = repository?.createdAt
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(repository.createdAt))
    : null;

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted mb-1.5">
            <FolderGit2 size={14} className="text-accent" />
            <span>Repository Overview</span>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <div className="h-7 w-48 bg-surface-elevated animate-pulse rounded-lg" />
              <div className="h-4 w-72 bg-surface-elevated animate-pulse rounded-md" />
            </div>
          ) : (
            <>
              <h1 className="text-2xl lg:text-3xl font-bold font-heading text-foreground tracking-tight">
                {repository?.name || "Repository"}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted font-mono mt-1.5">
                {repository?.url && (
                  <a
                    href={repository.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-subtle hover:text-foreground transition-colors"
                  >
                    <span>{repository.url.replace(/^https?:\/\/(www\.)?github\.com\//, "")}</span>
                    <ExternalLink size={11} className="shrink-0" />
                  </a>
                )}

                {repository?.commitSha && (
                  <span className="inline-flex items-center gap-1 text-subtle">
                    <GitCommit size={12} className="shrink-0" />
                    <span>{repository.commitSha.slice(0, 7)}</span>
                  </span>
                )}

                {formattedDate && (
                  <span className="inline-flex items-center gap-1 text-subtle">
                    <Calendar size={12} className="shrink-0" />
                    <span>Indexed {formattedDate}</span>
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        <Link
          href={`/repository/${id}/explorer`}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-background text-sm font-semibold rounded-lg hover:bg-accent-light transition-colors shadow-sm self-start sm:self-auto shrink-0"
        >
          <FolderTree size={16} />
          <span>Open Repository Explorer</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Error state */}
      {isError && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle size={16} />
            <span>Failed to load repository overview data.</span>
          </div>
          <button
            onClick={() => refetch()}
            className="px-3 py-1 rounded bg-danger/20 hover:bg-danger/30 text-xs font-semibold transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Primary Overview Row: Health Index + Entity Counts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Prominent Health Index Card (1 Col) */}
        <div className="lg:col-span-1">
          <HealthIndexCard health={health} isLoading={isLoading} />
        </div>

        {/* Entity Statistics Grid (2 Cols) */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <OverviewMetricCard
            title="Files"
            value={formatNumber(stats?.fileCount)}
            subtitle="Indexed source files"
            icon={<Files size={15} />}
            isLoading={isLoading}
          />
          <OverviewMetricCard
            title="AST Symbols"
            value={formatNumber(stats?.symbolCount)}
            subtitle="Functions, classes, types"
            icon={<Code2 size={15} />}
            isLoading={isLoading}
          />
          <OverviewMetricCard
            title="Relationships"
            value={formatNumber(stats?.relationshipCount)}
            subtitle="Direct graph edges"
            icon={<Network size={15} />}
            isLoading={isLoading}
          />
          <OverviewMetricCard
            title="Dependencies"
            value={formatNumber(stats?.dependencyCount)}
            subtitle="External npm packages"
            icon={<Package size={15} />}
            isLoading={isLoading}
          />
          <OverviewMetricCard
            title="Modules"
            value={formatNumber(stats?.moduleCount)}
            subtitle="Unresolved / built-in roots"
            icon={<Boxes size={15} />}
            isLoading={isLoading}
          />
          <OverviewMetricCard
            title="Cycles"
            value={formatNumber(insights?.cycleCount ?? 0)}
            subtitle={insights?.cycleCount ? "Circular dependencies" : "Zero circular paths"}
            icon={<RotateCcw size={15} className={insights?.cycleCount ? "text-amber-400" : "text-emerald-400"} />}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Analysis Coverage & Static Model Disclosure */}
      <AnalysisCoverageCard />

      {/* Structural Insights & Hotspots Section */}
      {insights && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold font-heading text-foreground">
              Structural Graph Insights
            </h2>
            <span className="text-[11px] font-mono text-subtle">
              Click any signal to inspect in Explorer
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Most Connected File */}
            {insights.mostConnectedFileId ? (
              <Link
                href={`/repository/${id}/explorer?file=${encodeURIComponent(insights.mostConnectedFileId)}&panel=graph`}
                className="p-4 rounded-xl bg-surface border border-border hover:border-accent/40 hover:bg-surface-elevated/40 transition-all group flex flex-col justify-between"
                title={`Open ${cleanFilePath(insights.mostConnectedFileId, id)} in Explorer`}
              >
                <div>
                  <div className="flex items-center justify-between text-muted mb-2">
                    <span className="text-xs font-medium">Most Connected File</span>
                    <Compass size={14} className="group-hover:text-accent transition-colors" />
                  </div>
                  <p
                    className="text-xs font-mono font-semibold text-foreground group-hover:text-accent transition-colors truncate"
                    title={cleanFilePath(insights.mostConnectedFileId, id)}
                  >
                    {cleanFilePath(insights.mostConnectedFileId, id)}
                  </p>
                  <p className="text-[11px] font-mono text-subtle mt-1">
                    {insights.mostConnectedFileConnections > 0
                      ? `${insights.mostConnectedFileConnections} total connections`
                      : "No inter-file connections"}
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-xs text-accent font-medium">
                  <span>Open in Explorer</span>
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ) : (
              <div className="p-4 rounded-xl bg-surface border border-border flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-muted mb-2">
                    <span className="text-xs font-medium">Most Connected File</span>
                    <Compass size={14} />
                  </div>
                  <p className="text-xs font-mono font-semibold text-muted">—</p>
                </div>
                <div className="mt-3 pt-2 border-t border-border/50 text-[11px] font-mono text-subtle">
                  No inter-file connections
                </div>
              </div>
            )}

            {/* Most Connected Symbol */}
            {insights.mostConnectedSymbolId ? (
              <Link
                href={`/repository/${id}/explorer?entity=${encodeURIComponent(insights.mostConnectedSymbolId)}&panel=graph`}
                className="p-4 rounded-xl bg-surface border border-border hover:border-accent/40 hover:bg-surface-elevated/40 transition-all group flex flex-col justify-between"
                title={`Open ${cleanSymbolName(insights.mostConnectedSymbolId)} in Explorer`}
              >
                <div>
                  <div className="flex items-center justify-between text-muted mb-2">
                    <span className="text-xs font-medium">Most Connected Symbol</span>
                    <Code2 size={14} className="group-hover:text-accent transition-colors" />
                  </div>
                  <p
                    className="text-xs font-mono font-semibold text-foreground group-hover:text-accent transition-colors truncate"
                    title={cleanSymbolName(insights.mostConnectedSymbolId)}
                  >
                    {cleanSymbolName(insights.mostConnectedSymbolId)}
                  </p>
                  <p className="text-[11px] font-mono text-subtle mt-1">
                    {insights.mostConnectedSymbolConnections > 0
                      ? `${insights.mostConnectedSymbolConnections} symbol references`
                      : "No symbol connections"}
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-xs text-accent font-medium">
                  <span>Open in Explorer</span>
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ) : (
              <div className="p-4 rounded-xl bg-surface border border-border flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-muted mb-2">
                    <span className="text-xs font-medium">Most Connected Symbol</span>
                    <Code2 size={14} />
                  </div>
                  <p className="text-xs font-mono font-semibold text-muted">—</p>
                </div>
                <div className="mt-3 pt-2 border-t border-border/50 text-[11px] font-mono text-subtle">
                  No symbol connections
                </div>
              </div>
            )}

            {/* Highest Fan-In (Hub Symbol) */}
            {insights.highestFanInSymbolId ? (
              <Link
                href={`/repository/${id}/explorer?entity=${encodeURIComponent(insights.highestFanInSymbolId)}&panel=graph`}
                className="p-4 rounded-xl bg-surface border border-border hover:border-accent/40 hover:bg-surface-elevated/40 transition-all group flex flex-col justify-between"
                title={`Open ${cleanSymbolName(insights.highestFanInSymbolId)} in Explorer`}
              >
                <div>
                  <div className="flex items-center justify-between text-muted mb-2">
                    <span className="text-xs font-medium">Peak Fan-In (Hub)</span>
                    <Radio size={14} className="group-hover:text-accent transition-colors" />
                  </div>
                  <p
                    className="text-xs font-mono font-semibold text-foreground group-hover:text-accent transition-colors truncate"
                    title={cleanSymbolName(insights.highestFanInSymbolId)}
                  >
                    {cleanSymbolName(insights.highestFanInSymbolId)}
                  </p>
                  <p className="text-[11px] font-mono text-subtle mt-1">
                    {insights.highestFanIn > 0
                      ? `${insights.highestFanIn} incoming callers`
                      : "0 incoming callers"}
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-xs text-accent font-medium">
                  <span>Open in Explorer</span>
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ) : (
              <div className="p-4 rounded-xl bg-surface border border-border flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-muted mb-2">
                    <span className="text-xs font-medium">Peak Fan-In (Hub)</span>
                    <Radio size={14} />
                  </div>
                  <p className="text-xs font-mono font-semibold text-muted">—</p>
                </div>
                <div className="mt-3 pt-2 border-t border-border/50 text-[11px] font-mono text-subtle">
                  0 incoming callers
                </div>
              </div>
            )}

            {/* Highest Fan-Out (Hotspot) */}
            {insights.highestFanOutSymbolId ? (
              <Link
                href={`/repository/${id}/explorer?entity=${encodeURIComponent(insights.highestFanOutSymbolId)}&panel=graph`}
                className="p-4 rounded-xl bg-surface border border-border hover:border-accent/40 hover:bg-surface-elevated/40 transition-all group flex flex-col justify-between"
                title={`Open ${cleanSymbolName(insights.highestFanOutSymbolId)} in Explorer`}
              >
                <div>
                  <div className="flex items-center justify-between text-muted mb-2">
                    <span className="text-xs font-medium">Peak Fan-Out (Hotspot)</span>
                    <Flame size={14} className="group-hover:text-accent transition-colors" />
                  </div>
                  <p
                    className="text-xs font-mono font-semibold text-foreground group-hover:text-accent transition-colors truncate"
                    title={cleanSymbolName(insights.highestFanOutSymbolId)}
                  >
                    {cleanSymbolName(insights.highestFanOutSymbolId)}
                  </p>
                  <p className="text-[11px] font-mono text-subtle mt-1">
                    {insights.highestFanOut > 0
                      ? `${insights.highestFanOut} outgoing targets`
                      : "0 outgoing targets"}
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-xs text-accent font-medium">
                  <span>Open in Explorer</span>
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ) : (
              <div className="p-4 rounded-xl bg-surface border border-border flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-muted mb-2">
                    <span className="text-xs font-medium">Peak Fan-Out (Hotspot)</span>
                    <Flame size={14} />
                  </div>
                  <p className="text-xs font-mono font-semibold text-muted">—</p>
                </div>
                <div className="mt-3 pt-2 border-t border-border/50 text-[11px] font-mono text-subtle">
                  0 outgoing targets
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Quick Access Grid */}
      <div className="space-y-3 pt-2">
        <h2 className="text-sm font-semibold font-heading text-foreground">
          Repository Environments
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Explorer Card */}
          <Link
            href={`/repository/${id}/explorer`}
            className="p-5 rounded-xl bg-surface border border-border hover:border-accent/40 hover:bg-surface-elevated/40 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-3 group-hover:scale-105 transition-transform">
                <FolderTree size={20} />
              </div>
              <h3 className="text-base font-semibold font-heading text-foreground mb-1 group-hover:text-accent transition-colors">
                Repository Explorer
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Explore files, AST symbols, structural hierarchies, cross-file relationships, dependencies, and contextual graphs.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-accent font-medium">
              <span>Launch Explorer</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Analyze Card */}
          <Link
            href={`/repository/${id}/analyze`}
            className="p-5 rounded-xl bg-surface border border-border hover:border-border-highlight hover:bg-surface-elevated/40 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-muted mb-3 group-hover:text-foreground transition-colors">
                <Activity size={20} />
              </div>
              <h3 className="text-base font-semibold font-heading text-foreground mb-1 group-hover:text-foreground transition-colors">
                Analytics Engine
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Dedicated repository analytics for cycle detection, topological ordering, impact tracing, and coupling indexes.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted group-hover:text-foreground">
              <span>View Analytics</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

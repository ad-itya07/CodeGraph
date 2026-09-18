"use client";

import {
  RotateCw,
  Flame,
  Boxes,
  ListOrdered,
  Activity,
  GitFork,
  ArrowRight,
  Sparkles,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalysisType, Repository } from "@/types";

interface AnalyticsHomeProps {
  repository: Repository;
  onSelectAnalysis: (analysis: AnalysisType) => void;
}

export function AnalyticsHome({
  repository,
  onSelectAnalysis,
}: AnalyticsHomeProps) {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-8">
      {/* Hero Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-surface-elevated/70 via-surface/80 to-surface border border-border/80 relative overflow-hidden">
        <div className="max-w-2xl space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs font-mono text-accent">
            <Sparkles size={13} />
            <span>Repository Analytics Workspace</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-foreground tracking-tight">
            Investigate structural relationships and change propagation
          </h1>

          <p className="text-xs sm:text-sm text-muted leading-relaxed font-mono">
            Answer complex architectural questions about {repository.name} without needing to inspect raw graph nodes or write query scripts.
          </p>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-accent/5 to-transparent pointer-events-none" />
      </div>

      {/* 1. Repository-Wide Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-muted">
            Repository-Wide Analysis
          </h2>
        </div>

        <div
          onClick={() => onSelectAnalysis("cycles")}
          className="p-5 rounded-2xl border border-border hover:border-blue-500/40 bg-surface/85 hover:bg-surface-elevated/90 transition-all duration-150 cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              <RotateCw size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-heading text-foreground group-hover:text-blue-400 transition-colors">
                  Cycle Analysis
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Global Graph
                </span>
              </div>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Find all circular dependencies across file imports, function/method recursion, and class inheritance hierarchies.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-mono font-semibold text-blue-400 self-end sm:self-center shrink-0 group-hover:translate-x-0.5 transition-transform">
            <span>Run Cycles</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>

      {/* 2. Single Entity Analysis Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-muted">
            Entity-Level Analysis
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Impact */}
          <div
            onClick={() => onSelectAnalysis("impact")}
            className="p-5 rounded-2xl border border-border hover:border-rose-500/40 bg-surface/85 hover:bg-surface-elevated/90 transition-all duration-150 cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Flame size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold font-heading text-foreground group-hover:text-rose-400 transition-colors">
                  Impact Analysis
                </h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  &ldquo;What could be affected if I change this?&rdquo; Traces backward upstream callers, importers, and consumers.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs font-mono">
              <span className="text-subtle">Configurable Depth</span>
              <span className="text-rose-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>Analyze Impact</span>
                <ArrowRight size={13} />
              </span>
            </div>
          </div>

          {/* Dependencies */}
          <div
            onClick={() => onSelectAnalysis("dependencies")}
            className="p-5 rounded-2xl border border-border hover:border-indigo-500/40 bg-surface/85 hover:bg-surface-elevated/90 transition-all duration-150 cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Boxes size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold font-heading text-foreground group-hover:text-indigo-400 transition-colors">
                  Dependency Analysis
                </h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  &ldquo;What does this entity depend on?&rdquo; Categorizes direct and transitive downstream dependencies.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs font-mono">
              <span className="text-subtle">Direct & Transitive</span>
              <span className="text-indigo-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>Trace Dependencies</span>
                <ArrowRight size={13} />
              </span>
            </div>
          </div>

          {/* Ordering */}
          <div
            onClick={() => onSelectAnalysis("ordering")}
            className="p-5 rounded-2xl border border-border hover:border-teal-500/40 bg-surface/85 hover:bg-surface-elevated/90 transition-all duration-150 cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ListOrdered size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold font-heading text-foreground group-hover:text-teal-400 transition-colors">
                  Dependency Ordering
                </h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  &ldquo;What initialization order is required?&rdquo; Produces topological sort ordering for symbols.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs font-mono">
              <span className="text-subtle">Topological Sort</span>
              <span className="text-teal-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>Compute Order</span>
                <ArrowRight size={13} />
              </span>
            </div>
          </div>

          {/* Connectivity */}
          <div
            onClick={() => onSelectAnalysis("connectivity")}
            className="p-5 rounded-2xl border border-border hover:border-emerald-500/40 bg-surface/85 hover:bg-surface-elevated/90 transition-all duration-150 cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Activity size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold font-heading text-foreground group-hover:text-emerald-400 transition-colors">
                  Connectivity & Coupling
                </h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  &ldquo;How connected is this entity?&rdquo; Evaluates Fan-in, Fan-out, and Martin Instability Index.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs font-mono">
              <span className="text-subtle">Fan-in & Fan-out</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>Measure Degree</span>
                <ArrowRight size={13} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Relationship Analysis Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-400" />
          <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-muted">
            Relationship Analysis
          </h2>
        </div>

        <div
          onClick={() => onSelectAnalysis("call-path")}
          className="p-5 rounded-2xl border border-border hover:border-purple-500/40 bg-surface/85 hover:bg-surface-elevated/90 transition-all duration-150 cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              <GitFork size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-heading text-foreground group-hover:text-purple-400 transition-colors">
                  Call Path Finder
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Two Symbols (Source → Target)
                </span>
              </div>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                &ldquo;Is there a call path between these two symbols?&rdquo; Traces depth-first function and method invocation chains.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-mono font-semibold text-purple-400 self-end sm:self-center shrink-0 group-hover:translate-x-0.5 transition-transform">
            <span>Find Path</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}

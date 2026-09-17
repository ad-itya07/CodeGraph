"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { X, ArrowRight, Activity, HelpCircle } from "lucide-react";
import type { RepositoryHealthResult } from "@/types";

interface HealthIndexPopoverProps {
  health?: RepositoryHealthResult;
  isLoading?: boolean;
}

interface ComponentConfig {
  key: keyof RepositoryHealthResult["metrics"];
  name: string;
  shortName: string;
  weight: number;
  weightLabel: string;
  docHref: string;
  getDescription: (metrics: RepositoryHealthResult["metrics"]) => string;
}

const HEALTH_COMPONENTS: ComponentConfig[] = [
  {
    key: "cycles",
    name: "Cycle Health",
    shortName: "Cycles",
    weight: 0.28,
    weightLabel: "28%",
    docHref: "/docs/health/cycle-health",
    getDescription: (m) =>
      m?.cycles
        ? m.cycles.cycleCount === 0
          ? "0 circular dependencies detected"
          : `${m.cycles.cycleCount} cycle${m.cycles.cycleCount > 1 ? "s" : ""} (${m.cycles.cyclicFileCount} files)`
        : "Circular dependency penalty",
  },
  {
    key: "coupling",
    name: "Coupling Health",
    shortName: "Coupling",
    weight: 0.23,
    weightLabel: "23%",
    docHref: "/docs/health/coupling-health",
    getDescription: (m) =>
      m?.coupling
        ? `Avg structural degree: ${m.coupling.averageStructuralDegree !== undefined ? Number(m.coupling.averageStructuralDegree).toFixed(1) : "—"}`
        : "Average degree (in + out)",
  },
  {
    key: "fanOut",
    name: "Fan-Out Health",
    shortName: "Fan-Out",
    weight: 0.18,
    weightLabel: "18%",
    docHref: "/docs/health/fan-out-health",
    getDescription: (m) =>
      m?.fanOut
        ? `RMS fan-out: ${m.fanOut.rootMeanSquareFanOut !== undefined ? Number(m.fanOut.rootMeanSquareFanOut).toFixed(1) : "—"} (peak: ${m.fanOut.maximumFanOut ?? 0})`
        : "RMS outgoing relationship concentration",
  },
  {
    key: "fanIn",
    name: "Fan-In Health",
    shortName: "Fan-In",
    weight: 0.14,
    weightLabel: "14%",
    docHref: "/docs/health/fan-in-health",
    getDescription: (m) =>
      m?.fanIn
        ? `RMS fan-in: ${m.fanIn.rootMeanSquareFanIn !== undefined ? Number(m.fanIn.rootMeanSquareFanIn).toFixed(1) : "—"} (peak: ${m.fanIn.highestFanIn ?? 0})`
        : "RMS incoming relationship concentration",
  },
  {
    key: "dependency",
    name: "Dependency Health",
    shortName: "Dependencies",
    weight: 0.10,
    weightLabel: "10%",
    docHref: "/docs/health/dependency-health",
    getDescription: (m) =>
      m?.dependency
        ? `Avg external deps/file: ${m.dependency.averageDependenciesPerFile !== undefined ? Number(m.dependency.averageDependenciesPerFile).toFixed(1) : "—"}`
        : "External npm dependency density",
  },
  {
    key: "modules",
    name: "Module Health",
    shortName: "Modules",
    weight: 0.07,
    weightLabel: "7%",
    docHref: "/docs/health/module-health",
    getDescription: (m) =>
      m?.modules
        ? `Unresolved ratio: ${((m.modules.moduleRatio ?? 0) * 100).toFixed(0)}%`
        : "Unresolved module isolation",
  },
];

function getScoreColor(score: number): { text: string; bg: string; border: string } {
  if (score >= 90) return { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
  if (score >= 75) return { text: "text-foreground", bg: "bg-surface-elevated", border: "border-border-highlight" };
  if (score >= 50) return { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" };
  return { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" };
}

export function HealthIndexPopover({ health, isLoading }: HealthIndexPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const toggle = () => setIsOpen((prev) => !prev);
  const close = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Handle click outside & escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, close]);

  const metrics = health?.metrics;

  return (
    <div className="relative inline-block">
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        onClick={toggle}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Health Index methodology and component scores"
        className="p-1 rounded-md text-muted hover:text-foreground hover:bg-surface-elevated/80 transition-colors focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
        title="View Health Index breakdown"
      >
        <HelpCircle size={15} />
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Health Index calculation and component scores"
          className="absolute right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 top-full mt-2 w-[calc(100vw-2.5rem)] sm:w-[390px] max-w-[400px] z-50 p-4 rounded-xl bg-surface border border-border-highlight shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-border/80">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                <Activity size={14} />
              </div>
              <div>
                <h4 className="text-xs font-semibold font-heading text-foreground">
                  Health Index Breakdown
                </h4>
                <p className="text-[10px] text-muted">
                  6 weighted structural signals (0–100 scale)
                </p>
              </div>
            </div>
            <button
              onClick={close}
              className="p-1 rounded-md text-muted hover:text-foreground hover:bg-surface-elevated transition-colors cursor-pointer shrink-0"
              aria-label="Close popover"
            >
              <X size={14} />
            </button>
          </div>

          {/* High-level Description */}
          <p className="text-[11px] text-muted leading-relaxed mt-2.5 mb-3">
            A continuous structural signal derived from the repository&apos;s static dependency graph, measuring interconnectedness, circularity, and architectural risk.
          </p>

          {/* Component Scores & Weights */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-subtle uppercase px-1">
              <span>Component</span>
              <div className="flex items-center gap-4">
                <span>Weight</span>
                <span className="w-12 text-right">Score</span>
              </div>
            </div>

            {HEALTH_COMPONENTS.map((comp) => {
              const metricObj = metrics ? metrics[comp.key] : undefined;
              const rawScore = metricObj?.score;
              const score = typeof rawScore === "number" && !isNaN(rawScore) ? Math.round(rawScore) : null;
              const color = score !== null ? getScoreColor(score) : { text: "text-muted", bg: "bg-surface-elevated", border: "border-border" };
              const description = metrics ? comp.getDescription(metrics) : "";

              return (
                <div
                  key={comp.key}
                  className="p-2 rounded-lg bg-surface-elevated/40 border border-border/60 hover:border-border transition-colors group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-foreground">
                          {comp.name}
                        </span>
                      </div>
                      {description && (
                        <p className="text-[10px] text-subtle font-mono truncate mt-0.5" title={description}>
                          {description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] font-mono text-muted bg-surface-elevated px-1.5 py-0.5 rounded border border-border">
                        {comp.weightLabel}
                      </span>
                      <div className="w-12 text-right">
                        {isLoading ? (
                          <div className="h-4 w-10 bg-surface-elevated animate-pulse rounded ml-auto" />
                        ) : score !== null ? (
                          <span className={`text-xs font-mono font-bold ${color.text}`}>
                            {score}
                            <span className="text-[9px] text-subtle font-normal">/100</span>
                          </span>
                        ) : (
                          <span className="text-xs font-mono text-subtle">—</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar visual */}
                  {score !== null && !isLoading && (
                    <div className="w-full h-1 bg-surface-elevated rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          score >= 90
                            ? "bg-emerald-400"
                            : score >= 75
                            ? "bg-accent"
                            : score >= 50
                            ? "bg-amber-400"
                            : "bg-red-400"
                        }`}
                        style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Formula Footnote & Docs Navigation */}
          <div className="mt-3 pt-2.5 border-t border-border/70 flex flex-col gap-2">
            <div className="p-1.5 rounded bg-surface-elevated/60 border border-border font-mono text-[9px] text-muted text-center leading-relaxed">
              H = 0.28·C + 0.23·Co + 0.18·Fo + 0.14·Fi + 0.10·D + 0.07·M
            </div>

            <Link
              href="/docs/health/overview"
              onClick={close}
              className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs text-accent font-medium hover:bg-surface-elevated transition-colors group"
            >
              <span>Learn how Health Index is calculated</span>
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

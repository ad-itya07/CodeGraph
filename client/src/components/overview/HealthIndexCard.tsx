"use client";

import Link from "next/link";
import { ShieldCheck, ArrowRight, AlertCircle } from "lucide-react";
import { HealthIndexPopover } from "./HealthIndexPopover";
import type { RepositoryHealthResult } from "@/types";

interface HealthIndexCardProps {
  health?: RepositoryHealthResult | null;
  isLoading?: boolean;
}

function getHealthBand(score: number): { label: string; textClass: string; bgClass: string; borderClass: string } {
  if (score >= 90) {
    return {
      label: "Very Healthy",
      textClass: "text-emerald-400",
      bgClass: "bg-emerald-500/10",
      borderClass: "border-emerald-500/30",
    };
  }
  if (score >= 75) {
    return {
      label: "Generally Healthy",
      textClass: "text-accent",
      bgClass: "bg-accent/10",
      borderClass: "border-accent/30",
    };
  }
  if (score >= 50) {
    return {
      label: "Moderate Complexity",
      textClass: "text-amber-400",
      bgClass: "bg-amber-500/10",
      borderClass: "border-amber-500/30",
    };
  }
  if (score >= 25) {
    return {
      label: "Elevated Risk",
      textClass: "text-orange-400",
      bgClass: "bg-orange-500/10",
      borderClass: "border-orange-500/30",
    };
  }
  return {
    label: "Severe Degradation",
    textClass: "text-red-400",
    bgClass: "bg-red-500/10",
    borderClass: "border-red-500/30",
  };
}

export function HealthIndexCard({ health, isLoading }: HealthIndexCardProps) {
  const rawIndex = health?.index;
  const score = typeof rawIndex === "number" && !isNaN(rawIndex) ? Math.round(rawIndex) : null;
  const band = score !== null ? getHealthBand(score) : null;

  return (
    <div className="flex flex-col justify-between p-5 rounded-xl bg-surface border border-border hover:border-border-highlight transition-all shadow-sm relative group">
      {/* Top Bar: Title, Icon & Popover Information Action */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold font-heading text-foreground">
              Health Index
            </h3>
            <p className="text-[11px] text-muted">
              Structural repository health
            </p>
          </div>
        </div>

        <HealthIndexPopover health={health ?? undefined} isLoading={isLoading} />
      </div>

      {/* Center: Numeric Score & Status */}
      <div className="my-2">
        {isLoading ? (
          <div className="space-y-2 py-1">
            <div className="h-9 w-28 bg-surface-elevated animate-pulse rounded-lg" />
            <div className="h-4 w-36 bg-surface-elevated animate-pulse rounded-md" />
          </div>
        ) : score !== null ? (
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-heading text-foreground tracking-tight">
                {score}
              </span>
              <span className="text-sm font-mono text-muted">
                / 100
              </span>
              {band && (
                <span
                  className={`ml-auto px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${band.textClass} ${band.bgClass} ${band.borderClass}`}
                >
                  {band.label}
                </span>
              )}
            </div>

            {/* Score Bar Meter */}
            <div className="w-full h-1.5 bg-surface-elevated rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
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
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-subtle font-mono py-2">
            <AlertCircle size={15} />
            <span>Health data unavailable</span>
          </div>
        )}
      </div>

      {/* Bottom Link: How is this calculated? */}
      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
        <Link
          href="/docs/health/overview"
          className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent-light font-medium transition-colors group/link"
        >
          <span>How is this calculated?</span>
          <ArrowRight size={13} className="group-hover/link:translate-x-0.5 transition-transform" />
        </Link>
        <span className="text-[10px] font-mono text-subtle uppercase">
          6 Signals
        </span>
      </div>
    </div>
  );
}

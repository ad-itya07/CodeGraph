"use client";

import Link from "next/link";
import { Info, ArrowRight } from "lucide-react";

export function AnalysisCoverageCard() {
  return (
    <div className="p-4 sm:p-5 rounded-xl bg-surface/60 border border-border hover:border-border-highlight transition-all">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-muted shrink-0 mt-0.5">
            <Info size={14} className="text-subtle" />
          </div>
          <div className="space-y-1.5 max-w-4xl">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold font-heading text-foreground">
                Analysis coverage
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-muted bg-surface-elevated border border-border/60">
                Static Analysis Model
              </span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              CodeGraph analyzes repositories using a static syntax and relationship model. JavaScript and TypeScript support a wide range of language constructs and coding patterns, and coverage is continuously expanding. Some less-common or complex patterns may not yet be fully represented, so analysis results are intended as useful structural insights, not a complete semantic representation of the codebase.
            </p>
          </div>
        </div>

        <Link
          href="/docs/architecture/system-overview"
          className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent-light font-medium transition-colors shrink-0 group self-start sm:self-center"
        >
          <span>Learn about analysis coverage</span>
          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

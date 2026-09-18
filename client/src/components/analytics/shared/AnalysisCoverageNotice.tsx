"use client";

import Link from "next/link";
import { Info, ArrowRight } from "lucide-react";

export function AnalysisCoverageNotice() {
  return (
    <div className="px-4 py-3 rounded-xl bg-surface/60 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div className="flex items-start sm:items-center gap-2.5">
        <Info size={14} className="text-subtle shrink-0 mt-0.5 sm:mt-0" />
        <p className="text-muted leading-relaxed">
          <strong className="text-foreground font-medium">Analysis coverage:</strong>{" "}
          Results are generated from CodeGraph&apos;s static syntax and relationship model. Coverage is continuously improving, and some language constructs or coding patterns may not yet be fully represented.
        </p>
      </div>

      <Link
        href="/docs/architecture/system-overview"
        className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-light font-medium shrink-0 transition-colors group self-start sm:self-center"
      >
        <span>Learn more</span>
        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}

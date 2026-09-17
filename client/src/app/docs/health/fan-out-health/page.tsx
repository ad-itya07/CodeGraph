import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "6.4 Fan-Out Health & RMS (18%) — CodeGraph Documentation",
  description: "Why Root Mean Square (RMS) outgoing connectivity is used to penalize architectural hotspot outliers.",
};

export default function FanOutHealthPage() {
  const nav = findDocItemByHref("/docs/health/fan-out-health");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="6.4"
        title="Fan-Out Health & RMS (18%)"
        summary="Measuring outgoing relationship concentration using Root Mean Square (RMS) to penalize outlier hotspot files and functions."
        sourceFile="server/src/analytics/health/fan-out/calculateFanOutHealth.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Why Simple Average is Insufficient
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          In a repository with 100 files, if 99 files have a fan-out of 1 and 1 file has an extreme fan-out of 100
          (a God object), the arithmetic mean is only &asymp; 2.0, concealing the architectural risk.
        </p>
        <p className="text-sm text-muted leading-relaxed">
          CodeGraph uses <strong className="text-foreground">Root Mean Square (RMS)</strong>:
        </p>
        <div className="p-3 rounded-lg bg-surface-elevated/60 border border-border font-mono text-xs text-accent inline-block my-1">
          RMS = &radic;( (&sum; x&sup2;) / N )
        </div>
        <p className="text-sm text-muted leading-relaxed">
          Squaring each term before averaging makes large outlier hotspots distinctly visible:
        </p>

        <DocsCodeBlock
          filename="server/src/analytics/health/fan-out/calculateFanOutHealth.ts"
          language="typescript"
          code={`let totalFanOut = 0;
let squaredFanOut = 0;
let maximumFanOut = 0;

for (const nodeId of nodeIds) {
    const fanOut = graph.outgoingEdges.get(nodeId)?.size ?? 0;
    totalFanOut += fanOut;
    squaredFanOut += fanOut * fanOut; // Squaring amplifies outliers
    maximumFanOut = Math.max(maximumFanOut, fanOut);
}

const averageFanOut = totalFanOut / nodeIds.length;
const rootMeanSquareFanOut = Math.sqrt(squaredFanOut / nodeIds.length);

const normalizedRisk = 0.5 * rootMeanSquareFanOut;
const score = 100 / (1 + normalizedRisk);`}
        />
      </section>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

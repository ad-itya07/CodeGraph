import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsTable } from "@/components/docs/DocsTable";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "6.1 Health Index & Scoring Formula — CodeGraph Documentation",
  description: "Three-phase pipeline (Measure -> Normalize -> Aggregate), weights, and architectural interpretation guide.",
};

export default function HealthOverviewPage() {
  const nav = findDocItemByHref("/docs/health/overview");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="6.1"
        title="Health Index & Scoring Formula"
        summary="A continuous, multi-metric structural scoring framework that distills 6 independent graph measurements into a unified 0–100 health index."
        sourceFile="server/src/analytics/health/CalculateHealthIndex.ts"
      />

      {/* Weighted Aggregation Formula */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          The Weighted Aggregation Formula
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          The Health Index ($H$) combines 6 normalized structural scores ($0 \dots 100$) using calibrated weights
          that sum to exactly $1.00$:
        </p>

        <div className="p-4 rounded-lg border border-border bg-surface-elevated/40 font-mono text-sm text-accent leading-relaxed text-center">
          H = (0.28 · C) + (0.23 · Co) + (0.18 · Fo) + (0.14 · Fi) + (0.10 · D) + (0.07 · M)
        </div>

        <DocsTable
          headers={["Metric", "Symbol", "What It Measures", "Weight", "Key Driver"]}
          rows={[
            ["Cycle Health", "C", "Circular file imports & mutual recursion", "28%", "Constrains build order & introduces undefined runtime imports."],
            ["Coupling Health", "Co", "Average total structural degree (in + out)", "23%", "Broadest measure of repository interconnectedness."],
            ["Fan-Out Health", "Fo", "RMS outgoing relationship concentration", "18%", "Penalizes hotspot files/symbols with excessive outgoing coupling."],
            ["Fan-In Health", "Fi", "RMS incoming relationship concentration", "14%", "Identifies fragile high-blast-radius hub symbols."],
            ["Dependency Health", "D", "External npm dependency density per file", "10%", "External package exposure and supply-chain blast radius."],
            ["Module Health", "M", "Proportion of unresolved module entities", "7%", "Measures external imports that CodeGraph failed to resolve to local files or declared dependencies (Node.js built-ins or unlisted imports)."],
          ]}
        />
      </section>

      {/* 3-Phase Pipeline */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          The 3-Phase Pipeline: Measure &rarr; Normalize &rarr; Aggregate
        </h2>
        <ol className="list-decimal list-inside text-sm text-muted space-y-2 pl-2">
          <li>
            <strong className="text-foreground">Phase 1: Raw Measurement</strong>: Extracts raw graph quantities (for example, <code className="text-accent bg-surface-elevated px-1.5 py-0.5 rounded border border-border">RMS fan-out = 1.45</code>, <code className="text-accent bg-surface-elevated px-1.5 py-0.5 rounded border border-border">cycle count = 0</code>).
          </li>
          <li>
            <strong className="text-foreground">Phase 2: Normalization</strong>: Converts unbounded raw values into a standardized 0–100 scale using continuous reciprocal decay:
            <div className="my-2 p-2.5 rounded bg-surface-elevated/60 border border-border font-mono text-xs text-accent inline-block">
              score = 100 / (1 + k · x)
            </div>
            {" "}or bounded linear ratios:
            <div className="my-2 ml-2 p-2.5 rounded bg-surface-elevated/60 border border-border font-mono text-xs text-accent inline-block">
              score = 100 · (1 - risk)
            </div>
          </li>
          <li>
            <strong className="text-foreground">Phase 3: Weighted Aggregation</strong>: Sums the weighted individual metric scores into the final unified repository index.
          </li>
        </ol>
      </section>

      {/* Score Interpretation */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Score Interpretation Bands
        </h2>
        <DocsTable
          headers={["Score Range", "Classification", "Architectural Assessment"]}
          rows={[
            ["90 – 100", "Very Healthy", "Clean modular structure with minimal architectural risk and zero/few cycles."],
            ["75 – 89", "Generally Healthy", "Standard structural complexity typical of actively growing repositories."],
            ["50 – 74", "Moderate Complexity", "Noticeable coupling or hotspot outliers that warrant refactoring."],
            ["25 – 49", "Elevated Risk", "High circularity, heavy God-node concentration, or extreme fan-out."],
            ["0 – 24", "Severe Degradation", "Pervasive structural tangling across both file and symbol layers."],
          ]}
        />
      </section>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

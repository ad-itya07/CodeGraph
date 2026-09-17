import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "6.3 Coupling Health (23%) — CodeGraph Documentation",
  description: "Measuring total structural degree across files and symbols with reciprocal decay normalization.",
};

export default function CouplingHealthPage() {
  const nav = findDocItemByHref("/docs/health/coupling-health");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="6.3"
        title="Coupling Health (23%)"
        summary="Evaluates total interconnectedness across all files and symbols, applying reciprocal normalization to penalize high average structural degree."
        sourceFile="server/src/analytics/health/coupling/calculateCouplingHealth.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Mathematical Formulation
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Coupling health sums both incoming and outgoing edges for every file and symbol node:
        </p>

        <DocsCodeBlock
          filename="Mathematical Definition"
          language="typescript"
          code={`totalDegree = sum(fanIn + fanOut) for all files & symbols;
averageStructuralDegree = totalDegree / (totalFiles + totalSymbols);

// Calibration constant k = 0.5
normalizedRisk = 0.5 * averageStructuralDegree;

score = 100 / (1 + normalizedRisk);`}
        />
      </section>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

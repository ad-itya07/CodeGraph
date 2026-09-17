import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsTable } from "@/components/docs/DocsTable";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "6.2 Cycle Health (28%) — CodeGraph Documentation",
  description: "Measuring file and symbol participation in circular dependencies with a 10% risk threshold.",
};

export default function CycleHealthPage() {
  const nav = findDocItemByHref("/docs/health/cycle-health");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="6.2"
        title="Cycle Health (28%)"
        summary="Evaluates the proportion of files and symbols entangled in circular dependencies, capping maximum risk at 10% cyclic node participation."
        sourceFile="server/src/analytics/health/cycles/calculateCycleHealth.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Mathematical Formulation
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Cycle health calculates the proportion of files and symbols that participate in any discovered SCC:
        </p>

        <DocsCodeBlock
          filename="Mathematical Definition"
          language="typescript"
          code={`fileCycleRatio   = cyclicFiles.size / totalFiles;
symbolCycleRatio = cyclicSymbols.size / totalSymbols;
cycleRatio       = (fileCycleRatio + symbolCycleRatio) / 2;

// 10% participation represents maximum structural risk:
normalizedRisk   = Math.min(cycleRatio / 0.10, 1.0);

score = 100 * (1 - normalizedRisk);`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Why Cycles Carry 28% Weight
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Circular dependencies are the single highest weighted metric (28%) because cycles break topological
          orderings, introduce undefined variable imports at module evaluation time, and force tightly coupled
          refactorings across files.
        </p>
      </section>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

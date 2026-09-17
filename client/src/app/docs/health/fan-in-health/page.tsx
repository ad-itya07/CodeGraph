import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "6.5 Fan-In Health & RMS (14%) — CodeGraph Documentation",
  description: "Evaluating incoming relationship concentration using Root Mean Square (RMS) to measure hub blast radius.",
};

export default function FanInHealthPage() {
  const nav = findDocItemByHref("/docs/health/fan-in-health");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="6.5"
        title="Fan-In Health & RMS (14%)"
        summary="Measuring incoming relationship concentration using Root Mean Square (RMS) to quantify the blast radius of central hub entities."
        sourceFile="server/src/analytics/health/fan-in/calculateFanInHealth.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Incoming Concentration & Hub Fragility
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          High fan-in indicates that many components depend on a single file or symbol. While foundational utilities
          naturally have high fan-in, extreme incoming concentration makes modifications high-risk.
        </p>
        <p className="text-sm text-muted leading-relaxed">
          Similar to Fan-Out, CodeGraph computes <strong>Root Mean Square Fan-In</strong>:
        </p>

        <DocsCodeBlock
          filename="server/src/analytics/health/fan-in/calculateFanInHealth.ts"
          language="typescript"
          code={`const averageFanIn = totalFanIn / nodeIds.length;
const rootMeanSquareFanIn = Math.sqrt(squaredFanIn / nodeIds.length);

const normalizedRisk = 0.5 * rootMeanSquareFanIn;
const score = 100 / (1 + normalizedRisk);`}
        />
      </section>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

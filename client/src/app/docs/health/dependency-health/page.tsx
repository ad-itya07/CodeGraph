import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "6.6 External Dependency Health (10%) — CodeGraph Documentation",
  description: "Measuring external npm package dependency density per file and external blast radius.",
};

export default function DependencyHealthPage() {
  const nav = findDocItemByHref("/docs/health/dependency-health");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="6.6"
        title="External Dependency Health (10%)"
        summary="Evaluating external package usage density across files to measure third-party exposure and dependency bloat."
        sourceFile="server/src/analytics/health/dependency/calculateDependencyHealth.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Average Dependencies Per File
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          The calculator scans all outgoing edges from file nodes that target <code>DependencyNode</code> entities
          (declared npm packages):
        </p>

        <DocsCodeBlock
          filename="server/src/analytics/health/dependency/calculateDependencyHealth.ts"
          language="typescript"
          code={`const averageDependenciesPerFile = dependencyRelationshipCount / fileIds.size;

// Calibration factor k = 0.5
const normalizedRisk = 0.5 * averageDependenciesPerFile;
const score = 100 / (1 + normalizedRisk);`}
        />
      </section>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

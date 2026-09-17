import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "5.3 Kahn's Topological Sort — CodeGraph Documentation",
  description: "In-degree resolution, graph inversion, and cycle detection in Kahn's algorithm.",
};

export default function KahnsToposortAlgoPage() {
  const nav = findDocItemByHref("/docs/algorithms/kahns-toposort");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="5.3"
        title="Kahn's Topological Sort"
        summary="An in-degree-based topological sorting algorithm combined with graph inversion to compute dependency-first initialization sequences."
        sourceFile="server/src/analytics/ordering/DependencyOrderingAnalyzer.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Conceptual Inversion: Dependency Graph vs Ordering Graph
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          In standard code graphs, an edge $A \to B$ represents <strong>&quot;A depends on B&quot;</strong>.
          However, for execution or initialization order, $B$ must be initialized <em>before</em> $A$.
        </p>
        <p className="text-sm text-muted leading-relaxed">
          CodeGraph models this inversion mathematically:
        </p>
        <ul className="list-disc list-inside text-sm text-muted space-y-1.5 pl-2">
          <li>A node&apos;s <strong>in-degree</strong> in the ordering graph equals the number of its direct dependencies that are currently unprocessed.</li>
          <li>Nodes with <code>in-degree === 0</code> have zero outstanding dependencies and are immediately safe to emit.</li>
          <li>When a node is emitted, the in-degree of all nodes that depend on it is decremented by 1.</li>
        </ul>
      </section>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

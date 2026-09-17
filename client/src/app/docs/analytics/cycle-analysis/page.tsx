import React from "react";
import Link from "next/link";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsTable } from "@/components/docs/DocsTable";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "4.5 Circular Dependency Analysis — CodeGraph Documentation",
  description: "Detecting circular dependencies and mutual recursion across 5 isolated graph projections using Tarjan's SCC algorithm.",
};

export default function CycleAnalysisPage() {
  const nav = findDocItemByHref("/docs/analytics/cycle-analysis");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="4.5"
        title="Circular Dependency Analysis"
        summary="Global detection of circular import dependencies, mutual recursion, and constructor cycles across 5 isolated projections using Tarjan's Strongly Connected Components algorithm."
        sourceFile="server/src/analytics/cycles/CycleAnalyzer.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          5 Isolated Cycle Projections
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Circular dependencies in a code graph represent distinct architectural violations depending on the
          entities involved. CodeGraph evaluates cycles across 5 isolated projections:
        </p>

        <DocsTable
          headers={["CycleType", "Node Kind", "Edge Kind", "Architectural Violation"]}
          rows={[
            ["\"file-import\"", "file", "\"imports\"", "Circular module imports leading to undefined export bindings at runtime."],
            ["\"symbol-call\"", "symbol", "\"calls\"", "Mutual recursion between functions leading to potential stack overflows."],
            ["\"symbol-inheritance\"", "symbol", "\"extends\"", "Circular class inheritance (illegal in JS/TS type systems)."],
            ["\"symbol-implementation\"", "symbol", "\"implements\"", "Circular interface implementation loops."],
            ["\"symbol-instantiation\"", "symbol", "\"instantiates\"", "Mutually instantiating factory constructors."],
          ]}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Self-Loop & Multi-Node Filtering
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Tarjan's algorithm outputs strongly connected components (SCCs). The analyzer filters out trivial
          1-node components unless they exhibit a self-loop (e.g. direct recursion):
        </p>

        <DocsCodeBlock
          filename="server/src/analytics/cycles/CycleAnalyzer.ts"
          language="typescript"
          code={`private isCyclic(component: string[], relationshipKind: RelationshipKind): boolean {
    if (component.length > 1) return true; // Multi-node SCC is always a cycle

    // Single-node: only cyclic if it contains a self-loop
    const nodeId = component[0];
    const edgeIds = this.graph.outgoingEdges.get(nodeId) ?? [];

    return [...edgeIds].some((edgeId) => {
        const edge = this.graph.edges.get(edgeId);
        return (
            edge !== undefined &&
            edge.relationshipKind === relationshipKind &&
            edge.targetId === nodeId // Self-loop
        );
    });
}`}
        />
      </section>

      <DocsCallout type="note" title="Algorithmic Detail">
        For a deep dive into the mathematical low-link formulation and DFS stack management of Tarjan's SCC,
        see <Link href="/docs/algorithms/tarjan-scc" className="text-accent underline">Section 5.2: Tarjan's Strongly Connected Components</Link>.
      </DocsCallout>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

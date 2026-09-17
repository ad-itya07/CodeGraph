import React from "react";
import Link from "next/link";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "4.6 Dependency Ordering (Toposort) — CodeGraph Documentation",
  description: "Determining safe symbol initialization sequences using DFS collection and Kahn's topological sort.",
};

export default function DependencyOrderingPage() {
  const nav = findDocItemByHref("/docs/analytics/ordering-analysis");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="4.6"
        title="Dependency Ordering (Toposort)"
        summary="Determining a valid topological initialization order for a symbol's dependency subgraph using Kahn's algorithm and graph inversion."
        sourceFile="server/src/analytics/ordering/DependencyOrderingAnalyzer.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          The Two-Phase Ordering Pipeline
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          <code>DependencyOrderingAnalyzer</code> answers: <em>"In what order must the symbols that X depends on be
          initialized so that every dependency is ready before its dependents?"</em>
        </p>

        <h3 className="text-base font-semibold text-foreground font-heading">
          Phase 1: Subgraph Collection via Iterative DFS
        </h3>
        <p className="text-sm text-muted leading-relaxed">
          Runs an iterative DFS from <code>sourceNodeId</code> following only symbol-to-symbol dependency edges
          (<code>calls</code>, <code>extends</code>, <code>implements</code>, <code>instantiates</code>) to gather
          all relevant nodes.
        </p>

        <h3 className="text-base font-semibold text-foreground font-heading">
          Phase 2: Kahn's Algorithm & Graph Inversion
        </h3>
        <p className="text-sm text-muted leading-relaxed">
          In CodeGraph, an edge <code>A -&gt; B</code> means <strong>A depends on B</strong>. For dependency-first ordering,
          <strong>B must come before A</strong>. In this inverted graph, an in-degree of 0 represents a node
          whose dependencies have all been processed:
        </p>

        <DocsCodeBlock
          filename="server/src/analytics/ordering/DependencyOrderingAnalyzer.ts"
          language="typescript"
          code={`// Indegree represents: "How many unprocessed dependencies does this node have?"
for (const nodeId of relevantNodeIds) {
    for (const edgeId of this.graph.outgoingEdges.get(nodeId) || []) {
        const edge = this.graph.edges.get(edgeId);
        if (edge && dependencyRelationshipKinds.has(edge.relationshipKind) && relevantNodeIds.has(edge.targetId)) {
            indegree.set(nodeId, indegree.get(nodeId)! + 1);
        }
    }
}

// Kahn's queue initialized with nodes having 0 dependencies
const queue = Array.from(relevantNodeIds).filter(id => indegree.get(id) === 0);
while (queue.length > 0) {
    const nodeId = queue.shift()!;
    orderedNodeIds.push(nodeId);

    // Decrement indegree for all nodes that depend on this node
    for (const edgeId of this.graph.incomingEdges.get(nodeId) || []) {
        const edge = this.graph.edges.get(edgeId);
        if (edge && relevantNodeIds.has(edge.sourceId)) {
            const newDeg = indegree.get(edge.sourceId)! - 1;
            indegree.set(edge.sourceId, newDeg);
            if (newDeg === 0) queue.push(edge.sourceId);
        }
    }
}`}
        />
      </section>

      <DocsCallout type="warning" title="Unorderable Subgraphs (Cycles)">
        If the subgraph contains a circular dependency, <code>isOrderable</code> evaluates to <code>false</code> because
        the cyclic nodes never reach in-degree 0.
      </DocsCallout>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

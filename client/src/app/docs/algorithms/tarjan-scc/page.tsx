import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "5.2 Tarjan's Strongly Connected Components — CodeGraph Documentation",
  description: "Single-pass O(V+E) discovery indices, lowLink tracking, and projection filtering in Tarjan's SCC.",
};

export default function TarjanSccAlgoPage() {
  const nav = findDocItemByHref("/docs/algorithms/tarjan-scc");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="5.2"
        title="Tarjan's Strongly Connected Components"
        summary="A linear-time O(V+E) single-pass depth-first search algorithm that identifies all maximal strongly connected subgraphs and circular dependencies."
        sourceFile="server/src/analytics/cycles/CycleAnalyzer.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Low-Link & Discovery Index Formulation
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Tarjan&apos;s algorithm tracks two primary integer metrics per node:
        </p>
        <ul className="list-disc list-inside text-sm text-muted space-y-1.5 pl-2">
          <li><strong>Discovery Index (<code>indices.get(u)</code>)</strong>: A monotonically increasing integer assigned when node $u$ is first visited.</li>
          <li><strong>Low-Link Value (<code>lowLinks.get(u)</code>)</strong>: The smallest discovery index reachable from node $u$&apos;s DFS subtree, including back edges to nodes currently on the active stack.</li>
        </ul>
        <p className="text-sm text-muted leading-relaxed">
          When <code>lowLinks.get(u) === indices.get(u)</code>, node $u$ is mathematically proven to be the root of an SCC. All nodes above $u$ on the stack form the complete strongly connected component.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Back-Edge Discovery Index Invariant
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          When traversing an edge to an already-visited target that is on the stack (a cycle back-edge),
          Tarjan&apos;s algorithm updates low-link using the target&apos;s <em>discovery index</em>, not its low-link value:
        </p>

        <DocsCodeBlock
          filename="server/src/analytics/cycles/CycleAnalyzer.ts"
          language="typescript"
          code={`if (!indices.has(targetNodeId)) {
    // Unvisited tree edge: recurse
    strongConnect(targetNodeId);
    lowLinks.set(nodeId, Math.min(lowLinks.get(nodeId)!, lowLinks.get(targetNodeId)!));
} else if (onStack.has(targetNodeId)) {
    // Back-edge cycle found: use discovery index of target
    lowLinks.set(nodeId, Math.min(lowLinks.get(nodeId)!, indices.get(targetNodeId)!));
}`}
        />
      </section>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

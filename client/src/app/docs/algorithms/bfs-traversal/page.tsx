import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "5.1 Iterative Breadth-First Search — CodeGraph Documentation",
  description: "Queue-pointer array implementation ensuring O(1) dequeue and shortest-hop guarantees.",
};

export default function BfsTraversalAlgoPage() {
  const nav = findDocItemByHref("/docs/algorithms/bfs-traversal");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="5.1"
        title="Iterative Breadth-First Search"
        summary="Optimized BFS algorithm powering CodeGraph's multi-hop reachability analysis with O(1) queue indexing and shortest-path guarantees."
        sourceFile="server/src/analytics/traversal/GraphTraversal.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Algorithmic Formulation
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Breadth-First Search (BFS) explores vertices layer by layer. For code graph analysis, BFS is chosen over
          DFS for impact and dependency analysis because:
        </p>
        <ol className="list-decimal list-inside text-sm text-muted space-y-1.5 pl-2">
          <li><strong>Shortest-Distance Guarantee</strong>: The first time a node is reached during BFS, it is guaranteed to be via the minimum number of hops from the source.</li>
          <li><strong>Accurate Depth Tracking</strong>: The hop depth <code>current.depth + 1</code> accurately reflects architectural distance.</li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Complexity Analysis
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          <strong className="text-foreground">Time Complexity</strong>: <code>O(V + E)</code> in the traversed subgraph, where $V$ is the number of visited nodes and $E$ is the number of incident edges.<br />
          <strong className="text-foreground">Space Complexity</strong>: <code>O(V)</code> to maintain the <code>visited</code> set, queue array, and <code>depthByNode</code> map.
        </p>
      </section>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

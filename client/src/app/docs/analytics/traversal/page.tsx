import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsTable } from "@/components/docs/DocsTable";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "4.2 Graph Traversal Primitive — CodeGraph Documentation",
  description: "Iterative BFS traversal primitive with queue-pointer indexing and bidirectional edge switching.",
};

export default function AnalyticsTraversalPage() {
  const nav = findDocItemByHref("/docs/analytics/traversal");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="4.2"
        title="Graph Traversal Primitive"
        summary="The core Breadth-First Search (BFS) engine powering multi-hop reachability, shortest distance calculations, and bidirectional edge exploration."
        sourceFile="server/src/analytics/traversal/GraphTraversal.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Iterative BFS with Queue Pointer Optimization
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Standard JavaScript <code>Array.shift()</code> runs in $O(N)$ time because it shifts all elements
          in memory. <code>GraphTraversal</code> maintains an integer pointer (<code>queueIndex++</code>) to achieve
          true $O(1)$ dequeue performance across thousands of graph nodes:
        </p>

        <DocsCodeBlock
          filename="server/src/analytics/traversal/GraphTraversal.ts"
          language="typescript"
          code={`export class GraphTraversal {
    traverse(startNodeId: string, options: TraversalOptions): TraversalResult {
        const visited = new Set<string>([startNodeId]);
        const queue: TraversalQueueItem[] = [{ nodeId: startNodeId, depth: 0 }];
        const nodes: string[] = [];
        const depthByNode = new Map<string, number>();

        let queueIndex = 0;
        while (queueIndex < queue.length) {
            const current = queue[queueIndex++];

            // Depth cutoff guard
            if (options.maxDepth !== undefined && current.depth >= options.maxDepth) continue;

            const edgeIds = options.direction === "outgoing"
                ? this.graph.outgoingEdges.get(current.nodeId)
                : this.graph.incomingEdges.get(current.nodeId);

            for (const edgeId of edgeIds || []) {
                const edge = this.graph.edges.get(edgeId);
                if (!edge) continue;

                // Relationship filter
                if (options.relationshipKinds && !options.relationshipKinds.includes(edge.relationshipKind)) {
                    continue;
                }

                const nextNodeId = options.direction === "outgoing" ? edge.targetId : edge.sourceId;

                if (!visited.has(nextNodeId)) {
                    visited.add(nextNodeId);
                    nodes.push(nextNodeId);
                    depthByNode.set(nextNodeId, current.depth + 1);
                    queue.push({ nodeId: nextNodeId, depth: current.depth + 1 });
                }
            }
        }

        return { startNodeId, nodes, depthByNode };
    }
}`}
        />
      </section>

      <DocsCallout type="note" title="Start Node Exclusion">
        <code>nodes: string[]</code> explicitly excludes <code>startNodeId</code> itself, ensuring downstream
        analyzers only report affected or depended-upon nodes rather than the query root.
      </DocsCallout>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

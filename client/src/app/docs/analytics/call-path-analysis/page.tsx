import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "4.8 Call Path Reachability — CodeGraph Documentation",
  description: "Point-to-point call chain discovery using iterative DFS, early exit, and parent backtracking.",
};

export default function CallPathAnalysisPage() {
  const nav = findDocItemByHref("/docs/analytics/call-path-analysis");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="4.8"
        title="Call Path Reachability"
        summary="Finding whether a directed call chain exists between two specific symbols using iterative DFS with parent backtracking."
        sourceFile="server/src/analytics/paths/CallPathAnalyzer.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          DFS Path-Finding with Early Exit
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          <code>CallPathAnalyzer</code> finds a call chain connecting <code>sourceNodeId</code> to <code>targetNodeId</code>
          following strictly <code>"calls"</code> edges between symbol nodes:
        </p>

        <DocsCodeBlock
          filename="server/src/analytics/paths/CallPathAnalyzer.ts"
          language="typescript"
          code={`export class CallPathAnalyzer {
    analyze(sourceNodeId: string, targetNodeId: string): CallPathResult {
        if (sourceNodeId === targetNodeId) {
            return { sourceNodeId, targetNodeId, path: [sourceNodeId] };
        }

        const visited = new Set<string>([sourceNodeId]);
        const stack = [sourceNodeId];
        const parent = new Map<string, string>();

        while (stack.length > 0) {
            const current = stack.pop()!;

            for (const edgeId of this.graph.outgoingEdges.get(current) || []) {
                const edge = this.graph.edges.get(edgeId);
                if (!edge || edge.relationshipKind !== "calls") continue;

                const targetNode = this.graph.nodes.get(edge.targetId);
                if (!targetNode || targetNode.kind !== "symbol") continue;

                if (!visited.has(edge.targetId)) {
                    visited.add(edge.targetId);
                    parent.set(edge.targetId, current);

                    // Early exit when target is found!
                    if (edge.targetId === targetNodeId) {
                        return {
                            sourceNodeId,
                            targetNodeId,
                            path: this.buildPath(sourceNodeId, targetNodeId, parent),
                        };
                    }

                    stack.push(edge.targetId);
                }
            }
        }

        return { sourceNodeId, targetNodeId, path: null };
    }
}`}
        />
      </section>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

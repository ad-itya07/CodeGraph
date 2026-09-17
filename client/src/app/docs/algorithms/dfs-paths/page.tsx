import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "5.4 Iterative Depth-First Search — CodeGraph Documentation",
  description: "Explicit stack management and parent backtracking for point-to-point reachability paths.",
};

export default function DfsPathsAlgoPage() {
  const nav = findDocItemByHref("/docs/algorithms/dfs-paths");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="5.4"
        title="Iterative Depth-First Search"
        summary="Stack-based iterative DFS with early target termination and parent map backtracking for call chain discovery."
        sourceFile="server/src/analytics/paths/CallPathAnalyzer.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Memory Efficiency: Parent Map vs Path Array Passing
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Passing active path arrays down recursion branches incurs an <code>O(depth &times; branching)</code> memory
          overhead due to repetitive array allocations.
        </p>
        <p className="text-sm text-muted leading-relaxed">
          CodeGraph records parent pointers in a flat <code>parent: Map&lt;string, string&gt;</code> that costs only
          <code>O(V)</code> space. When the target node is reached, the path is reconstructed backwards in
          <code>O(path length)</code> time:
        </p>

        <DocsCodeBlock
          filename="Path Backtracking Implementation"
          language="typescript"
          code={`private buildPath(sourceNodeId: string, targetNodeId: string, parent: Map<string, string>): string[] {
    const path: string[] = [];
    let current: string | undefined = targetNodeId;

    while (current !== undefined) {
        path.push(current);
        if (current === sourceNodeId) break;
        current = parent.get(current);
    }

    path.reverse(); // [source -> ... -> target]
    return path;
}`}
        />
      </section>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "4.4 Dependency Analysis (Downstream) — CodeGraph Documentation",
  description: "Answering 'What does X need to run?' by traversing outgoing structural edges forward.",
};

export default function DependencyAnalysisPage() {
  const nav = findDocItemByHref("/docs/analytics/dependency-analysis");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="4.4"
        title="Dependency Analysis (Downstream)"
        summary="Discovers the complete transitive downstream dependency closure of a file or symbol by walking outgoing edges forward."
        sourceFile="server/src/analytics/dependency/DependencyAnalyzer.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Downstream Reachability Semantics
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          The <code>DependencyAnalyzer</code> is the forward mirror of the <code>ImpactAnalyzer</code>. It answers:
          <em>"What does this function or file depend on, directly or transitively, to compile and run?"</em>
        </p>

        <DocsCodeBlock
          filename="server/src/analytics/dependency/DependencyAnalyzer.ts"
          language="typescript"
          code={`export class DependencyAnalyzer {
    constructor(private readonly traversal: GraphTraversal) {}

    analyze(sourceNodeId: string, options: DependencyAnalysisOptions = {}): DependencyAnalysisResult {
        const traversalResult = this.traversal.traverse(sourceNodeId, {
            direction: "outgoing",
            relationshipKinds: [
                "calls",
                "imports",
                "extends",
                "implements",
                "instantiates",
            ],
            maxDepth: options.maxDepth,
        });

        return {
            sourceNodeId,
            dependencyNodeIds: traversalResult.nodes,
            depthByNode: traversalResult.depthByNode,
        };
    }
}`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Primary Use Cases
        </h2>
        <ul className="list-disc list-inside text-sm text-muted space-y-1.5 pl-2">
          <li><strong>Test Mocking Isolation</strong>: Identify all depth 1 dependencies that must be mocked to test a symbol in isolation.</li>
          <li><strong>Bundle Splitting</strong>: Evaluate the full closure size pulled into client bundles when importing a given component.</li>
        </ul>
      </section>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

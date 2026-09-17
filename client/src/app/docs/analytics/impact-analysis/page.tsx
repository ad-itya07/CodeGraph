import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "4.3 Impact Analysis (Upstream) — CodeGraph Documentation",
  description: "Answering 'Who depends on X?' by traversing structural incoming edges backward.",
};

export default function ImpactAnalysisPage() {
  const nav = findDocItemByHref("/docs/analytics/impact-analysis");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="4.3"
        title="Impact Analysis (Upstream)"
        summary="Calculates the complete blast radius of modifying a file or symbol by walking incoming structural relationships backward."
        sourceFile="server/src/analytics/impact/ImpactAnalyzer.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Upstream Reachability Semantics
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          In CodeGraph, an edge <code>A --[calls]--&gt; B</code> means <strong>A calls B</strong>. Therefore, if an
          engineer changes <strong>B</strong>, the entity directly affected is <strong>A</strong>.
        </p>
        <p className="text-sm text-muted leading-relaxed">
          The <code>ImpactAnalyzer</code> traverses the graph with <code>direction: "incoming"</code> across the
          5 structural relationship kinds:
        </p>

        <DocsCodeBlock
          filename="server/src/analytics/impact/ImpactAnalyzer.ts"
          language="typescript"
          code={`export class ImpactAnalyzer {
    constructor(private readonly traversal: GraphTraversal) {}

    analyze(sourceNodeId: string, options: ImpactAnalysisOptions = {}): ImpactAnalysisResult {
        const traversalResult = this.traversal.traverse(sourceNodeId, {
            direction: "incoming",
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
            impactedNodeIds: traversalResult.nodes,
            depthByNode: traversalResult.depthByNode,
        };
    }
}`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Interpreting Hop Depth
        </h2>
        <ul className="list-disc list-inside text-sm text-muted space-y-1.5 pl-2">
          <li><strong>Depth 1</strong>: Direct consumers (immediate callers, direct file importers, direct subclasses).</li>
          <li><strong>Depth 2</strong>: Transitive consumers (callers of callers).</li>
          <li><strong>Depth N</strong>: Distant upstream modules affected by transitive dependency chains.</li>
        </ul>
      </section>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

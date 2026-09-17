import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsTable } from "@/components/docs/DocsTable";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "4.1 Analytics Engine Architecture — CodeGraph Documentation",
  description: "Unified AnalysisEngine facade, analyzer composition, and read-only graph traversal contracts.",
};

export default function AnalyticsOverviewPage() {
  const nav = findDocItemByHref("/docs/analytics/overview");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="4.1"
        title="Analytics Engine Architecture"
        summary="The single entry point orchestrating graph traversal, upstream impact analysis, downstream dependencies, cycles, topological ordering, and connectivity."
        sourceFile="server/src/analytics/AnalysisEngine.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Analyzer Dependency Composition
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          <code>AnalysisEngine</code> is instantiated with an immutable <code>Graph</code> instance and wires
          specialized analyzer classes:
        </p>

        <DocsCodeBlock
          filename="server/src/analytics/AnalysisEngine.ts"
          language="typescript"
          code={`export class AnalysisEngine {
    private readonly impactAnalyzer: ImpactAnalyzer;
    private readonly dependencyAnalyzer: DependencyAnalyzer;
    private readonly cycleAnalyzer: CycleAnalyzer;
    private readonly dependencyOrderingAnalyzer: DependencyOrderingAnalyzer;
    private readonly fanInOutAnalyzer: FanInOutAnalyzer;
    private readonly callPathAnalyzer: CallPathAnalyzer;
    private readonly graphTraversal: GraphTraversal;

    constructor(private readonly graph: Graph) {
        this.graphTraversal             = new GraphTraversal(graph);
        this.impactAnalyzer             = new ImpactAnalyzer(this.graphTraversal);
        this.dependencyAnalyzer         = new DependencyAnalyzer(this.graphTraversal);
        this.cycleAnalyzer              = new CycleAnalyzer(graph);
        this.dependencyOrderingAnalyzer = new DependencyOrderingAnalyzer(graph);
        this.fanInOutAnalyzer           = new FanInOutAnalyzer(graph);
        this.callPathAnalyzer           = new CallPathAnalyzer(graph);
    }
}`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Architectural Contracts
        </h2>
        <DocsTable
          headers={["Contract", "Guarantee", "Rationale"]}
          rows={[
            ["Read-Only Execution", "No analyzer ever mutates the Graph maps or node objects.", "Guarantees thread-safe parallel analysis across multiple queries."],
            ["Stateless per Call", "Visited sets, queues, and recursion stacks are local to method execution.", "Zero state leakage between subsequent requests."],
            ["Pure Functional Math", "All metrics compute deterministic outputs from static graph facts.", "Complete repeatability across developer machines and CI/CD."],
          ]}
        />
      </section>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

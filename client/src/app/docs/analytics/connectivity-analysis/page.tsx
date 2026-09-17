import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsTable } from "@/components/docs/DocsTable";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "4.7 Connectivity & Degree Analysis — CodeGraph Documentation",
  description: "Measuring O(1) fan-in, fan-out, structural degree, and architectural instability metrics.",
};

export default function ConnectivityAnalysisPage() {
  const nav = findDocItemByHref("/docs/analytics/connectivity-analysis");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="4.7"
        title="Connectivity & Degree Analysis"
        summary="O(1) measurement of incoming (fan-in) and outgoing (fan-out) node degree, God-node detection, and architectural instability."
        sourceFile="server/src/analytics/connectivity/FanInOutAnalyzer.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          $O(1)$ Edge Counting Algorithm
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Because <code>GraphBuilder</code> maintains pre-indexed edge sets, calculating a node's degree requires
          zero iteration:
        </p>

        <DocsCodeBlock
          filename="server/src/analytics/connectivity/FanInOutAnalyzer.ts"
          language="typescript"
          code={`export class FanInOutAnalyzer {
    constructor(private readonly graph: Graph) {}

    analyze(nodeId: string): FanInOutResult {
        const incomingEdges = this.graph.incomingEdges.get(nodeId) ?? new Set();
        const outgoingEdges = this.graph.outgoingEdges.get(nodeId) ?? new Set();

        return {
            nodeId,
            fanIn: incomingEdges.size,   // O(1)
            fanOut: outgoingEdges.size, // O(1)
        };
    }
}`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Architectural Diagnostic Matrix
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Comparing fan-in and fan-out identifies structural archetypes:
        </p>

        <DocsTable
          headers={["Pattern", "Fan-In", "Fan-Out", "Architectural Assessment"]}
          rows={[
            ["Utility / Leaf", "High", "Low", "Ideal foundational helper. Widely reused, low blast risk."],
            ["Entry Point", "Low / 0", "High", "Normal for top-level bootstrap scripts or main routers."],
            ["God Node / Hub", "High", "High", "Architectural bottleneck. High coupling, dangerous to modify."],
            ["Isolated Node", "0", "0", "Dead code candidate. Completely disconnected from the graph."],
          ]}
        />
      </section>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

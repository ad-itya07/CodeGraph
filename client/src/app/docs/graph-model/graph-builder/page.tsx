import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsTable } from "@/components/docs/DocsTable";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "3.2 Graph Construction & Validation — CodeGraph Documentation",
  description: "GraphBuilder 5-phase assembly order, silent deduplication, and referential integrity validation.",
};

export default function GraphBuilderPage() {
  const nav = findDocItemByHref("/docs/graph-model/graph-builder");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="3.2"
        title="Graph Construction & Validation"
        summary="How GraphBuilder transforms raw parser models into an indexed, referentially valid graph with two validation phases."
        sourceFile="server/src/graph/GraphBuilder.ts"
      />

      {/* 5-Phase Assembly */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          5 Sequential Build Phases
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          <code>GraphBuilder.build(parsedRepository)</code> is a pure construction engine that executes in 5 strict phases:
        </p>

        <DocsCodeBlock
          filename="server/src/graph/GraphBuilder.ts"
          language="typescript"
          code={`build(repository: ParsedRepository): Graph {
    const graph: Graph = {
        nodes: new Map(),
        edges: new Map(),
        nodesByKind: new Map(),
        outgoingEdges: new Map(),
        incomingEdges: new Map(),
    };

    // Phase 1: Construct Nodes
    this.addFileNodes(graph, repository);
    this.addSymbolNodes(graph, repository);
    this.addDependencyNodes(graph, repository);
    this.addModuleNodes(graph, repository);

    // Phase 2: Construct & Index Edges
    this.addRelationshipEdges(graph, repository.relationships);

    // Phase 3 & 4: Dual Validation
    this.validateGraph(graph);    // Referential integrity (no dangling edges)
    this.validateIndexes(graph);  // Index consistency verification

    return graph;
}`}
        />
      </section>

      {/* Validation Phases */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Dual Validation Invariants
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-border bg-surface-elevated/30 space-y-2">
            <h3 className="text-sm font-semibold text-foreground font-heading">
              1. Referential Integrity (`validateGraph`)
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Verifies that every edge references source and target nodes that actually exist in the <code>nodes</code> map.
              Throws <code>GraphValidationError</code> if any dangling edge is found.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border bg-surface-elevated/30 space-y-2">
            <h3 className="text-sm font-semibold text-foreground font-heading">
              2. Index Consistency (`validateIndexes`)
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Verifies that every node is indexed in <code>nodesByKind</code> and every edge is present in both
              <code>outgoingEdges</code> and <code>incomingEdges</code>.
            </p>
          </div>
        </div>
      </section>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

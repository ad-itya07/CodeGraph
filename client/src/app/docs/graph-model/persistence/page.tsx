import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "3.4 Persistence & Serialization — CodeGraph Documentation",
  description: "Serialization format to JSON and deserialization restoring all 5 indexing maps and sets.",
};

export default function GraphPersistencePage() {
  const nav = findDocItemByHref("/docs/graph-model/persistence");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="3.4"
        title="Persistence & Serialization"
        summary="Serializing in-memory graph instances to compact JSON node/edge arrays and deserializing them back into indexed 5-map graphs."
        sourceFile="server/src/graph/serialization/graphSerializer.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          The `PersistedGraph` Format
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          The 5 in-memory maps contain redundant adjacency indexes for $O(1)$ query speed. When persisting to
          MongoDB or transmitting over HTTP, CodeGraph flattens the graph into pure node and edge arrays:
        </p>

        <DocsCodeBlock
          filename="server/src/graph/serialization/graphSerializer.ts"
          language="typescript"
          code={`export interface PersistedGraph {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

export function serializeGraph(graph: Graph): PersistedGraph {
    return {
        nodes: Array.from(graph.nodes.values()),
        edges: Array.from(graph.edges.values()),
    };
}`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Full Index Reconstruction on Deserialization
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          <code>deserializeGraph(data)</code> reconstructs the entire 5-map structure atomically:
        </p>

        <DocsCodeBlock
          filename="server/src/graph/serialization/graphSerializer.ts"
          language="typescript"
          code={`export function deserializeGraph(data: PersistedGraph): Graph {
    const nodes = new Map(data.nodes.map(node => [node.id, node]));
    const edges = new Map(data.edges.map(edge => [edge.id, edge]));

    const nodesByKind = new Map<GraphNodeKind, Set<string>>();
    for (const node of data.nodes) {
        if (!nodesByKind.has(node.kind)) nodesByKind.set(node.kind, new Set());
        nodesByKind.get(node.kind)!.add(node.id);
    }

    const outgoingEdges = new Map<string, Set<string>>();
    const incomingEdges = new Map<string, Set<string>>();

    for (const edge of data.edges) {
        if (!outgoingEdges.has(edge.sourceId)) outgoingEdges.set(edge.sourceId, new Set());
        outgoingEdges.get(edge.sourceId)!.add(edge.id);

        if (!incomingEdges.has(edge.targetId)) incomingEdges.set(edge.targetId, new Set());
        incomingEdges.get(edge.targetId)!.add(edge.id);
    }

    return { nodes, edges, nodesByKind, outgoingEdges, incomingEdges };
}`}
        />
      </section>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

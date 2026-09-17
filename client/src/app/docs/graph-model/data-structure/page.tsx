import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsTable } from "@/components/docs/DocsTable";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "3.1 Graph Data Structure — CodeGraph Documentation",
  description: "The 5 synchronized in-memory maps, node kinds, edge models, and prefixed ID conventions of the canonical Graph.",
};

export default function GraphDataStructurePage() {
  const nav = findDocItemByHref("/docs/graph-model/data-structure");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="3.1"
        title="Graph Data Structure"
        summary="The canonical 5-map in-memory data structure that represents files, declarations, npm packages, and system modules as an indexed directed graph."
        sourceFile="server/src/graph/models/Graph.ts"
      />

      {/* The 5 Maps */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          The 5 Synchronized In-Memory Maps
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          The canonical <code>Graph</code> interface is designed for instantaneous $O(1)$ lookups and high-performance
          traversals:
        </p>

        <DocsCodeBlock
          filename="server/src/graph/models/Graph.ts"
          language="typescript"
          code={`export interface Graph {
    nodes:         Map<string, GraphNode>;           // nodeId -> Node object (O(1) lookup)
    edges:         Map<string, GraphEdge>;           // edgeId -> Edge object (O(1) lookup)
    nodesByKind:   Map<GraphNodeKind, Set<string>>;  // kind   -> Set of nodeIds (O(1) kind iteration)
    outgoingEdges: Map<string, Set<string>>;         // nodeId -> Set of outgoing edgeIds
    incomingEdges: Map<string, Set<string>>;         // nodeId -> Set of incoming edgeIds
}`}
        />

        <DocsTable
          headers={["Map Field", "Type", "Operational Purpose"]}
          rows={[
            ["nodes", "Map<string, GraphNode>", "Primary node registry storing full payloads (name, location, kind)."],
            ["edges", "Map<string, GraphEdge>", "Primary edge registry storing directional relationship types."],
            ["nodesByKind", "Map<GraphNodeKind, Set<string>>", "Pre-indexes node IDs by kind ('file', 'symbol', 'dependency', 'module')."],
            ["outgoingEdges", "Map<string, Set<string>>", "Forward adjacency index for forward reachability, DFS, and Kahn's sort."],
            ["incomingEdges", "Map<string, Set<string>>", "Backward adjacency index for impact analysis and Tarjan's SCC."],
          ]}
        />
      </section>

      {/* Node Kinds */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Node Kinds & Prefixed ID Convention
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          All node IDs are strictly prefixed with their discriminant kind via <code>getGraphNodeId(kind, rawId)</code>:
        </p>

        <DocsCodeBlock
          filename="Prefixed Node ID Examples"
          language="typescript"
          code={`file:       file:/abs/path/to/src/auth/service.ts
symbol:     symbol:/abs/path/to/src/auth/service.ts:14:4:validateToken
dependency: dependency:express
module:     module:fs`}
        />

        <p className="text-sm text-muted leading-relaxed">
          This prefix prevents collisions between file paths, symbols, and npm dependencies sharing similar names.
        </p>
      </section>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsTable } from "@/components/docs/DocsTable";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "3.3 Graph Query Layer — CodeGraph Documentation",
  description: "Read-only semantic query facade providing filtered lookups over the in-memory Graph.",
};

export default function GraphQueryPage() {
  const nav = findDocItemByHref("/docs/graph-model/graph-query");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="3.3"
        title="Graph Query Layer"
        summary="A semantic, read-only API layer providing typed single-hop lookups for callers, callees, importers, subclasses, and dependency sets."
        sourceFile="server/src/graph/GraphQuery.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Semantic Query Methods
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          <code>GraphQuery</code> wraps raw map accesses with type-safe, semantic lookup methods that return
          hydrated <code>GraphNode[]</code> objects:
        </p>

        <DocsTable
          headers={["Method", "Edge Direction", "Filter Kind", "Target Node Kind", "Description"]}
          rows={[
            ["getCallers(nodeId)", "Incoming", "\"calls\"", "symbol", "Returns all functions/methods calling this symbol."],
            ["getCallees(nodeId)", "Outgoing", "\"calls\"", "symbol", "Returns all functions/methods called by this symbol."],
            ["getImporters(nodeId)", "Incoming", "\"imports\"", "file", "Returns all files that import this file or symbol."],
            ["getImportedFiles(nodeId)", "Outgoing", "\"imports\"", "file", "Returns internal source files imported by this file."],
            ["getPackageDependencies(nodeId)", "Outgoing", "\"imports\"", "dependency", "Returns external npm packages imported by this file."],
            ["getBaseClasses(nodeId)", "Outgoing", "\"extends\"", "symbol", "Returns the superclass extended by this class."],
            ["getSubclasses(nodeId)", "Incoming", "\"extends\"", "symbol", "Returns classes that extend this base class."],
            ["getImplementedInterfaces(nodeId)", "Outgoing", "\"implements\"", "symbol", "Returns interfaces implemented by this class."],
            ["getImplementations(nodeId)", "Incoming", "\"implements\"", "symbol", "Returns classes implementing this interface."],
            ["getDependentNodes(nodeId)", "Outgoing", "All structural", "Any", "Returns all direct dependencies across all 5 structural types."],
            ["getDependents(nodeId)", "Incoming", "All structural", "Any", "Returns all nodes directly dependent on this node."],
          ]}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Hydration & Defensive Node-Kind Checks
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Every derived query explicitly validates <code>node.kind</code> before returning. For example,
          <code>getCallers()</code> guarantees it will only return <code>SymbolNode</code> objects:
        </p>

        <DocsCodeBlock
          filename="server/src/graph/GraphQuery.ts"
          language="typescript"
          code={`getCallers(nodeId: string): GraphNode[] {
    const callers: GraphNode[] = [];

    for (const edgeId of this.graph.incomingEdges.get(nodeId) || []) {
        const edge = this.graph.edges.get(edgeId);
        if (!edge || edge.relationshipKind !== "calls") continue;

        const callerNode = this.graph.nodes.get(edge.sourceId);
        if (callerNode && callerNode.kind === "symbol") {
            callers.push(callerNode);
        }
    }

    return callers;
}`}
        />
      </section>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsTable } from "@/components/docs/DocsTable";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "7.3 Relationship Kinds & Edges — CodeGraph Documentation",
  description: "Complete specification of calls, imports, exports, extends, implements, instantiates, and references.",
};

export default function RelationshipTypesPage() {
  const nav = findDocItemByHref("/docs/reference/relationship-types");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="7.3"
        title="Relationship Kinds & Edges"
        summary="Technical specification of all 7 directed edge kinds and their structural invariants in the CodeGraph schema."
        sourceFile="server/src/graph/models/GraphEdge.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          The `GraphEdge` Interface
        </h2>

        <DocsCodeBlock
          filename="server/src/graph/models/GraphEdge.ts"
          language="typescript"
          code={`export interface GraphEdge {
    id: string;                         // Deterministic: sourceId:relationshipKind:targetId
    sourceId: string;                   // Prefixed source node ID
    targetId: string;                   // Prefixed target node ID
    relationshipKind: RelationshipKind; // "calls" | "imports" | "extends" | "implements" | ...
}`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Edge Semantics & Traversal Behavior
        </h2>

        <DocsTable
          headers={["Kind", "Source -> Target Meaning", "Traversed in Impact/Dependency?"]}
          rows={[
            ["\"calls\"", "Caller function -> Callee function", "Yes"],
            ["\"imports\"", "Importing file -> Imported file/dep/module", "Yes"],
            ["\"extends\"", "Subclass -> Superclass", "Yes"],
            ["\"implements\"", "Class -> Implemented Interface", "Yes"],
            ["\"instantiates\"", "Constructor caller -> Instantiated Class", "Yes"],
            ["\"exports\"", "File -> Exported Symbol", "No (Metadata edge)"],
            ["\"references\"", "Type reference -> Target Symbol", "No (Type metadata)"],
          ]}
        />
      </section>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

import React from "react";
import Link from "next/link";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsTable } from "@/components/docs/DocsTable";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "2.6 Relationship Extraction — CodeGraph Documentation",
  description: "Second-pass AST analysis linking symbols and files via calls, extends, implements, instantiates, and imports.",
};

export default function RelationshipExtractionOverviewPage() {
  const nav = findDocItemByHref("/docs/architecture/relationship-extraction");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="2.6"
        title="Relationship Extraction"
        summary="The second AST traversal pass that links symbols and files into directed graph edges by resolving function calls, class inheritance, constructor instantiations, and module imports."
        sourceFile="server/src/parser/extractors/RelationshipExtractor.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Supported Relationship Kinds
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          <code>RelationshipExtractor</code> generates 7 distinct directed edge kinds:
        </p>

        <DocsTable
          headers={["Relationship Kind", "Source Kind", "Target Kind", "Edge Direction Semantics"]}
          rows={[
            ["\"calls\"", "symbol", "symbol", "(callerFunction) --[calls]--> (targetFunction)"],
            ["\"extends\"", "symbol", "symbol", "(subClass) --[extends]--> (superClass)"],
            ["\"implements\"", "symbol", "symbol", "(class) --[implements]--> (interface/type)"],
            ["\"instantiates\"", "symbol", "symbol", "(sourceFunction/var) --[instantiates]--> (class)"],
            ["\"imports\"", "file", "file / symbol / dep / module", "(file) --[imports]--> (target)"],
            ["\"exports\"", "file", "symbol", "(file) --[exports]--> (symbol)"],
            ["\"references\"", "symbol", "symbol", "(symbol) --[references]--> (targetSymbol)"],
          ]}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          The `ParsedRelationship` Model
        </h2>

        <DocsCodeBlock
          filename="server/src/parser/models/ParsedRelationship.ts"
          language="typescript"
          code={`export interface ParsedRelationship {
    id: string;                               // Deterministic ID: \${sourceId}:\${relationshipKind}:\${targetId}
    sourceId: string;                         // Source entity ID (file path or symbol ID)
    sourceKind: RelationshipEntityKind;       // "file" | "symbol" | "module" | "dependency"
    targetId: string;                         // Target entity ID
    targetKind: RelationshipEntityKind;       // "file" | "symbol" | "module" | "dependency"
    relationshipKind: RelationshipKind;       // "calls" | "imports" | "extends" | ...
}`}
        />
      </section>

      {/* Subtopics Index */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Detailed Subtopics
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Explore the in-depth resolution algorithms for every relationship kind:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {[
            { title: "2.6.1 Call Graph Resolution", href: "/docs/architecture/relationship-extraction/calls", desc: "Resolving direct calls, member calls X.foo(), this.foo(), and cross-file calls." },
            { title: "2.6.2 Inheritance & Types", href: "/docs/architecture/relationship-extraction/inheritance", desc: "Resolving class extends superclasses and TypeScript implements clauses." },
            { title: "2.6.3 Instantiation Resolution", href: "/docs/architecture/relationship-extraction/instantiations", desc: "Tracking constructor new expressions in variable assignments and return statements." },
            { title: "2.6.4 Import Resolution (5-Step Waterfall)", href: "/docs/architecture/relationship-extraction/imports", desc: "Relative paths, path aliases (@/*), external dependencies, and extension resolution waterfall." },
            { title: "2.6.5 Export Mapping & Specifiers", href: "/docs/architecture/relationship-extraction/exports", desc: "Named declarations, specifier aliases (export { a as b }), and default export resolution." },
          ].map((topic) => (
            <Link
              key={topic.href}
              href={topic.href}
              className="p-3.5 rounded-lg border border-border bg-surface-elevated/20 hover:bg-surface-elevated/60 hover:border-border-highlight transition-colors space-y-1 block group"
            >
              <span className="text-xs font-semibold text-foreground font-heading group-hover:text-accent transition-colors">
                {topic.title}
              </span>
              <p className="text-[11px] text-muted leading-relaxed">
                {topic.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

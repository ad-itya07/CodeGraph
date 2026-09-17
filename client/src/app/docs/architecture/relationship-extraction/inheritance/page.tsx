import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "2.6.2 Inheritance & Interface Implementation — CodeGraph Documentation",
  description: "Resolving class extends inheritance and TypeScript implements clauses into graph relationships.",
};

export default function RelationshipInheritancePage() {
  const nav = findDocItemByHref("/docs/architecture/relationship-extraction/inheritance");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="2.6.2"
        title="Inheritance & Interface Implementation"
        summary="Extracting structural extends and implements relationships between classes, superclasses, and TypeScript interfaces."
        sourceFile="server/src/parser/extractors/RelationshipExtractor.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Class Inheritance: `extends`
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          For any <code>ClassDeclaration</code> with a <code>superClass</code> identifier:
        </p>

        <DocsCodeBlock
          filename="server/src/parser/extractors/RelationshipExtractor.ts"
          language="typescript"
          code={`private extractExtendsRelationship(parsedFile: ParsedFile, path: NodePath<ClassDeclaration | ClassExpression>) {
    const classSymbol = this.findSymbolForNode(parsedFile, path.node);
    if (!classSymbol || !path.node.superClass) return;

    if (path.node.superClass.type !== "Identifier") return; // Skip complex mixin calls

    const binding = path.scope.getBinding(path.node.superClass.name);
    if (!binding) return;

    const superClassSymbol = this.resolveBindingToSymbol(parsedFile, binding);
    if (!superClassSymbol) return;

    this.addRelationship({
        sourceId: classSymbol.id,
        sourceKind: "symbol",
        targetId: superClassSymbol.id,
        targetKind: "symbol",
        relationshipKind: "extends"
    });
}`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Interface Implementation: `implements`
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          For TypeScript <code>implements</code> clauses, the extractor iterates over <code>path.node.implements</code> and
          matches the interface name against <code>parsedFile.symbols</code>:
        </p>

        <DocsCodeBlock
          filename="Implements Relationship Extraction"
          language="typescript"
          code={`for (const impl of path.node.implements || []) {
    if (impl.expression.type === "Identifier") {
        const interfaceSymbol = parsedFile.symbols.find(
            s => s.name === impl.expression.name &&
                (s.symbolKind === "interface" || s.symbolKind === "typeAlias")
        );

        if (interfaceSymbol) {
            this.addRelationship({
                sourceId: classSymbol.id,
                sourceKind: "symbol",
                targetId: interfaceSymbol.id,
                targetKind: "symbol",
                relationshipKind: "implements"
            });
        }
    }
}`}
        />
      </section>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "2.5.1 Symbol Stack & Scoping Hierarchy — CodeGraph Documentation",
  description: "How symbolStack maintains parent-child pointers and deterministic ID formation during AST traversal.",
};

export default function SymbolScopingPage() {
  const nav = findDocItemByHref("/docs/architecture/symbol-extraction/scoping");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="2.5.1"
        title="Symbol Stack & Scoping Hierarchy"
        summary="Tracking container nesting context during AST traversal using symbolStack, path.setData invariants, and deterministic ID formation."
        sourceFile="server/src/parser/extractors/SymbolExtractor.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          The Symbol Stack Mechanism
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          As Babel traverses nested syntax trees, inner symbols need to know their enclosing parent container
          (for example, a method needs to link to its enclosing class). Rather than building a deeply nested tree,
          CodeGraph maintains a flat <code>symbols: ParsedSymbol[]</code> array where each symbol carries a
          <code>parentSymbolId</code> pointer.
        </p>
        <p className="text-sm text-muted leading-relaxed">
          This is coordinated by <code>symbolStack: ParsedSymbol[]</code>:
        </p>

        <DocsCodeBlock
          filename="Lifecycle Visitor Pattern"
          language="typescript"
          code={`private createContainerVisitor<T extends SupportedSymbolNode>(
    parsedFile: ParsedFile,
    symbolKind: SymbolKind,
    getExtraParams?: (path: NodePath<T>) => SymbolExtraParams
) {
    return {
        enter: (path: NodePath<T>) => {
            const extraParams = getExtraParams?.(path);
            const symbol = this.extractSymbol({ path, parsedFile, symbolKind, ...extraParams });

            if (symbol) {
                this.symbolStack.push(symbol);
                path.setData("symbolPushed", true); // Guard invariant
            }
        },

        exit: (path: NodePath<T>) => {
            if (path.getData("symbolPushed")) {
                this.symbolStack.pop();
            }
        }
    };
}`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Deterministic Symbol ID Generation
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Every symbol ID is guaranteed to be stable and reproducible across runs:
        </p>

        <DocsCodeBlock
          filename="Deterministic ID Formula"
          language="typescript"
          code={`// ID Format: \${filePath}:\${startLine}:\${startColumn}:\${name}
private buildSymbolId(parsedFile: ParsedFile, name: string, location: SymbolLocation): string {
    return \`\${parsedFile.filePath}:\${location.startLine}:\${location.startColumn}:\${name}\`;
}`}
        />
      </section>

      <DocsCallout type="important" title="path.setData Stack Invariant">
        The <code>path.setData("symbolPushed", true)</code> pattern guarantees that the exact same AST path node that
        pushed a container onto the stack is the one that pops it on exit. This prevents stack corruption if an
        anonymous or unnamable container returned <code>undefined</code> on enter.
      </DocsCallout>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

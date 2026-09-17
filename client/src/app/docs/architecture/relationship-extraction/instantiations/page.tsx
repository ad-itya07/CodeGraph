import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "2.6.3 Instantiation Resolution — CodeGraph Documentation",
  description: "Extracting constructor new expressions and attributing instantiation edges to variables and return statements.",
};

export default function RelationshipInstantiationsPage() {
  const nav = findDocItemByHref("/docs/architecture/relationship-extraction/instantiations");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="2.6.3"
        title="Instantiation Resolution"
        summary="Extracting object construction via new expressions and attributing source ownership to variable declarations and function return statements."
        sourceFile="server/src/parser/extractors/RelationshipExtractor.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Source Attribution for `NewExpression`
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          When an object is instantiated with <code>new Foo()</code>, CodeGraph determines the appropriate
          source entity:
        </p>

        <DocsCodeBlock
          filename="server/src/parser/extractors/RelationshipExtractor.ts"
          language="typescript"
          code={`private resolveSourceSymbolForInstantiates(parsedFile: ParsedFile, path: NodePath<NewExpression>): ParsedSymbol | undefined {
    // Case 1: Assigned to a variable (e.g., const client = new RedisClient())
    if (path.parentPath?.isVariableDeclarator()) {
        return this.findSymbolForNode(parsedFile, path.parentPath.node);
    }

    // Case 2: Returned from a function (e.g., return new UserSession())
    if (path.parentPath?.isReturnStatement()) {
        return this.symbolStack.at(-1); // Active enclosing function/method
    }

    return undefined; // Arbitrary inline argument instantiations are skipped
}`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Target Class Binding
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          The callee must be a named identifier (e.g., <code>new AppService()</code>). The extractor resolves
          the class binding in the current file scope or across imported modules to create:
        </p>

        <div className="p-4 rounded-lg border border-border bg-surface-elevated/40 font-mono text-xs text-accent">
          (sourceSymbol) --[instantiates]--&gt; (classSymbol)
        </div>
      </section>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

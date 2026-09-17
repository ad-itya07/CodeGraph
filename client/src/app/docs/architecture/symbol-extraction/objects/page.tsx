import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "2.5.6 Object Properties & Methods — CodeGraph Documentation",
  description: "Extracting object literal properties, methods, nested objects, and double-extraction guards.",
};

export default function SymbolObjectsPage() {
  const nav = findDocItemByHref("/docs/architecture/symbol-extraction/objects");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="2.5.6"
        title="Object Properties & Methods"
        summary="Extracting key-value properties and methods declared inside object literals, handling nested objects, and avoiding pattern conflicts."
        sourceFile="server/src/parser/extractors/SymbolExtractor.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Object Properties vs Object Patterns
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          In Babel ASTs, the <code>ObjectProperty</code> node represents both object literal fields (<code>const user = &#123; name: "Alice" &#125;</code>)
          and destructuring patterns (<code>const &#123; name &#125; = user</code>).
        </p>
        <p className="text-sm text-muted leading-relaxed">
          The <code>ObjectProperty</code> visitor explicitly ignores destructuring patterns, which are already handled
          by the <code>VariableDeclarator</code> visitor:
        </p>

        <DocsCodeBlock
          filename="server/src/parser/extractors/SymbolExtractor.ts"
          language="typescript"
          code={`ObjectProperty: {
    enter: (path: NodePath<ObjectProperty>) => {
        // Skip destructuring patterns (e.g., const { name } = user)
        if (path.parentPath?.isObjectPattern()) return;

        // Skip properties whose value is a function/class expression (handled by expression visitors)
        if (
            path.node.value.type === "ArrowFunctionExpression" ||
            path.node.value.type === "ClassExpression" ||
            path.node.value.type === "FunctionExpression"
        ) return;

        const symbol = this.extractSymbol({ path, parsedFile, symbolKind: "objectProperty" });

        // If the property value is a nested object, push symbol onto symbolStack
        if (symbol && path.node.value.type === "ObjectExpression") {
            this.symbolStack.push(symbol);
            path.setData("symbolPushed", true);
        }
    },
    exit: (path: NodePath<ObjectProperty>) => {
        if (path.getData("symbolPushed")) {
            this.symbolStack.pop();
        }
    }
}`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Nested Object Literal Hierarchy
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          For nested objects like <code>const config = &#123; db: &#123; host: "localhost" &#125; &#125;</code>:
        </p>
        <ol className="list-decimal list-inside text-sm text-muted space-y-1 pl-2">
          <li><code>config</code> (variable) is pushed to <code>symbolStack</code>.</li>
          <li><code>db</code> (objectProperty) is extracted with <code>parentSymbolId = config.id</code> and pushed to <code>symbolStack</code>.</li>
          <li><code>host</code> (objectProperty) is extracted with <code>parentSymbolId = db.id</code>.</li>
          <li>Exits pop <code>db</code> then <code>config</code>, maintaining perfect hierarchical fidelity.</li>
        </ol>
      </section>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsTable } from "@/components/docs/DocsTable";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "2.5.4 Variables & Pattern Destructuring — CodeGraph Documentation",
  description: "Extracting variables, handling ObjectPattern aliases, ArrayPattern unpacking, and object containers.",
};

export default function SymbolVariablesPage() {
  const nav = findDocItemByHref("/docs/architecture/symbol-extraction/variables");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="2.5.4"
        title="Variables & Destructuring Patterns"
        summary="Extracting declared variables across plain identifiers, ObjectPattern destructuring with aliases, and ArrayPattern unpacking."
        sourceFile="server/src/parser/extractors/SymbolExtractor.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          The Destructuring Engine: `getVariableName`
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          In JavaScript/TypeScript, a single <code>VariableDeclarator</code> statement can declare multiple
          variables via pattern matching. The extractor unpacks each into independent <code>ParsedSymbol</code> records:
        </p>

        <DocsCodeBlock
          filename="server/src/parser/extractors/SymbolExtractor.ts"
          language="typescript"
          code={`private getVariableName(path: NodePath<VariableDeclarator>): string[] {
    const id = path.node.id;

    // 1. Plain Identifier: const count = 10
    if (id.type === "Identifier") {
        return [id.name];
    }

    // 2. ObjectPattern: const { name, age: userAge } = user
    if (id.type === "ObjectPattern") {
        return id.properties
            .filter(property => property.type === "ObjectProperty")
            .map(property => {
                // Incase of aliases ({ age: userAge }), symbol name is "userAge"
                if (property.value.type === "Identifier") {
                    return property.value.name;
                }
                return null;
            })
            .filter((name): name is string => name !== null);
    }

    // 3. ArrayPattern: const [first, second] = items
    if (id.type === "ArrayPattern") {
        return id.elements
            .filter(element => element?.type === "Identifier")
            .map(element => element?.name);
    }

    return [];
}`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Variables Initialized with Object Literals
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          When a variable is initialized with an <code>ObjectExpression</code> (e.g. <code>const serverConfig = &#123; port: 8080 &#125;</code>),
          the variable symbol itself acts as a container. It is pushed to <code>symbolStack</code> so that
          nested <code>ObjectProperty</code> and <code>ObjectMethod</code> declarations can set the variable as their <code>parentSymbolId</code>.
        </p>
      </section>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

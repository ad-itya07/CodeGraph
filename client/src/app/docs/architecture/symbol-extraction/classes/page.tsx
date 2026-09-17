import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsTable } from "@/components/docs/DocsTable";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "2.5.3 Classes & Methods — CodeGraph Documentation",
  description: "Extracting class declarations, private methods (#field), getters, setters, and method kinds.",
};

export default function SymbolClassesPage() {
  const nav = findDocItemByHref("/docs/architecture/symbol-extraction/classes");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="2.5.3"
        title="Classes & Methods"
        summary="Extracting class declarations and expressions, classifying method kinds (regular, getters, setters, private), and maintaining parent class pointers."
        sourceFile="server/src/parser/extractors/SymbolExtractor.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Method Kinds & Classification
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          When extracting class methods, the extractor classifies the method into a specific <code>MethodKind</code>:
        </p>

        <DocsTable
          headers={["Method Kind", "AST Node / Condition", "Example Code"]}
          rows={[
            ["\"method\"", "ClassMethod where kind === 'method'", "class A { run() {} }"],
            ["\"get\"", "ClassMethod where kind === 'get'", "class A { get total() { return 10; } }"],
            ["\"set\"", "ClassMethod where kind === 'set'", "class A { set total(v) {} }"],
            ["\"private\"", "ClassPrivateMethod (PrivateName #key)", "class A { #executeInternal() {} }"],
          ]}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Private Method Extraction
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          ECMAScript private methods (<code>#privateMethod()</code>) use <code>PrivateName</code> AST nodes rather
          than standard <code>Identifier</code> nodes. The extractor unwraps the identifier name safely:
        </p>

        <DocsCodeBlock
          filename="Private Method Unwrapping"
          language="typescript"
          code={`if (path.isClassPrivateMethod()) {
    const key = path.node.key;
    if (key.type === "PrivateName") {
        return key.id.name; // Extracts 'executeInternal' from '#executeInternal'
    }
}

private getMethodKind(path: NodePath<ClassMethod | ClassPrivateMethod | ObjectMethod>): MethodKind {
    if (path.isClassPrivateMethod()) return "private";
    return path.node.kind === "get" || path.node.kind === "set" ? path.node.kind : "method";
}`}
        />
      </section>

      <DocsCallout type="note" title="Parent Class Linking">
        Because <code>ClassDeclaration</code> is a container visitor, the class symbol is placed on <code>symbolStack</code>.
        When any <code>ClassMethod</code> is visited, its <code>parentSymbolId</code> is automatically set to the class ID.
      </DocsCallout>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

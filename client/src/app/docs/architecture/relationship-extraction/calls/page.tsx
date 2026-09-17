import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "2.6.1 Call Graph Resolution — CodeGraph Documentation",
  description: "Resolving direct identifier calls, member calls X.foo(), this.foo(), and cross-file calls.",
};

export default function RelationshipCallsPage() {
  const nav = findDocItemByHref("/docs/architecture/relationship-extraction/calls");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="2.6.1"
        title="Call Graph Resolution"
        summary="Resolving function and method invocations from AST CallExpression nodes across local scopes, class instances, and imported modules."
        sourceFile="server/src/parser/extractors/RelationshipExtractor.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Call Target Resolution Branches
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          The entry point <code>extractCallRelationship()</code> inspects the AST <code>CallExpression</code> callee:
        </p>

        <h3 className="text-base font-semibold text-foreground font-heading">
          Branch A: Direct Identifier Calls (<code>foo()</code>)
        </h3>
        <p className="text-sm text-muted leading-relaxed">
          Queries Babel's scope binding <code>path.scope.getBinding(callee.name)</code>. If found locally, it resolves
          to the declaration symbol. If imported, <code>resolveImportedBindingToSymbol()</code> resolves it across files.
        </p>

        <h3 className="text-base font-semibold text-foreground font-heading">
          Branch B: Member Expression Calls (<code>X.foo()</code>)
        </h3>
        <p className="text-sm text-muted leading-relaxed">
          For member calls, the extractor resolves the object <code>X</code>:
        </p>
        <ul className="list-disc list-inside text-sm text-muted space-y-1.5 pl-2">
          <li><strong><code>this.foo()</code></strong>: Walks up the <code>parentSymbolId</code> chain from the current scope to find the enclosing class symbol.</li>
          <li><strong><code>X.foo()</code> where <code>const X = new SomeClass()</code></strong>: Inspects <code>X</code>'s binding node. If initialized via <code>NewExpression</code>, resolves the class binding and finds the method where <code>parentSymbolId === classSymbol.id</code>.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Cross-File Import Binding Resolution
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          When a called function originates from an <code>import</code> statement:
        </p>

        <DocsCodeBlock
          filename="Cross-File Resolution Flow"
          language="typescript"
          code={`private resolveImportedBindingToSymbol(parsedFile: ParsedFile, binding: Binding): ParsedSymbol | undefined {
    const importDeclaration = binding.path.parentPath?.node;
    if (importDeclaration?.type !== "ImportDeclaration") return undefined;

    const importSource = importDeclaration.source.value;

    // 1. Resolve relative path or tsconfig path alias
    const resolvedPath = this.resolveRelativeImportPath(parsedFile, importSource)
        || this.resolveAliasPath(parsedFile, importSource);

    // 2. Find imported file in parsedFiles[]
    const importedFile = this.findParsedFileByResolvedPath(resolvedPath, this.parsedFiles);
    if (!importedFile) return undefined;

    // 3. Match exported name to foreign symbol ID
    const importedName = this.resolveImportedExportName(binding.path.node);
    const exportedSymbol = importedFile.exports.find(e => e.exportedName === importedName);
    if (!exportedSymbol) return undefined;

    return importedFile.symbols.find(s => s.id === exportedSymbol.symbolId);
}`}
        />
      </section>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

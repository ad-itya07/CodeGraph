import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsTable } from "@/components/docs/DocsTable";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "2.6.5 Export Mapping & Specifiers — CodeGraph Documentation",
  description: "Extracting named exports, specifier renames (export { a as b }), and default exports.",
};

export default function RelationshipExportsPage() {
  const nav = findDocItemByHref("/docs/architecture/relationship-extraction/exports");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="2.6.5"
        title="Export Mapping & Specifiers"
        summary="Mapping exported symbol names to internal symbol IDs across named declarations, aliased specifiers, and default exports."
        sourceFile="server/src/parser/extractors/SymbolExtractor.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Export Extraction in AST Exit Passes
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Export mapping runs during AST <strong>exit</strong> passes. This ensures that all symbols in the file
          have already been discovered and assigned IDs before export resolution attempts to bind them.
        </p>

        <DocsTable
          headers={["Export Form", "AST Node", "Resolution Mechanism", "Exported Name"]}
          rows={[
            ["Declared Named Export", "ExportNamedDeclaration (declaration)", "Finds declaration symbol in parsedFile.symbols by location.", "symbol.name"],
            ["Variable Declarator Export", "ExportNamedDeclaration (VariableDeclaration)", "Iterates declarators, finds symbol by init/declarator location.", "declarator.name"],
            ["Specifier Export", "ExportNamedDeclaration (specifiers)", "Resolves specifier.local.name via path.scope.getBinding(), maps to symbol.", "specifier.exported.name"],
            ["Declared Default Export", "ExportDefaultDeclaration (declaration)", "Finds declaration symbol by start location.", "\"default\""],
            ["Identifier Default Export", "ExportDefaultDeclaration (Identifier)", "Resolves identifier binding, or falls back to name search for types.", "\"default\""],
          ]}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Specifier Renaming: `export &#123; foo as bar &#125;`
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          When a symbol is exported with an alias:
        </p>

        <DocsCodeBlock
          filename="server/src/parser/extractors/SymbolExtractor.ts"
          language="typescript"
          code={`// export { internalService as publicApi }
for (const specifier of path.node.specifiers) {
    if (specifier.type !== "ExportSpecifier") continue;

    // local.name = "internalService"
    const symbol = this.resolveExportSpecifierToSymbol(parsedFile, path, specifier.local.name);
    if (!symbol) continue;

    // exported.name = "publicApi"
    exportedSymbols.push({
        exportedName: specifier.exported.name, // "publicApi"
        symbolId: symbol.id                    // Links to internalService symbol ID
    });
}`}
        />
      </section>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsTable } from "@/components/docs/DocsTable";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "2.5.5 TypeScript Type Declarations — CodeGraph Documentation",
  description: "Extracting TypeScript interfaces, type aliases, and enums without runtime bindings.",
};

export default function SymbolTypesPage() {
  const nav = findDocItemByHref("/docs/architecture/symbol-extraction/types");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="2.5.5"
        title="TypeScript Type Declarations"
        summary="Extracting compile-time type definitions including interfaces, type aliases, and enums from Babel syntax trees."
        sourceFile="server/src/parser/extractors/SymbolExtractor.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Supported TypeScript Types
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          CodeGraph extracts three core TypeScript type declarations as first-class symbols:
        </p>

        <DocsTable
          headers={["Declaration Type", "SymbolKind", "Example Syntax", "Runtime Scope Binding?"]}
          rows={[
            ["TSInterfaceDeclaration", "interface", "interface UserRecord { id: string; }", "No (stripped at runtime)"],
            ["TSTypeAliasDeclaration", "typeAlias", "type Handler = (e: Event) => void", "No (stripped at runtime)"],
            ["TSEnumDeclaration", "enum", "enum Direction { Up, Down }", "Yes (runtime object in JS)"],
          ]}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Why Type Declarations Require Name-Based Fallbacks
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Because TypeScript interfaces and type aliases are purely compile-time constructs, Babel's scope
          tracking (<code>path.scope.getBinding(name)</code>) does not create runtime binding records for them.
        </p>
        <p className="text-sm text-muted leading-relaxed">
          When an export or implements statement references a type (e.g. <code>export default UserInterface</code> or
          <code>class A implements UserInterface</code>), the resolver falls back to searching <code>parsedFile.symbols</code>
          by identifier name:
        </p>

        <DocsCodeBlock
          filename="Type Binding Fallback"
          language="typescript"
          code={`// Fallback when Babel scope binding returns undefined for types:
const symbol = parsedFile.symbols.find(
    s => s.name === name && (
        s.symbolKind === "interface" ||
        s.symbolKind === "typeAlias" ||
        s.symbolKind === "enum"
    )
);`}
        />
      </section>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

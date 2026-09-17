import React from "react";
import Link from "next/link";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsTable } from "@/components/docs/DocsTable";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "2.5 Symbol Extraction — CodeGraph Documentation",
  description: "First-pass AST traversal identifying classes, functions, methods, variables, interfaces, enums, and export mappings.",
};

export default function SymbolExtractionOverviewPage() {
  const nav = findDocItemByHref("/docs/architecture/symbol-extraction");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="2.5"
        title="Symbol Extraction"
        summary="The first AST traversal pass that walks every source file, extracts named code declarations, preserves nesting hierarchy via the symbol stack, and registers file exports."
        sourceFile="server/src/parser/extractors/SymbolExtractor.ts"
      />

      {/* Overview */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Supported Symbol Kinds
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          <code>SymbolExtractor</code> maps Babel AST declaration nodes to <code>SymbolKind</code> union members:
        </p>

        <DocsTable
          headers={["Babel AST Node Type", "SymbolKind", "Example Syntax", "Container Node?"]}
          rows={[
            ["FunctionDeclaration", "function", "function calculateTotal() {}", "Yes"],
            ["ArrowFunctionExpression", "function", "const handleAuth = () => {}", "Yes"],
            ["FunctionExpression", "function", "const init = function() {}", "Yes"],
            ["ClassDeclaration / Expression", "class", "class AuthService {}", "Yes"],
            ["ClassMethod / PrivateMethod", "method", "login() {} / #privateLog() {}", "Yes"],
            ["ObjectMethod", "method", "const service = { run() {} }", "Yes"],
            ["VariableDeclarator", "variable", "const PORT = 3000", "Yes (if Object)"],
            ["TSInterfaceDeclaration", "interface", "interface UserRecord {}", "No"],
            ["TSTypeAliasDeclaration", "typeAlias", "type Token = string", "No"],
            ["TSEnumDeclaration", "enum", "enum Status { Active }", "No"],
            ["ObjectProperty", "objectProperty", "const obj = { key: 'val' }", "Yes (if Object)"],
          ]}
        />
      </section>

      {/* Model */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          The `ParsedSymbol` Model
        </h2>

        <DocsCodeBlock
          filename="server/src/parser/models/ParsedSymbol.ts"
          language="typescript"
          code={`export interface ParsedSymbol {
    id: string;               // Deterministic ID: filePath:startLine:startColumn:name
    name: string;             // Identifier name
    symbolKind: SymbolKind;   // "function" | "method" | "class" | "interface" | ...
    methodKind?: MethodKind;  // "get" | "set" | "method" | "private"
    location: SymbolLocation; // { startLine, startColumn, endLine, endColumn }
    parentSymbolId?: string;  // ID of enclosing class, function, or object
}`}
        />
      </section>

      {/* Subtopics Index */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Detailed Subtopics
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Explore the in-depth mechanics of how each declaration pattern is extracted:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {[
            { title: "2.5.1 Symbol Stack & Scoping", href: "/docs/architecture/symbol-extraction/scoping", desc: "How symbolStack maintains parent-child pointers during recursive traversal." },
            { title: "2.5.2 Functions & Arrow Functions", href: "/docs/architecture/symbol-extraction/functions", desc: "Function declarations, expressions, arrow functions, and double-extraction guards." },
            { title: "2.5.3 Classes & Methods", href: "/docs/architecture/symbol-extraction/classes", desc: "Class declarations, private class methods (#field), and getters/setters." },
            { title: "2.5.4 Variables & Destructuring", href: "/docs/architecture/symbol-extraction/variables", desc: "Identifier variables, ObjectPattern aliases, and ArrayPattern unpacking." },
            { title: "2.5.5 TypeScript Type Declarations", href: "/docs/architecture/symbol-extraction/types", desc: "Extraction of interfaces, type aliases, and enums without runtime bindings." },
            { title: "2.5.6 Object Properties & Methods", href: "/docs/architecture/symbol-extraction/objects", desc: "Object literals, method properties, and nested object hierarchies." },
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

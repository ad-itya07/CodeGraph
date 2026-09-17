import React from "react";
import Link from "next/link";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsTable } from "@/components/docs/DocsTable";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "2.3 AST Generation & Parsing — CodeGraph Documentation",
  description: "Babel parser integration, AST generation, syntax plugins, and error handling mechanics.",
};

export default function AstGenerationPage() {
  const nav = findDocItemByHref("/docs/architecture/ast-generation");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="2.3"
        title="AST Generation & Parsing"
        summary="Transforming raw source code strings into Babel Abstract Syntax Trees (AST) with full support for modern ECMAScript, JSX, and TypeScript syntax."
        sourceFile="server/src/parser/babel/parseFile.ts"
      />

      {/* Overview */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          AST Parsing Pipeline
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          For every discovered source file, <code>parseFile(filePath)</code> reads the raw UTF-8 content from disk
          and invokes <code>@babel/parser.parse()</code>.
        </p>

        <DocsCodeBlock
          filename="server/src/parser/babel/parseFile.ts"
          language="typescript"
          code={`export function parseFile(filePath: string): ParsedFile {
    const code = fs.readFileSync(filePath, 'utf-8');

    const ast = parse(code, parserOptions);

    return {
        filePath,
        ast,
        symbols: [],   // Populated in Stage 4
        exports: []    // Populated in Stage 4
    };
}`}
        />
      </section>

      {/* Parser Configuration */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Babel Parser Configuration
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          To ensure CodeGraph can parse modern production codebases (Next.js, Vite, NestJS, React), the parser
          is configured with <code>sourceType: "module"</code> and the following active plugin list:
        </p>

        <DocsCodeBlock
          filename="server/src/parser/babel/parserOption.ts"
          language="typescript"
          code={`export const parserOptions: ParserOptions = {
    sourceType: "module",
    plugins: [
        "jsx",                    // React JSX / TSX
        "typescript",             // Full TypeScript type annotations
        "decorators",             // TC39 & legacy decorators
        "classProperties",        // Public class fields
        "classPrivateProperties", // Private class fields (#privateField)
        "classPrivateMethods",    // Private class methods (#privateMethod)
        "dynamicImport",          // import() expressions
        "importMeta",             // import.meta.url
        "topLevelAwait"           // Top-level await in ESM
    ]
};`}
        />
      </section>

      {/* Data Model */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          The `ParsedFile` Container
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          The AST output is wrapped in a <code>ParsedFile</code> model that will be mutated in-place by the
          Symbol Extractor in the next stage:
        </p>

        <DocsCodeBlock
          filename="server/src/parser/models/ParsedFile.ts"
          language="typescript"
          code={`export interface ParsedFile {
    filePath: string;           // Absolute normalized file path
    ast: File;                  // Babel AST root node
    symbols: ParsedSymbol[];    // Populated during Pass 1
    exports: ParsedExport[];    // Export mapping populated during Pass 1
}`}
        />
      </section>

      <DocsCallout type="tip" title="AST Longevity">
        The raw Babel AST is retained in memory through Stage 4 and Stage 5 to allow fast AST visitor traversals.
        When building the final in-memory <code>Graph</code> in Stage 7, the heavy AST objects are discarded,
        keeping only lightweight node and edge instances.
      </DocsCallout>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

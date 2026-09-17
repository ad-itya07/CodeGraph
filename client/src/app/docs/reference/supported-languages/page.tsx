import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsTable } from "@/components/docs/DocsTable";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "7.1 Supported Languages & Syntax — CodeGraph Documentation",
  description: "Supported file extensions (.ts, .tsx, .js, .jsx) and active Babel parser plugins.",
};

export default function SupportedLanguagesPage() {
  const nav = findDocItemByHref("/docs/reference/supported-languages");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="7.1"
        title="Supported Languages & Syntax"
        summary="Technical specification of supported file formats, compiler extensions, and active syntax plugins."
        sourceFile="server/src/parser/babel/parserOption.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Supported Extensions
        </h2>
        <DocsTable
          headers={["Extension", "Language", "Parser Plugins"]}
          rows={[
            [".ts", "TypeScript", "typescript, decorators, classProperties, classPrivateProperties, classPrivateMethods, topLevelAwait"],
            [".tsx", "TypeScript + React JSX", "typescript, jsx, decorators, classProperties, classPrivateProperties, classPrivateMethods"],
            [".js", "Modern ECMAScript (ESM/CJS)", "dynamicImport, importMeta, topLevelAwait, classProperties, classPrivateProperties"],
            [".jsx", "JavaScript + React JSX", "jsx, dynamicImport, importMeta, classProperties, classPrivateProperties"],
          ]}
        />
      </section>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

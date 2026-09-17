import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsTable } from "@/components/docs/DocsTable";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "7.2 Code Entities & Node Types — CodeGraph Documentation",
  description: "TypeScript interfaces and schema specifications for FileNode, SymbolNode, DependencyNode, and ModuleNode.",
};

export default function NodeTypesPage() {
  const nav = findDocItemByHref("/docs/reference/node-types");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="7.2"
        title="Code Entities & Node Types"
        summary="Complete TypeScript interface specifications for all four node types in the CodeGraph entity schema."
        sourceFile="server/src/graph/models/GraphNode.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          The `GraphNode` Discriminated Union
        </h2>

        <DocsCodeBlock
          filename="server/src/graph/models/GraphNode.ts"
          language="typescript"
          code={`export type GraphNodeKind = "file" | "symbol" | "dependency" | "module";

export type GraphNode =
    | FileNode
    | SymbolNode
    | DependencyNode
    | ModuleNode;`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Individual Node Interfaces
        </h2>

        <DocsCodeBlock
          filename="Node Interfaces"
          language="typescript"
          code={`export interface FileNode {
    id: string;               // "file:/abs/path/to/file.ts"
    kind: "file";
    filePath: string;
}

export interface SymbolNode {
    id: string;               // "symbol:/abs/path/to/file.ts:12:4:login"
    kind: "symbol";
    name: string;
    symbolKind: SymbolKind;
    fileId: string;           // Owning FileNode ID
    location: SymbolLocation; // { startLine, startColumn, endLine, endColumn }
    methodKind?: MethodKind;  // "get" | "set" | "method" | "private"
    parentSymbolId?: string;  // Enclosing container symbol ID
}

export interface DependencyNode {
    id: string;               // "dependency:express"
    kind: "dependency";
    name: string;
    version: string;
    packageJsonPath: string;
}

export interface ModuleNode {
    id: string;               // "module:fs"
    kind: "module";
    name: string;
}`}
        />
      </section>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsTable } from "@/components/docs/DocsTable";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "2.6.4 Import Resolution & 5-Step Waterfall — CodeGraph Documentation",
  description: "Detailed resolution algorithms for relative paths, tsconfig path aliases (@/*), external dependencies, and the 5-step file matching waterfall.",
};

export default function RelationshipImportsPage() {
  const nav = findDocItemByHref("/docs/architecture/relationship-extraction/imports");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="2.6.4"
        title="Import Resolution & 5-Step Waterfall"
        summary="How CodeGraph resolves module import strings to local files, path aliases, external npm packages, and Node.js built-in modules using a deterministic 5-step waterfall."
        sourceFile="server/src/parser/extractors/RelationshipExtractor.ts"
      />

      {/* 3 Resolution Strategies */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Three Import Resolution Strategies
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          When an <code>ImportDeclaration</code> is encountered, <code>extractImportRelationship()</code> evaluates
          3 strategies sequentially:
        </p>

        <DocsTable
          headers={["Strategy", "Condition", "Resolution Mechanism"]}
          rows={[
            ["1. Relative Import", "Import source starts with '.' (./ or ../)", "Resolved against importing file's directory using path.resolve(), then passed to the 5-step file matching waterfall."],
            ["2. Path Alias Import", "Matches compilerOptions.paths alias (e.g. @/*)", "Finds nearest tsconfig.json/jsconfig.json, expands prefix/suffix wildcards, and computes absolute path."],
            ["3. External Import", "Non-relative, non-aliased (e.g. express, fs)", "Checks nearest package.json: if present in dependencies -> targetKind: 'dependency'; if Node built-in -> targetKind: 'module'."],
          ]}
        />
      </section>

      {/* 5-Step File Lookup Waterfall */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          The 5-Step `findParsedFileByResolvedPath` Lookup Waterfall
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Both relative imports and path-aliased imports pass their resolved absolute path to this private
          waterfall to locate the target file in the in-memory <code>parsedFiles[]</code> array:
        </p>

        <DocsTable
          headers={["Step", "Matching Rule", "Code / Behavior", "Ambiguity Guard"]}
          rows={[
            ["Step 1: Exact Match", "parsedFile.filePath === resolvedImportPath", "Handles imports with exact extensions (e.g., import './utils/index.ts'). Returns immediately.", "N/A"],
            ["Step 2: Extension Detection", "path.extname(resolvedImportPath)", "Detects if import ends in .ts, .tsx, .js, .jsx to branch between Steps 3 and 4.", "N/A"],
            ["Step 3: Base-Name Compatible Match", "Strip extensions, compare base paths", "Matches compatible variants (e.g. import './file.js' matching file.ts on disk).", "If >1 file matches base name, returns undefined."],
            ["Step 4: Extensionless Match", "candidate.slice(0, -ext) === resolvedPath", "Resolves extensionless imports (e.g. import './utils' matching ./utils.ts).", "If >1 file matches base name, returns undefined."],
            ["Step 5: Directory / Index Match", "dirname(candidate) === path && basename is index", "Resolves directory imports (e.g. import './components' matching ./components/index.tsx).", "If >1 index file matches, returns undefined."],
          ]}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Wildcard Path Alias Matching
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Path aliases from <code>tsconfig.json</code> (such as <code>"@/*": ["src/*"]</code>) are expanded by
          splitting on the <code>*</code> wildcard:
        </p>

        <DocsCodeBlock
          filename="Wildcard Expansion Logic"
          language="typescript"
          code={`// Example: import from "@/utils/auth" with alias "@/*" -> "src/*"
const [prefix, suffix] = alias.split("*");
if (importSource.startsWith(prefix) && importSource.endsWith(suffix)) {
    const wildcardValue = importSource.slice(prefix.length, importSource.length - suffix.length);
    const targetPath = aliasPath.replace("*", wildcardValue); // "src/utils/auth"
    const resolvedPath = path.resolve(baseDirectory, baseUrl, targetPath);
}`}
        />
      </section>

      <DocsCallout type="important" title="Ambiguity Safety Guarantee">
        If a codebase has multiple conflicting files sharing a base name (e.g. both <code>auth.js</code> and
        <code>auth.ts</code> exist side-by-side), Steps 3, 4, and 5 return <code>undefined</code>. CodeGraph
        deliberately avoids creating an incorrect relationship edge rather than guessing.
      </DocsCallout>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

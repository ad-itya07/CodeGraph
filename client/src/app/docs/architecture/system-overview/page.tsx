import React from "react";
import Link from "next/link";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsTable } from "@/components/docs/DocsTable";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "2.1 System Overview — CodeGraph Documentation",
  description: "High-level technical architecture of the CodeGraph 5-stage transformation pipeline and multi-pass AST processing.",
};

export default function SystemOverviewPage() {
  const nav = findDocItemByHref("/docs/architecture/system-overview");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="2.1"
        title="System Overview"
        summary="The complete 5-stage transformation pipeline that parses source code, extracts symbols and scopes, resolves complex relationship bindings, and constructs the canonical in-memory graph."
        sourceFile="server/src/parser/index.ts"
      />

      {/* The 5 Pipeline Steps */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          The 5 Sequential Pipeline Stages
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          The top-level <code>Parser.parse(repositoryPath)</code> orchestrator executes a strict, sequential
          pipeline. Each stage depends strictly on the structured output of its predecessor:
        </p>

        <DocsTable
          headers={["Stage", "Name", "Input", "Output", "Key Purpose"]}
          rows={[
            ["Step 0", "Path Normalization", "Raw path string", "Normalized absolute path", "Ensures filesystem paths match resolved relative and aliased import paths."],
            ["Step 1", "Repository Walker", "Directory path", "RepositoryFiles (4 arrays)", "Recursively scans filesystem, filters ignored dirs, and groups source files & configs."],
            ["Step 2", "Metadata Extraction", "Config file paths", "RepositoryMetadata", "Extracts package.json dependencies and tsconfig/jsconfig baseUrl & path aliases."],
            ["Step 3", "AST Generation", "Source file paths", "ParsedFile[] & ParseFailure[]", "Parses JS/TS code with Babel into ASTs with modern syntax plugins."],
            ["Step 4", "Symbol Extraction", "ParsedFile (empty symbols)", "Populates .symbols & .exports", "Pass 1 AST traversal: extracts functions, classes, methods, variables, and types."],
            ["Step 5", "Relationship Extraction", "ParsedFile[] & Metadata", "ParsedRelationship[]", "Pass 2 AST traversal: resolves calls, extends, implements, instantiates, and imports."],
          ]}
        />
      </section>

      {/* Orchestrator Implementation */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Orchestrator Implementation
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Here is how the <code>Parser</code> class coordinates the stages in <code>server/src/parser/index.ts</code>:
        </p>

        <DocsCodeBlock
          filename="server/src/parser/index.ts"
          language="typescript"
          code={`export class Parser {
    async parse(repositoryPath: string): Promise<ParsedRepository> {
        // Step 0: Absolute Path Normalization
        repositoryPath = path.resolve(repositoryPath);

        // Step 1: Getting repository files
        const repositoryFiles = getRepositoryFiles(repositoryPath);
        if (repositoryFiles.sourceFiles.length === 0) {
            throw new NoSupportedFileError();
        }

        // Step 2: Extracting metadata (package.json & tsconfig.json)
        const packageJsonExtractor = new PackageJsonExtractor();
        const pathConfigExtractor = new PathConfigExtractor();

        const packageJsons = repositoryFiles.packageJsonFiles.map(f => packageJsonExtractor.extract(f));
        const pathConfigs = [
            ...repositoryFiles.tsconfigJsonFiles,
            ...repositoryFiles.jsconfigJsonFiles
        ].map(f => pathConfigExtractor.extract(f));

        const metadata: RepositoryMetadata = { packageJsons, pathConfigs };

        // Step 3: Parsing files and generating Babel ASTs
        const parsedFiles: ParsedFile[] = [];
        const failedFiles: ParseFailure[] = [];
        for (const file of repositoryFiles.sourceFiles) {
            try {
                parsedFiles.push(parseFile(file));
            } catch (err: unknown) {
                failedFiles.push({ filePath: file, message: err instanceof Error ? err.message : "Parse error" });
            }
        }

        // Step 4: First AST Pass — Symbol Extraction
        const symbolExtractor = new SymbolExtractor();
        for (const parsedFile of parsedFiles) {
            symbolExtractor.extract(parsedFile);
        }

        // Step 5: Second AST Pass — Relationship Extraction
        const relationshipExtractor = new RelationshipExtractor();
        const relationships = relationshipExtractor.extract(parsedFiles, metadata);

        return { repositoryPath, files: parsedFiles, metadata, failures: failedFiles, relationships };
    }
}`}
        />
      </section>

      {/* Why Two Passes? */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Architectural Invariant: Why Two AST Passes?
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          A fundamental requirement of code graph construction is that cross-file relationships cannot be
          resolved until <em>all</em> symbols and exports across <em>all</em> files are known.
        </p>
        <p className="text-sm text-muted leading-relaxed">
          If File A imports <code>&#123; validateUser &#125;</code> from File B, File A's AST visitor cannot
          link the call site to <code>validateUser</code>'s node ID unless File B has already been parsed and its
          symbols extracted. By separating <strong>Symbol Extraction (Pass 1)</strong> from <strong>Relationship Extraction (Pass 2)</strong>,
          CodeGraph guarantees 100% resolution accuracy regardless of file traversal order.
        </p>
      </section>

      {/* Analysis Coverage & Evolving Syntax Model */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Analysis Coverage &amp; Evolving Syntax Model
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          CodeGraph analyzes repositories using a <strong>static syntax and relationship model</strong>.
          The parser extracts syntactic declarations and explicit binding relationships directly from Abstract Syntax Trees,
          and analytics algorithms operate deterministically on that extracted graph representation.
        </p>
        <p className="text-sm text-muted leading-relaxed">
          JavaScript and TypeScript support an extraordinarily flexible range of language constructs, functional compositions,
          and coding patterns. Coverage of these syntactic forms is continuously expanding and evolving:
        </p>
        <ul className="list-disc list-inside text-sm text-muted space-y-1.5 pl-2">
          <li>
            <strong className="text-foreground">Direct Bindings</strong>: Explicit function calls, class inheritance (<code>extends</code>), interface contracts (<code>implements</code>), constructor instantiations (<code>new</code>), and ES module imports are fully modeled.
          </li>
          <li>
            <strong className="text-foreground">Higher-Order Wrappers &amp; Dynamic Constructs</strong>: Complex patterns such as higher-order middleware wrappers (e.g., <code>const createUser = asyncHandler(async (req, res) =&gt; &#123; ... &#125;)</code>) or dynamic property access are completely valid code, though not every indirect relationship may be fully represented by the static extraction model.
          </li>
          <li>
            <strong className="text-foreground">Structural Insights</strong>: Analysis results provide high-fidelity structural facts and architectural insights across files and symbols, designed as practical engineering telemetry rather than an exhaustive runtime semantic simulation.
          </li>
        </ul>
      </section>

      <DocsCallout type="important" title="Error Containment">
        Individual file syntax errors are caught and appended to <code>failures: ParseFailure[]</code>.
        The parser never crashes the entire repository run due to a single invalid file; valid files continue
        through the pipeline.
      </DocsCallout>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}

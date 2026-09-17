"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Workflow,
  Layers,
  Network,
  Cpu,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Compass,
  Activity,
  Copy,
  Check,
} from "lucide-react";

interface PipelineStep {
  id: string;
  stepNumber: string;
  title: string;
  subtitle: string;
  input: string;
  output: string;
  description: string;
  keyConcepts: string[];
  codeSnippet: string;
  codeLanguage: string;
  errorHandling: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "step-1",
    stepNumber: "01",
    title: "Repository Walking & Normalization",
    subtitle: "Absolute path anchoring and file discovery",
    input: "repositoryPath (string: relative or absolute)",
    output: "RepositoryFiles { sourceFiles, packageJsonFiles, tsconfigJsonFiles, jsconfigJsonFiles }",
    description:
      "The pipeline starts by converting the input path into a normalized absolute path using path.resolve(). It scans the repository recursively to categorize files into source code (.ts, .tsx, .js, .jsx) and configuration files. Path normalization is critical so relative import paths resolved downstream match exact file keys in memory.",
    keyConcepts: [
      "Deterministic path.resolve() anchoring",
      "Ignore rules (.git, node_modules, dist, build)",
      "Categorization of tsconfig.json and jsconfig.json",
      "Fast-fail NoSupportedFileError boundary if no source files exist",
    ],
    codeLanguage: "typescript",
    codeSnippet: `// Step 0 & Step 1: Normalization & Discovery
repositoryPath = path.resolve(repositoryPath);

const { sourceFiles, packageJsonFiles, tsconfigJsonFiles } = 
  await getRepositoryFiles(repositoryPath);

if (sourceFiles.length === 0) {
  throw new NoSupportedFileError(repositoryPath);
}`,
    errorHandling:
      "Throws NoSupportedFileError if no supported JS/TS files are discovered, preventing downstream processing of empty repositories.",
  },
  {
    id: "step-2",
    stepNumber: "02",
    title: "Metadata & Path Alias Extraction",
    subtitle: "Workspace manifest and compiler options parsing",
    input: "packageJsonFiles[], tsconfigJsonFiles[], jsconfigJsonFiles[]",
    output: "RepositoryMetadata { packageJsons: ParsedPackageJson[], pathConfigs: ParsedPathConfig[] }",
    description:
      "Extracts dependency manifests from package.json (dependencies, devDependencies, peerDependencies) and compiler path mappings from tsconfig.json / jsconfig.json (baseUrl, paths). These metadata records are passed to the relationship resolution stage to accurately resolve non-relative module aliases (e.g., '@/components/*').",
    keyConcepts: [
      "PackageJsonExtractor: name, version, declared dependencies",
      "PathConfigExtractor: tsconfig/jsconfig baseUrl & paths",
      "Multi-package / monorepo path mapping consolidation",
    ],
    codeLanguage: "typescript",
    codeSnippet: `// Step 2: Metadata Extraction
const packageJsons = packageJsonFiles.map(file => 
  PackageJsonExtractor.extract(file)
);

const pathConfigs = [...tsconfigJsonFiles, ...jsconfigJsonFiles].map(file => 
  PathConfigExtractor.extract(file)
);

const metadata: RepositoryMetadata = { packageJsons, pathConfigs };`,
    errorHandling:
      "Malformed JSON files are safely parsed with fallback defaults without halting the parsing of remaining configuration files.",
  },
  {
    id: "step-3",
    stepNumber: "03",
    title: "AST Generation (Babel Parser)",
    subtitle: "Isolated ECMAScript & TypeScript AST generation",
    input: "sourceFiles: string[]",
    output: "ParsedFile[] { filePath, ast, symbols: [], exports: [] } & ParseFailure[]",
    description:
      "Each source file is read from disk and processed with @babel/parser. The parser is configured with a comprehensive plugin set supporting modern TypeScript, JSX, class properties, private methods, decorators, dynamic imports, and top-level await. Parse failures are isolated into a failures array so a single invalid syntax file does not crash analysis.",
    keyConcepts: [
      "Source type: 'module' with TS/JSX/Decorators plugins",
      "Error isolation: ParseFailure[] preserves partial repository analysis",
      "Zero-mutation raw AST preservation for two traversal passes",
    ],
    codeLanguage: "typescript",
    codeSnippet: `// Step 3: Isolated AST Generation
const parsedFiles: ParsedFile[] = [];
const failures: ParseFailure[] = [];

for (const filePath of sourceFiles) {
  try {
    const code = fs.readFileSync(filePath, "utf-8");
    const ast = babelParse(code, {
      sourceType: "module",
      plugins: ["typescript", "jsx", "decorators", "classProperties", "topLevelAwait"]
    });
    parsedFiles.push({ filePath, ast, symbols: [], exports: [] });
  } catch (error) {
    failures.push({ filePath, message: error.message, cause: error });
  }
}`,
    errorHandling:
      "Per-file try-catch records ParseFailure objects with line numbers and messages, allowing the pipeline to analyze the rest of the codebase.",
  },
  {
    id: "step-4",
    stepNumber: "04",
    title: "Pass 1: Code Entity Extraction",
    subtitle: "Lexical symbol hierarchy & export mapping",
    input: "ParsedFile[] with raw ASTs",
    output: "Mutated ParsedFile[] with populated .symbols and .exports",
    description:
      "The first AST traversal pass identifies every structural code entity: functions, classes, variables, interfaces, type aliases, enums, class methods, and object properties. An internal symbolStack tracks lexical nesting context, automatically assigning parentSymbolId to nested entities (e.g., methods inside classes) without constructing ad-hoc tree structures.",
    keyConcepts: [
      "Lexical symbolStack: O(1) push/pop container visitor",
      "Parent-child linkage: parentSymbolId tracking",
      "Export registration: Named, default, and re-exports indexed",
      "8 distinct SymbolKind types registered with exact span coordinates",
    ],
    codeLanguage: "typescript",
    codeSnippet: `// Step 4: Symbol Extractor Pass
const symbolExtractor = new SymbolExtractor();

for (const parsedFile of parsedFiles) {
  // Walks AST, tracks symbolStack, populates symbols and exports
  symbolExtractor.extract(parsedFile);
}

// Result: parsedFile.symbols populated with:
// { id, name, kind, filePath, startLine, startColumn, parentSymbolId }`,
    errorHandling:
      "Anonymous expressions without identifiers are safely resolved or scoped to their assigned variable binding.",
  },
  {
    id: "step-5",
    stepNumber: "05",
    title: "Pass 2: Relationship Extraction",
    subtitle: "Cross-file binding resolution & edge mapping",
    input: "ParsedFile[] (with populated symbols) + RepositoryMetadata",
    output: "ParsedRelationship[] { id, sourceId, targetId, type, metadata }",
    description:
      "With all symbols across all files fully indexed in Pass 1, the second AST pass discovers how entities interact. It resolves function and method calls (direct and member expressions), imports, exports, class inheritance (extends), interface implementation (implements), and instantiations. Deterministic edge IDs (${sourceId}:${type}:${targetId}) prevent duplicate edges.",
    keyConcepts: [
      "Babel scope binding resolution: path.scope.getBinding()",
      "Member expression resolution: X.foo() mapped to X's parent symbol",
      "Alias resolution: tsconfig paths mapped to absolute target file paths",
      "6 Relationship types: calls, imports, exports, extends, implements, instantiates",
    ],
    codeLanguage: "typescript",
    codeSnippet: `// Step 5: Relationship Extraction Pass
const relationshipExtractor = new RelationshipExtractor();

const relationships = relationshipExtractor.extract(
  parsedFiles,
  metadata
);

// Deterministic ID generation prevents duplicate multi-edges:
// const id = \`\${sourceId}:\${type}:\${targetId}\`;`,
    errorHandling:
      "Unresolvable external packages or dynamic compute calls (e.g., obj[computed]()) are skipped gracefully without breaking graph consistency.",
  },
  {
    id: "step-6",
    stepNumber: "06",
    title: "Graph Construction & Analytics Engine",
    subtitle: "In-memory 5-map index assembly & health metrics",
    input: "ParsedRepository { files, relationships, metadata }",
    output: "Immutable Graph instance + HealthIndex analytics",
    description:
      "The GraphBuilder transforms raw parsed data into a high-performance in-memory graph with five synchronized lookup maps. Once validated, the AnalysisEngine runs graph traversal, Tarjan's SCC cycle analysis, Kahn's topological sort for initialization ordering, reverse impact tracing, and composite health metric calculation.",
    keyConcepts: [
      "5 O(1) indexed maps: nodes, edges, incomingEdges, outgoingEdges, nodesByType",
      "Two-phase validation: node existence and bidirectional index integrity",
      "Stateless analyzers: Tarjan SCC, Kahn Toposort, BFS Impact, Call Path DFS",
      "Composite Health Score (0-100) calculated across 6 architectural dimensions",
    ],
    codeLanguage: "typescript",
    codeSnippet: `// Step 6: Graph Builder & Analysis Engine
const graph = new GraphBuilder().build(parsedRepository);

// Wire Analysis Engine
const analysisEngine = new AnalysisEngine(graph);
const cycles = analysisEngine.analyzeCycles();
const impact = analysisEngine.analyzeImpact("symbol-id");
const ordering = analysisEngine.analyzeDependencyOrdering("file-id");

// Compute Health Index
const health = new HealthIndexCalculator(graph).calculate();`,
    errorHandling:
      "Graph validation guarantees that every directed edge references valid existing source and target nodes before analysis runs.",
  },
];

const ENTITY_KINDS = [
  { kind: "function", babel: "FunctionDeclaration, ArrowFunction, FunctionExpression", desc: "Top-level or nested functions" },
  { kind: "class", babel: "ClassDeclaration, ClassExpression", desc: "ES6 / TypeScript classes" },
  { kind: "method", babel: "ClassMethod, ClassPrivateMethod, ObjectMethod", desc: "Instance, static, and private class methods" },
  { kind: "variable", babel: "VariableDeclarator", desc: "Constants, state bindings, and variables" },
  { kind: "interface", babel: "TSInterfaceDeclaration", desc: "TypeScript interface contracts" },
  { kind: "typeAlias", babel: "TSTypeAliasDeclaration", desc: "TypeScript type definitions" },
  { kind: "enum", babel: "TSEnumDeclaration", desc: "TypeScript enumerated constants" },
  { kind: "objectProperty", babel: "ObjectProperty", desc: "Declared object literal fields" },
];

const RELATIONSHIP_TYPES = [
  { type: "calls", source: "Function / Method", target: "Function / Method", desc: "Direct identifier calls and member expression invocations" },
  { type: "imports", source: "File / Module", target: "File / External Package", desc: "Static ES import statements and dynamic import calls" },
  { type: "exports", source: "File / Module", target: "Code Entity", desc: "Named, default, or re-exported declarations" },
  { type: "extends", source: "Class / Interface", target: "Class / Interface", desc: "Single inheritance hierarchy between classes or interfaces" },
  { type: "implements", source: "Class", target: "Interface", desc: "Class interface conformance constraints" },
  { type: "instantiates", source: "Function / Method", target: "Class", desc: "Constructor invocation via new Keyword" },
];

export default function HowItWorksPage() {
  const [activeStepId, setActiveStepId] = useState<string>("step-1");
  const [copiedCode, setCopiedCode] = useState(false);

  const activeStep = PIPELINE_STEPS.find((s) => s.id === activeStepId) || PIPELINE_STEPS[0];

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* ─── Header ─── */}
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-2 text-muted text-xs font-mono mb-2">
          <Workflow size={14} className="text-accent" />
          <span>SYSTEM ARCHITECTURE & INGESTION PIPELINE</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground tracking-tight">
          How CodeGraph Works
        </h1>
        <p className="text-sm md:text-base text-muted mt-2 max-w-3xl leading-relaxed">
          CodeGraph is a static code intelligence engine for JavaScript and TypeScript repositories.
          It uses a deterministic, two-pass Abstract Syntax Tree (AST) pipeline to parse, scope, link,
          and analyze codebases into high-performance graph structures.
        </p>
      </div>

      {/* ─── Architecture Highlights Bar ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-lg border border-border bg-surface">
          <div className="flex items-center gap-2 text-xs font-mono text-muted mb-1">
            <Code2 size={13} className="text-accent" />
            <span>AST PARSER</span>
          </div>
          <div className="text-sm font-semibold text-foreground">@babel/parser</div>
          <div className="text-xs text-subtle mt-0.5">TS 5.x & ECMAScript 2024</div>
        </div>

        <div className="p-4 rounded-lg border border-border bg-surface">
          <div className="flex items-center gap-2 text-xs font-mono text-muted mb-1">
            <Layers size={13} className="text-accent" />
            <span>TRAVERSAL MODE</span>
          </div>
          <div className="text-sm font-semibold text-foreground">2-Pass Deterministic</div>
          <div className="text-xs text-subtle mt-0.5">Entity indexing then linking</div>
        </div>

        <div className="p-4 rounded-lg border border-border bg-surface">
          <div className="flex items-center gap-2 text-xs font-mono text-muted mb-1">
            <Network size={13} className="text-accent" />
            <span>GRAPH MODEL</span>
          </div>
          <div className="text-sm font-semibold text-foreground">5-Map O(1) Adjacency</div>
          <div className="text-xs text-subtle mt-0.5">Fast incoming & outgoing index</div>
        </div>

        <div className="p-4 rounded-lg border border-border bg-surface">
          <div className="flex items-center gap-2 text-xs font-mono text-muted mb-1">
            <Activity size={13} className="text-accent" />
            <span>ANALYTICS ENGINE</span>
          </div>
          <div className="text-sm font-semibold text-foreground">6 Health Dimensions</div>
          <div className="text-xs text-subtle mt-0.5">Tarjan, Kahn, BFS, DFS</div>
        </div>
      </div>

      {/* ─── Interactive Sequential Ingestion Pipeline ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-heading text-foreground">
              Sequential Ingestion Pipeline
            </h2>
            <p className="text-xs text-muted">
              Select a stage to inspect its data contract, transformation logic, and AST strategy.
            </p>
          </div>
          <span className="text-xs font-mono text-muted bg-surface-elevated px-2.5 py-1 rounded border border-border">
            6 Sequential Stages
          </span>
        </div>

        {/* Step Navigation Pill Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {PIPELINE_STEPS.map((step) => {
            const isActive = step.id === activeStepId;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStepId(step.id)}
                className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  isActive
                    ? "bg-surface-elevated border-accent text-foreground shadow-sm ring-1 ring-accent/20"
                    : "bg-surface border-border text-muted hover:border-border-highlight hover:text-foreground"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span
                    className={`font-mono text-xs font-bold ${
                      isActive ? "text-accent" : "text-subtle"
                    }`}
                  >
                    {step.stepNumber}
                  </span>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  )}
                </div>
                <div className="text-xs font-medium line-clamp-1 leading-snug">
                  {step.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Stage Detail Panel */}
        <div className="rounded-xl border border-border bg-surface p-5 md:p-6 space-y-6">
          {/* Stage Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border pb-5">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs text-muted mb-1">
                <span className="px-2 py-0.5 rounded bg-surface-elevated border border-border text-foreground font-semibold">
                  STAGE {activeStep.stepNumber}
                </span>
                <span>{activeStep.subtitle}</span>
              </div>
              <h3 className="text-xl font-bold font-heading text-foreground mt-1">
                {activeStep.title}
              </h3>
              <p className="text-sm text-muted mt-2 max-w-3xl leading-relaxed">
                {activeStep.description}
              </p>
            </div>
          </div>

          {/* I/O Contracts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-lg border border-border bg-surface-elevated/40">
              <span className="text-[11px] font-mono uppercase tracking-wider text-subtle font-semibold block mb-1">
                Input Data Contract
              </span>
              <code className="text-xs font-mono text-foreground break-all">
                {activeStep.input}
              </code>
            </div>
            <div className="p-3.5 rounded-lg border border-border bg-surface-elevated/40">
              <span className="text-[11px] font-mono uppercase tracking-wider text-subtle font-semibold block mb-1">
                Output Data Contract
              </span>
              <code className="text-xs font-mono text-foreground break-all">
                {activeStep.output}
              </code>
            </div>
          </div>

          {/* Key Mechanisms & Code Implementation */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Key Invariants & Error Handling */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-muted font-semibold mb-3">
                  Core Invariants & Mechanics
                </h4>
                <ul className="space-y-2">
                  {activeStep.keyConcepts.map((concept, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-muted">
                      <CheckCircle2
                        size={14}
                        className="text-accent shrink-0 mt-0.5"
                      />
                      <span>{concept}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-lg border border-border bg-surface-elevated/60 text-xs">
                <div className="flex items-center gap-1.5 font-mono text-muted text-[11px] font-semibold mb-1">
                  <AlertTriangle size={13} className="text-warning" />
                  <span>FAULT ISOLATION BOUNDARY</span>
                </div>
                <p className="text-muted leading-relaxed">
                  {activeStep.errorHandling}
                </p>
              </div>
            </div>

            {/* Right: Code Snippet */}
            <div className="lg:col-span-7 rounded-lg border border-border bg-background overflow-hidden">
              <div className="flex items-center justify-between px-3.5 py-2 border-b border-border bg-surface-elevated/50">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-border-highlight" />
                  <span className="text-[11px] font-mono text-muted">
                    engine_pipeline_{activeStep.stepNumber}.ts
                  </span>
                </div>
                <button
                  onClick={() => handleCopyCode(activeStep.codeSnippet)}
                  className="flex items-center gap-1 text-[11px] font-mono text-muted hover:text-foreground transition-colors"
                >
                  {copiedCode ? (
                    <>
                      <Check size={12} className="text-success" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-foreground/90 overflow-x-auto leading-relaxed">
                <code>{activeStep.codeSnippet}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Architectural Pillars ─── */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-bold font-heading text-foreground">
          Architectural Design Principles
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl border border-border bg-surface space-y-3">
            <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-accent">
              <Layers size={16} />
            </div>
            <h3 className="text-base font-bold font-heading text-foreground">
              Why Two AST Traversal Passes?
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Single-pass AST parsers fail when a file calls a function declared later in the file
              or imported from an unparsed file. CodeGraph guarantees 100% resolution accuracy by
              first indexing all declarations repository-wide in <span className="text-foreground font-mono">Pass 1</span>,
              and only resolving call bindings, member expressions, and type extensions in <span className="text-foreground font-mono">Pass 2</span>.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-surface space-y-3">
            <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-accent">
              <Network size={16} />
            </div>
            <h3 className="text-base font-bold font-heading text-foreground">
              5-Map O(1) In-Memory Graph Model
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              The internal graph maintains five synchronized hash maps: <code className="text-foreground font-mono">nodes</code>,{" "}
              <code className="text-foreground font-mono">edges</code>,{" "}
              <code className="text-foreground font-mono">incomingEdges</code>,{" "}
              <code className="text-foreground font-mono">outgoingEdges</code>, and{" "}
              <code className="text-foreground font-mono">nodesByType</code>. This guarantees O(1) edge lookups during high-frequency BFS traversals, blast-radius queries, and cycle scans.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-surface space-y-3">
            <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-accent">
              <Cpu size={16} />
            </div>
            <h3 className="text-base font-bold font-heading text-foreground">
              Lexical Scope Stack Engine
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Symbol hierarchy is maintained via an explicit <code className="text-foreground font-mono">symbolStack: ParsedSymbol[]</code>.
              When traversing into functions, classes, or methods, symbols are pushed with an entry visitor and popped with an exit visitor.
              Children automatically receive the top of the stack as their <code className="text-foreground font-mono">parentSymbolId</code>.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-surface space-y-3">
            <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-accent">
              <Compass size={16} />
            </div>
            <h3 className="text-base font-bold font-heading text-foreground">
              Deterministic Edge Identification
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Every directed edge has an immutable, deterministic key:{" "}
              <code className="text-foreground font-mono text-[11px]">${"{sourceId}:${type}:${targetId}"}</code>.
              This prevents duplicate multi-edges between identical symbols, guarantees idempotency during incremental graph re-computations, and stabilizes topological orderings.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Entity & Relationship Reference Tables ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        {/* Entity Extraction Taxonomy */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-heading text-foreground">
              Code Entity Taxonomy (Pass 1)
            </h3>
            <span className="text-[11px] font-mono text-muted">8 Registered Kinds</span>
          </div>
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="divide-y divide-border text-xs">
              {ENTITY_KINDS.map((entity) => (
                <div
                  key={entity.kind}
                  className="p-3 flex items-start justify-between gap-3 hover:bg-surface-elevated/40 transition-colors"
                >
                  <div className="space-y-0.5">
                    <span className="font-mono font-semibold text-accent text-xs">
                      {entity.kind}
                    </span>
                    <p className="text-muted text-[11px]">{entity.desc}</p>
                  </div>
                  <code className="text-[10px] font-mono text-subtle bg-surface-elevated px-2 py-0.5 rounded border border-border shrink-0 max-w-[180px] truncate text-right">
                    {entity.babel}
                  </code>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Relationship Taxonomy */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-heading text-foreground">
              Directed Relationship Edges (Pass 2)
            </h3>
            <span className="text-[11px] font-mono text-muted">6 Edge Types</span>
          </div>
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="divide-y divide-border text-xs">
              {RELATIONSHIP_TYPES.map((rel) => (
                <div
                  key={rel.type}
                  className="p-3 flex items-start justify-between gap-3 hover:bg-surface-elevated/40 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-semibold text-foreground text-xs">
                        {rel.type}
                      </span>
                      <span className="text-[10px] font-mono text-subtle">
                        ({rel.source} → {rel.target})
                      </span>
                    </div>
                    <p className="text-muted text-[11px]">{rel.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Bottom Navigation Link to Algorithms & Docs ─── */}
      <div className="p-6 rounded-xl border border-border bg-surface-elevated/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold font-heading text-foreground">
            Explore Graph Algorithms & Health Index
          </h3>
          <p className="text-xs text-muted mt-1 max-w-2xl">
            Learn how Tarjan&apos;s SCC, Kahn&apos;s Topological Sort, BFS Impact Analysis, and Fan-In/Fan-Out metrics operate over the in-memory graph. For extensive technical documentation and architecture specifications, check out our docs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/dashboard/algorithms"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background font-medium text-xs hover:bg-white transition-colors"
          >
            <span>Algorithms Deep Dive</span>
            <ArrowRight size={13} />
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-surface text-foreground font-medium text-xs hover:border-border-highlight transition-colors"
          >
            <span>Docs</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}

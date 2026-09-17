export interface DocItem {
  id: string;
  title: string;
  number: string;
  href: string;
  summary: string;
  subtopics?: DocItem[];
}

export interface DocSection {
  id: string;
  title: string;
  number: string;
  summary: string;
  items: DocItem[];
}

export const DOCS_NAVIGATION: DocSection[] = [
  {
    id: "introduction",
    title: "Introduction",
    number: "1",
    summary: "High-level overview, core architecture concepts, and getting started with CodeGraph.",
    items: [
      {
        id: "what-is-codegraph",
        title: "What is CodeGraph?",
        number: "1.1",
        href: "/docs/introduction/what-is-codegraph",
        summary: "Deterministic static analysis engine and code graph representation for JavaScript/TypeScript repositories.",
      },
      {
        id: "getting-started",
        title: "Getting Started",
        number: "1.2",
        href: "/docs/introduction/getting-started",
        summary: "How repositories enter the pipeline, background analysis processing, and querying graph intelligence.",
      },
    ],
  },
  {
    id: "architecture",
    title: "Architecture & Pipeline",
    number: "2",
    summary: "The 5-stage transformation pipeline from raw source files to typed entities and relationships.",
    items: [
      {
        id: "system-overview",
        title: "System Overview",
        number: "2.1",
        href: "/docs/architecture/system-overview",
        summary: "The sequential 5-stage transformation pipeline and multi-pass AST architecture.",
      },
      {
        id: "repository-discovery",
        title: "Repository Discovery",
        number: "2.2",
        href: "/docs/architecture/repository-discovery",
        summary: "Filesystem traversal, file categorization, directory exclusion, and path normalization.",
      },
      {
        id: "ast-generation",
        title: "AST Generation & Parsing",
        number: "2.3",
        href: "/docs/architecture/ast-generation",
        summary: "Babel parser integration, modern syntax plugins, and error-tolerant parsing guarantees.",
      },
      {
        id: "metadata-extraction",
        title: "Metadata Extraction",
        number: "2.4",
        href: "/docs/architecture/metadata-extraction",
        summary: "Parsing package.json and tsconfig/jsconfig paths using comment-tolerant JSONC parsing.",
      },
      {
        id: "symbol-extraction",
        title: "Symbol Extraction",
        number: "2.5",
        href: "/docs/architecture/symbol-extraction",
        summary: "Extracting declarations, container scopes, parent pointers, and export mappings.",
        subtopics: [
          {
            id: "symbol-scoping",
            title: "Symbol Stack & Scoping Hierarchy",
            number: "2.5.1",
            href: "/docs/architecture/symbol-extraction/scoping",
            summary: "Managing container nesting via symbolStack and deterministic ID generation.",
          },
          {
            id: "symbol-functions",
            title: "Functions & Arrow Functions",
            number: "2.5.2",
            href: "/docs/architecture/symbol-extraction/functions",
            summary: "Function declarations, expressions, arrow functions, and double-extraction guards.",
          },
          {
            id: "symbol-classes",
            title: "Classes & Methods",
            number: "2.5.3",
            href: "/docs/architecture/symbol-extraction/classes",
            summary: "Class declarations, private class methods (#field), getters, setters, and method kinds.",
          },
          {
            id: "symbol-variables",
            title: "Variables & Destructuring Patterns",
            number: "2.5.4",
            href: "/docs/architecture/symbol-extraction/variables",
            summary: "Handling identifiers, ObjectPattern aliases, ArrayPatterns, and object literal containers.",
          },
          {
            id: "symbol-types",
            title: "TypeScript Type Declarations",
            number: "2.5.5",
            href: "/docs/architecture/symbol-extraction/types",
            summary: "Extraction of interfaces, type aliases, and enums without runtime bindings.",
          },
          {
            id: "symbol-objects",
            title: "Object Properties & Methods",
            number: "2.5.6",
            href: "/docs/architecture/symbol-extraction/objects",
            summary: "Object literals, method properties, nested object hierarchies, and property extraction.",
          },
        ],
      },
      {
        id: "relationship-extraction",
        title: "Relationship Extraction",
        number: "2.6",
        href: "/docs/architecture/relationship-extraction",
        summary: "Second-pass AST analysis discovering call edges, inheritance, instantiations, and module imports.",
        subtopics: [
          {
            id: "relationship-calls",
            title: "Call Graph Resolution",
            number: "2.6.1",
            href: "/docs/architecture/relationship-extraction/calls",
            summary: "Direct identifier calls, member expressions X.foo(), this.foo(), and cross-file calls.",
          },
          {
            id: "relationship-inheritance",
            title: "Inheritance & Implementation",
            number: "2.6.2",
            href: "/docs/architecture/relationship-extraction/inheritance",
            summary: "Resolving class extends superclasses and TypeScript implements interfaces.",
          },
          {
            id: "relationship-instantiations",
            title: "Instantiation Resolution",
            number: "2.6.3",
            href: "/docs/architecture/relationship-extraction/instantiations",
            summary: "Tracking constructor new expressions in variable assignments and return statements.",
          },
          {
            id: "relationship-imports",
            title: "Import Resolution & 5-Step Waterfall",
            number: "2.6.4",
            href: "/docs/architecture/relationship-extraction/imports",
            summary: "Relative paths, path aliases (@/*), external dependencies, and extension resolution waterfall.",
          },
          {
            id: "relationship-exports",
            title: "Export Mapping & Specifiers",
            number: "2.6.5",
            href: "/docs/architecture/relationship-extraction/exports",
            summary: "Named declarations, specifier aliases (export { a as b }), and default export resolution.",
          },
        ],
      },
    ],
  },
  {
    id: "graph-model",
    title: "Canonical Graph Model",
    number: "3",
    summary: "The 5-map in-memory graph structure, invariants, graph query facade, and serialization.",
    items: [
      {
        id: "data-structure",
        title: "Graph Data Structure",
        number: "3.1",
        href: "/docs/graph-model/data-structure",
        summary: "The 5 synchronized in-memory maps, node kinds, edge models, and prefixed ID conventions.",
      },
      {
        id: "graph-builder",
        title: "Graph Construction & Validation",
        number: "3.2",
        href: "/docs/graph-model/graph-builder",
        summary: "5-phase assembly order, silent deduplication, and referential integrity validation.",
      },
      {
        id: "graph-query",
        title: "Graph Query Layer",
        number: "3.3",
        href: "/docs/graph-model/graph-query",
        summary: "Single-hop typed query facade for callers, callees, importers, subclasses, and dependencies.",
      },
      {
        id: "persistence",
        title: "Persistence & Serialization",
        number: "3.4",
        href: "/docs/graph-model/persistence",
        summary: "Serialization format to JSON and deserialization restoring all 5 indexing maps and sets.",
      },
    ],
  },
  {
    id: "analytics",
    title: "Analytics Suite",
    number: "4",
    summary: "Graph analysis engine answering upstream impact, downstream dependencies, cycles, and connectivity.",
    items: [
      {
        id: "analytics-overview",
        title: "Engine Architecture",
        number: "4.1",
        href: "/docs/analytics/overview",
        summary: "AnalysisEngine facade wiring stateless analyzers with read-only graph guarantees.",
      },
      {
        id: "traversal",
        title: "Graph Traversal Primitive",
        number: "4.2",
        href: "/docs/analytics/traversal",
        summary: "Iterative BFS primitive with queue-pointer indexing and bidirectional edge switching.",
      },
      {
        id: "impact-analysis",
        title: "Impact Analysis (Upstream)",
        number: "4.3",
        href: "/docs/analytics/impact-analysis",
        summary: "Answering 'Who depends on X?' by walking incoming structural edges backward.",
      },
      {
        id: "dependency-analysis",
        title: "Dependency Analysis (Downstream)",
        number: "4.4",
        href: "/docs/analytics/dependency-analysis",
        summary: "Answering 'What does X need?' by walking outgoing structural edges forward.",
      },
      {
        id: "cycle-analysis",
        title: "Circular Dependency Analysis",
        number: "4.5",
        href: "/docs/analytics/cycle-analysis",
        summary: "Global cycle detection across 5 isolated projections using Tarjan's SCC algorithm.",
      },
      {
        id: "ordering-analysis",
        title: "Dependency Ordering (Toposort)",
        number: "4.6",
        href: "/docs/analytics/ordering-analysis",
        summary: "Initialization sequence ordering via DFS subgraph collection and Kahn's algorithm.",
      },
      {
        id: "connectivity-analysis",
        title: "Connectivity & Degree Analysis",
        number: "4.7",
        href: "/docs/analytics/connectivity-analysis",
        summary: "O(1) fan-in/fan-out degree metrics, God node detection, and instability calculation.",
      },
      {
        id: "call-path-analysis",
        title: "Call Path Reachability",
        number: "4.8",
        href: "/docs/analytics/call-path-analysis",
        summary: "Point-to-point call chain discovery using iterative DFS and parent backtracking.",
      },
      {
        id: "dead-code-detection",
        title: "Dead Code Detection Architecture",
        number: "4.9",
        href: "/docs/analytics/dead-code-detection",
        summary: "Analysis of entry-point ambiguity, framework wiring, and external tooling integration (Knip).",
      },
    ],
  },
  {
    id: "algorithms",
    title: "Algorithmic Foundations",
    number: "5",
    summary: "Deep dive into the core DSA algorithms powering CodeGraph and their specific adaptations.",
    items: [
      {
        id: "bfs-traversal",
        title: "Iterative Breadth-First Search",
        number: "5.1",
        href: "/docs/algorithms/bfs-traversal",
        summary: "Queue-pointer array implementation ensuring O(1) dequeue and shortest-hop guarantees.",
      },
      {
        id: "tarjan-scc",
        title: "Tarjan's Strongly Connected Components",
        number: "5.2",
        href: "/docs/algorithms/tarjan-scc",
        summary: "Single-pass O(V+E) discovery indices, lowLink tracking, and projection filtering.",
      },
      {
        id: "kahns-toposort",
        title: "Kahn's Topological Sort",
        number: "5.3",
        href: "/docs/algorithms/kahns-toposort",
        summary: "Indegree resolution with dependency graph inversion and cycle detectability.",
      },
      {
        id: "dfs-paths",
        title: "Iterative Depth-First Search",
        number: "5.4",
        href: "/docs/algorithms/dfs-paths",
        summary: "Explicit stack management with O(V) parent map backtracking for point-to-point paths.",
      },
    ],
  },
  {
    id: "health",
    title: "Health Index & Structural Metrics",
    number: "6",
    summary: "The 6 structural graph metrics, continuous normalization curves, RMS math, and weighted scoring.",
    items: [
      {
        id: "health-overview",
        title: "Health Index & Scoring Formula",
        number: "6.1",
        href: "/docs/health/overview",
        summary: "Three-phase pipeline (Measure -> Normalize -> Aggregate), weights, and interpretation guide.",
      },
      {
        id: "cycle-health",
        title: "Cycle Health (28%)",
        number: "6.2",
        href: "/docs/health/cycle-health",
        summary: "Measuring file/symbol participation in circular dependencies with 10% risk cap.",
      },
      {
        id: "coupling-health",
        title: "Coupling Health (23%)",
        number: "6.3",
        href: "/docs/health/coupling-health",
        summary: "Average structural degree (fan-in + fan-out) and reciprocal decay normalization.",
      },
      {
        id: "fan-out-health",
        title: "Fan-Out Health & RMS (18%)",
        number: "6.4",
        href: "/docs/health/fan-out-health",
        summary: "Root Mean Square (RMS) outgoing connectivity to penalize architectural hotspot outliers.",
      },
      {
        id: "fan-in-health",
        title: "Fan-In Health & RMS (14%)",
        number: "6.5",
        href: "/docs/health/fan-in-health",
        summary: "Root Mean Square (RMS) incoming concentration to evaluate high-blast-radius hub symbols.",
      },
      {
        id: "dependency-health",
        title: "External Dependency Health (10%)",
        number: "6.6",
        href: "/docs/health/dependency-health",
        summary: "External npm dependency density per file and external blast radius.",
      },
      {
        id: "module-health",
        title: "Module Isolation Health (7%)",
        number: "6.7",
        href: "/docs/health/module-health",
        summary: "Proportion of unresolved module nodes (built-ins) relative to total graph nodes.",
      },
    ],
  },
  {
    id: "reference",
    title: "Technical Reference",
    number: "7",
    summary: "Complete node kinds, relationship edges, supported syntax extensions, and REST API specification.",
    items: [
      {
        id: "supported-languages",
        title: "Supported Languages & Syntax",
        number: "7.1",
        href: "/docs/reference/supported-languages",
        summary: "Supported extensions (.ts, .tsx, .js, .jsx) and Babel compiler plugins.",
      },
      {
        id: "node-types",
        title: "Code Entities & Node Types",
        number: "7.2",
        href: "/docs/reference/node-types",
        summary: "TypeScript interfaces for FileNode, SymbolNode, DependencyNode, and ModuleNode.",
      },
      {
        id: "relationship-types",
        title: "Relationship Kinds & Edges",
        number: "7.3",
        href: "/docs/reference/relationship-types",
        summary: "Specification of calls, imports, exports, extends, implements, instantiates, and references.",
      },
      {
        id: "api",
        title: "REST API & Integration Schema",
        number: "7.4",
        href: "/docs/reference/api",
        summary: "Complete HTTP endpoints for repository ingestion, graph serialization, and analysis queries.",
      },
    ],
  },
];

export function findDocItemByHref(href: string): { item: DocItem; section: DocSection; prev?: DocItem; next?: DocItem } | undefined {
  const allItems: { item: DocItem; section: DocSection }[] = [];

  for (const section of DOCS_NAVIGATION) {
    for (const item of section.items) {
      allItems.push({ item, section });
      if (item.subtopics) {
        for (const sub of item.subtopics) {
          allItems.push({ item: sub, section });
        }
      }
    }
  }

  const index = allItems.findIndex((entry) => entry.item.href === href);
  if (index === -1) return undefined;

  const current = allItems[index];
  const prev = index > 0 ? allItems[index - 1].item : undefined;
  const next = index < allItems.length - 1 ? allItems[index + 1].item : undefined;

  return {
    item: current.item,
    section: current.section,
    prev,
    next,
  };
}

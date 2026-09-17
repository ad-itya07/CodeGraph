"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Compass,
  Boxes,
  Server,
  Layers,
  FileCode2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Network,
  Zap,
  BookOpen,
} from "lucide-react";

interface Archetype {
  id: string;
  name: string;
  category: string;
  tagline: string;
  icon: typeof Boxes;
  overview: string;
  topologyTraits: string[];
  hotspots: string[];
  recommendedTraversals: {
    name: string;
    description: string;
  }[];
}

const ARCHETYPES: Archetype[] = [
  {
    id: "monorepo",
    name: "Full-Stack Monorepo",
    category: "Multi-Package Workspace (Turborepo / Nx / Lerna)",
    tagline: "Multi-package graphs with shared internal libraries and cross-app dependencies.",
    icon: Boxes,
    overview:
      "Monorepos contain multiple client applications, backend services, and shared packages (e.g., UI libraries, shared utils). Their dependency graphs feature clusters around core libraries with cross-package import boundaries governed by tsconfig paths and workspace manifests.",
    topologyTraits: [
      "Clustered multi-root graph structure spanning application entry points and shared workspace packages",
      "High Afferent Coupling (Ca) on central utility and design system packages consumed across multiple apps",
      "Deep dependency trees traversing from application roots down to foundational packages",
    ],
    hotspots: [
      "Cross-package circular imports via shared type definitions or barrel re-exports",
      "Leaky package abstractions where internal implementation files bypass package exports",
      "Transitive dependency chaining where modifying a leaf utility triggers wide downstream rebuilds",
    ],
    recommendedTraversals: [
      {
        name: "Kahn's Topological Sort",
        description: "Analyze inter-package dependency ordering to detect cyclic build dependencies.",
      },
      {
        name: "Tarjan's SCC Cycle Analysis",
        description: "Identify multi-file circular dependency loops across workspace boundaries.",
      },
      {
        name: "Reverse Impact BFS",
        description: "Trace the blast radius of modifying a foundational shared UI or utility component.",
      },
    ],
  },
  {
    id: "backend-api",
    name: "Layered Backend API",
    category: "Microservice / Monolith (Express / Fastify / NestJS)",
    tagline: "Vertical stratified architecture from routing controllers down to data models.",
    icon: Server,
    overview:
      "Backend API codebases typically follow a stratified architecture: Routes → Controllers → Services → Repositories → Database Clients. Dependencies flow downwards, with database clients and configuration singletons acting as high fan-in hubs.",
    topologyTraits: [
      "Vertical hierarchical stratification with minimal horizontal coupling between unrelated domain modules",
      "High Afferent Coupling (Ca) on database pools, ORM models, and configuration singletons",
      "Balanced Fan-Out on controllers delegating business logic to domain services and repositories",
    ],
    hotspots: [
      "Mutual circular references between domain services calling each other instead of using an orchestrator",
      "High blast-radius risk on core database schemas, shared middlewares, and utility helpers",
      "God-object service classes aggregating too many responsibilities with excessive Fan-Out",
    ],
    recommendedTraversals: [
      {
        name: "Impact Analysis (Backward BFS)",
        description: "Determine every API route and handler affected when altering a core database model.",
      },
      {
        name: "Call Path DFS",
        description: "Trace the exact call execution chain from an HTTP endpoint handler down to database queries.",
      },
      {
        name: "Fan-In Anomaly Detection",
        description: "Identify high-traffic singleton services that represent central failure points.",
      },
    ],
  },
  {
    id: "frontend-app",
    name: "Component-Driven Web App",
    category: "Modern Frontend (Next.js / React / Remix)",
    tagline: "Radial tree topologies spanning layout roots, interactive state hooks, and UI primitives.",
    icon: Layers,
    overview:
      "Modern React and Next.js applications branch outward from route pages and layout roots down to compound UI components, state management stores, and custom hooks. The graph topology is primarily tree-structured with heavy leaf reuse.",
    topologyTraits: [
      "Hierarchical component trees with high fan-in on design tokens and atomic primitives",
      "High Instability (I → 1) on route pages that orchestrate numerous child components",
      "Low Instability (I → 0) on atomic UI primitives, hooks, and immutable utility functions",
    ],
    hotspots: [
      "Barrel re-export loops where index.ts files inadvertently create circular dependencies across folders",
      "Deep prop-drilling chains creating long transitive dependency paths between distant components",
      "Tight coupling between presentation components and global state managers",
    ],
    recommendedTraversals: [
      {
        name: "Tarjan's SCC Cycle Analysis",
        description: "Detect circular dependencies between custom hooks, context providers, and UI components.",
      },
      {
        name: "Impact Analysis (Backward BFS)",
        description: "Trace all views and route pages affected by modifications to shared design primitives.",
      },
      {
        name: "Module Coupling Scans",
        description: "Measure cohesion within feature folders versus cross-feature coupling.",
      },
    ],
  },
  {
    id: "library-sdk",
    name: "Modular Library / SDK",
    category: "Zero-Dependency Utility / Engine",
    tagline: "Strict Directed Acyclic Graphs (DAG) with clean public facade APIs and zero circularity.",
    icon: FileCode2,
    overview:
      "Libraries and SDKs require strict architectural purity. Any circular dependency can break module loading or cause runtime undefined export errors. Topologies feature a clean public facade (index.ts) delegating into internal pure leaf algorithms.",
    topologyTraits: [
      "Strict Directed Acyclic Graph (DAG) structure with zero permissible circular references",
      "Isolated public export facade keeping internal utility helpers unexposed",
      "High proportion of pure leaf functions with zero outbound dependencies (Fan-Out = 0)",
    ],
    hotspots: [
      "Internal circular references between utility modules causing undefined exports in ESM builds",
      "Accidental export bloat exposing internal classes in the public package contract",
      "High efferent coupling on external dependencies that inflate bundle size",
    ],
    recommendedTraversals: [
      {
        name: "Zero-Cycle Verification",
        description: "Enforce strict acyclic structure across all export paths and internal modules via Tarjan's SCC.",
      },
      {
        name: "Dependency Ordering Analyzer",
        description: "Compute the optimal topological initialization sequence for internal modules via Kahn's algorithm.",
      },
      {
        name: "Coupling Health Inspection",
        description: "Verify that core algorithms maintain minimal afferent coupling to external packages.",
      },
    ],
  },
];

const PATTERNS = [
  {
    title: "Layered Dependency Rule",
    type: "Good Pattern",
    status: "positive",
    description: "High-level policy modules never import low-level detail modules directly; dependencies flow strictly in one direction towards stability.",
    analysis: "CodeGraph validates directional layering via Kahn's topological sort and forward/backward dependency analysis.",
  },
  {
    title: "Explicit Leaf Utilities",
    type: "Good Pattern",
    status: "positive",
    description: "Pure utility functions (math, formatting, validation) have Fan-Out = 0, depending only on primitive language types.",
    analysis: "CodeGraph identifies leaf modules with zero efferent coupling (Ce = 0), maximizing modular reusability.",
  },
  {
    title: "Curated Facade Exports",
    type: "Good Pattern",
    status: "positive",
    description: "Packages expose only explicit symbols through an entrypoint index, keeping internal implementation files encapsulated.",
    analysis: "CodeGraph tracks export visibility and ensures internal entities are not leaking across package boundaries.",
  },
  {
    title: "Barrel File Circular Loops",
    type: "Anti-Pattern",
    status: "negative",
    description: "Module A imports from index.ts, which re-exports Module B, which imports Module A. Creates hidden runtime undefined bugs.",
    analysis: "CodeGraph detects these cycles instantly via Tarjan's Strongly Connected Components algorithm.",
  },
  {
    title: "God Object Hub",
    type: "Anti-Pattern",
    status: "negative",
    description: "A single monolithic file accumulates excessive incoming and outgoing edges (high Fan-In and high Fan-Out).",
    analysis: "CodeGraph highlights fan-in/fan-out anomalies that represent fragile central failure points.",
  },
  {
    title: "Deep Transitive Coupling",
    type: "Anti-Pattern",
    status: "negative",
    description: "Long unbroken dependency chains where altering a distant leaf component ripples up through multiple layers.",
    analysis: "CodeGraph measures transitive blast radius and impact reachability via reverse BFS traversals.",
  },
];

export default function ExplorePage() {
  const [selectedArchetypeId, setSelectedArchetypeId] = useState<string>("monorepo");

  const selectedArchetype =
    ARCHETYPES.find((a) => a.id === selectedArchetypeId) || ARCHETYPES[0];

  return (
    <div className="space-y-8 pb-16">
      {/* ─── Header ─── */}
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-2 text-muted text-xs font-mono mb-2">
          <Compass size={14} className="text-accent" />
          <span>REPOSITORY ARCHETYPE EXPLORER</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground tracking-tight">
          Explore Architecture Archetypes
        </h1>
        <p className="text-sm md:text-base text-muted mt-2 max-w-3xl leading-relaxed">
          Discover how dependency graph topologies, coupling characteristics, and architectural
          patterns vary across common JavaScript and TypeScript repository structures.
        </p>
      </div>

      {/* ─── Archetype Selector Cards ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-heading text-foreground">
            Architecture Archetypes
          </h2>
          <span className="text-xs font-mono text-muted bg-surface-elevated px-2.5 py-1 rounded border border-border">
            4 Categories
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {ARCHETYPES.map((archetype) => {
            const isSelected = archetype.id === selectedArchetypeId;
            const IconComponent = archetype.icon;
            return (
              <button
                key={archetype.id}
                onClick={() => setSelectedArchetypeId(archetype.id)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-surface-elevated border-accent text-foreground shadow-sm ring-1 ring-accent/20"
                    : "bg-surface border-border text-muted hover:border-border-highlight hover:text-foreground"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center ${
                        isSelected
                          ? "bg-foreground text-background border-foreground"
                          : "bg-surface-elevated border-border text-muted"
                      }`}
                    >
                      <IconComponent size={18} />
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-accent/10 border border-accent/30 text-accent">
                        Active
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold font-heading text-foreground mb-1">
                    {archetype.name}
                  </h3>
                  <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                    {archetype.tagline}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] font-mono text-subtle">
                  <span>{archetype.category.split(" ")[0]}</span>
                  <span className="text-accent font-semibold">Inspect →</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Selected Archetype Deep Dive Panel ─── */}
      <div className="rounded-xl border border-border bg-surface p-5 md:p-6 space-y-6">
        {/* Panel Header */}
        <div className="border-b border-border pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono text-xs text-muted">
              <span className="px-2 py-0.5 rounded bg-surface-elevated border border-border text-foreground font-semibold">
                ARCHETYPE
              </span>
              <span>{selectedArchetype.category}</span>
            </div>
            <h3 className="text-xl font-bold font-heading text-foreground pt-1">
              {selectedArchetype.name}
            </h3>
            <p className="text-sm text-muted max-w-3xl leading-relaxed mt-1">
              {selectedArchetype.overview}
            </p>
          </div>
        </div>

        {/* Topology Traits vs Hotspots */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Key Topology Traits */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Network size={15} className="text-accent" />
              <h4 className="text-xs font-mono uppercase tracking-wider text-muted font-semibold">
                Graph Topology Characteristics
              </h4>
            </div>
            <ul className="space-y-2.5">
              {selectedArchetype.topologyTraits.map((trait, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs text-muted p-3 rounded-lg border border-border bg-surface-elevated/30"
                >
                  <CheckCircle2 size={14} className="text-accent shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{trait}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Hotspots & Vulnerabilities */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-warning" />
              <h4 className="text-xs font-mono uppercase tracking-wider text-muted font-semibold">
                Common Architectural Hotspots
              </h4>
            </div>
            <ul className="space-y-2.5">
              {selectedArchetype.hotspots.map((hotspot, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs text-muted p-3 rounded-lg border border-border bg-surface-elevated/30"
                >
                  <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{hotspot}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recommended Traversal Strategies */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <Zap size={15} className="text-accent" />
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted font-semibold">
              Recommended Graph Traversals for this Archetype
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {selectedArchetype.recommendedTraversals.map((rec, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg border border-border bg-surface-elevated/50 space-y-1.5"
              >
                <div className="text-xs font-bold font-heading text-foreground">
                  {rec.name}
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  {rec.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Architectural Patterns & Anti-Patterns Matrix ─── */}
      <div className="space-y-4 pt-4">
        <div>
          <h2 className="text-lg font-bold font-heading text-foreground">
            Structural Patterns vs. Anti-Patterns
          </h2>
          <p className="text-xs text-muted">
            Key architectural patterns and structural failure modes evaluated by CodeGraph&apos;s static analysis engine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PATTERNS.map((item, idx) => {
            const isPositive = item.status === "positive";
            return (
              <div
                key={idx}
                className="p-5 rounded-xl border border-border bg-surface space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded border ${
                        isPositive
                          ? "text-success bg-success/10 border-success/30"
                          : "text-warning bg-warning/10 border-warning/30"
                      }`}
                    >
                      {item.type}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold font-heading text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-border text-[11px] text-foreground/80 flex items-start gap-1.5">
                  <span className="text-accent font-semibold shrink-0">Analysis:</span>
                  <span className="text-muted leading-relaxed">{item.analysis}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Bottom Actions & Documentation Reference ─── */}
      <div className="p-6 rounded-xl border border-border bg-surface-elevated/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold font-heading text-foreground">
            Ready to Analyze Your Repository?
          </h3>
          <p className="text-xs text-muted mt-1 max-w-2xl leading-relaxed">
            Connect a local repository to generate real-time dependency graphs, Tarjan cycle reports, and coupling metrics. For extensive documentation and architecture specifications, check out our docs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background font-medium text-xs hover:bg-white transition-colors"
          >
            <span>Go to Dashboard</span>
            <ArrowRight size={13} />
          </Link>
          <Link
            href="/dashboard/algorithms"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-surface text-foreground font-medium text-xs hover:border-border-highlight transition-colors"
          >
            <span>Algorithms</span>
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-surface text-foreground font-medium text-xs hover:border-border-highlight transition-colors"
          >
            <BookOpen size={13} />
            <span>Docs</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}

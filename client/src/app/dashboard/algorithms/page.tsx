"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Cpu,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  BookOpen,
  Activity,
  Scale,
  HelpCircle,
} from "lucide-react";

interface NomenclatureItem {
  symbol: string;
  definition: string;
}

interface AlgorithmDoc {
  id: string;
  name: string;
  category: string;
  complexity: string;
  spaceComplexity: string;
  summary: string;
  mathFormulaTitle: string;
  mathFormulaLines: string[];
  nomenclature: NomenclatureItem[];
  useCase: string;
  invariants: string[];
  codeLanguage: string;
  codeSnippet: string;
}

const ALGORITHMS: AlgorithmDoc[] = [
  {
    id: "tarjan-scc",
    name: "Tarjan's Strongly Connected Components",
    category: "Global Graph Analysis & Cycle Detection",
    complexity: "O(|V| + |E|) Linear Time",
    spaceComplexity: "O(|V|) Auxiliary Space",
    summary:
      "Detects all isolated and multi-node circular dependency loops in a single depth-first search pass using DFS discovery numbering and an active recursion stack.",
    mathFormulaTitle: "SCC Invariant & Lowlink Recurrence",
    mathFormulaLines: [
      "SCC C ⊆ V  ⟺  ∀ u, v ∈ C, (u ⇝ v) ∧ (v ⇝ u)",
      "lowlink(v) = min( index(v), min_{(v,w)∈E} { lowlink(w) if w unvisited, index(w) if w ∈ onStack } )",
      "Cycle Condition: |C| > 1 ∨ (v, v) ∈ E",
    ],
    nomenclature: [
      { symbol: "V, E", definition: "Vertex set (nodes) and directed edge set (relationships) of the graph projection." },
      { symbol: "index(v)", definition: "Monotonically increasing integer timestamp assigned when node v is first visited." },
      { symbol: "lowlink(v)", definition: "Smallest index of any vertex known to be reachable from v, including v itself." },
      { symbol: "onStack", definition: "Active recursion stack tracking nodes in the current DFS subtree branch." },
      { symbol: "u ⇝ v", definition: "Directed path exists from vertex u to vertex v." },
    ],
    useCase:
      "Identifies circular imports between files and recursive call loops across functions before they cause runtime undefined export crashes.",
    invariants: [
      "Every vertex is visited exactly once, guaranteeing strict O(|V| + |E|) execution.",
      "Roots of SCCs are identified when lowlink[u] === index[u].",
      "Evaluated across dedicated relationship projections: calls, imports, extends, implements, instantiates.",
    ],
    codeLanguage: "typescript",
    codeSnippet: `// Tarjan's Strongly Connected Components Implementation
export class CycleAnalyzer {
  private index = 0;
  private stack: string[] = [];
  private onStack = new Set<string>();
  private indices = new Map<string, number>();
  private lowlink = new Map<string, number>();
  private sccs: string[][] = [];

  public analyze(nodes: string[], getNeighbors: (id: string) => string[]): string[][] {
    this.reset();
    for (const nodeId of nodes) {
      if (!this.indices.has(nodeId)) {
        this.strongConnect(nodeId, getNeighbors);
      }
    }
    // Filter SCCs: cycles have length > 1 or self-loops
    return this.sccs.filter(scc => scc.length > 1);
  }

  private strongConnect(v: string, getNeighbors: (id: string) => string[]): void {
    this.indices.set(v, this.index);
    this.lowlink.set(v, this.index);
    this.index++;
    this.stack.push(v);
    this.onStack.add(v);

    for (const w of getNeighbors(v)) {
      if (!this.indices.has(w)) {
        this.strongConnect(w, getNeighbors);
        this.lowlink.set(v, Math.min(this.lowlink.get(v)!, this.lowlink.get(w)!));
      } else if (this.onStack.has(w)) {
        this.lowlink.set(v, Math.min(this.lowlink.get(v)!, this.indices.get(w)!));
      }
    }

    if (this.lowlink.get(v) === this.indices.get(v)) {
      const scc: string[] = [];
      let w: string;
      do {
        w = this.stack.pop()!;
        this.onStack.delete(w);
        scc.push(w);
      } while (w !== v);
      this.sccs.push(scc);
    }
  }
}`,
  },
  {
    id: "kahn-toposort",
    name: "Kahn's Topological Sort",
    category: "Dependency Ordering & Deadlock Verification",
    complexity: "O(|V| + |E|) Linear Time",
    spaceComplexity: "O(|V|) Queue and In-Degree Map",
    summary:
      "Produces a valid linear initialization and build sequence for dependency subgraphs by iteratively removing vertices with zero incoming dependencies (in-degree = 0).",
    mathFormulaTitle: "In-Degree Reduction & Linear Sequence",
    mathFormulaLines: [
      "InDegree(v) = |{ u ∈ V : (u, v) ∈ E }|",
      "Linear Ordering L = ⟨ v₁, v₂, ..., vₙ ⟩  such that  ∀ (u, v) ∈ E ⟹ pos(u) < pos(v)",
      "Deadlock Invariant: |L| < |V|  ⟹  Graph contains at least one cyclic deadlock",
    ],
    nomenclature: [
      { symbol: "InDegree(v)", definition: "Count of direct incoming dependencies (pre-requisites) pointing to vertex v." },
      { symbol: "Queue Q", definition: "FIFO worklist holding all vertices with instantaneous InDegree = 0." },
      { symbol: "pos(u)", definition: "0-indexed position of vertex u in the resulting topological array L." },
      { symbol: "|L| < |V|", definition: "Termination condition indicating remaining nodes are trapped in cyclic dependencies." },
    ],
    useCase:
      "Determines the exact compile and initialization sequence for monorepo packages, files, and module declarations.",
    invariants: [
      "In-degree count indegree(v) = |{ u ∈ V : (u, v) ∈ E }| computed in O(|E|) time.",
      "Zero-in-degree queue processes all independent modules concurrently or deterministically.",
      "Deadlock flag automatically raised if processed nodes count < total subgraph vertices.",
    ],
    codeLanguage: "typescript",
    codeSnippet: `// Kahn's Topological Sort Implementation
export class DependencyOrderingAnalyzer {
  public analyze(nodes: string[], getNeighbors: (id: string) => string[]): {
    order: string[];
    hasCycle: boolean;
  } {
    const inDegree = new Map<string, number>();
    for (const node of nodes) inDegree.set(node, 0);

    // Compute in-degrees
    for (const node of nodes) {
      for (const neighbor of getNeighbors(node)) {
        inDegree.set(neighbor, (inDegree.get(neighbor) || 0) + 1);
      }
    }

    // Initialize zero-in-degree queue
    const queue: string[] = [];
    for (const [node, deg] of inDegree.entries()) {
      if (deg === 0) queue.push(node);
    }

    const order: string[] = [];
    while (queue.length > 0) {
      const u = queue.shift()!;
      order.push(u);

      for (const v of getNeighbors(u)) {
        const newDeg = inDegree.get(v)! - 1;
        inDegree.set(v, newDeg);
        if (newDeg === 0) queue.push(v);
      }
    }

    return {
      order,
      hasCycle: order.length < nodes.length,
    };
  }
}`,
  },
  {
    id: "bfs-impact",
    name: "Bidirectional BFS Traversal (Impact Analysis)",
    category: "Reachability & Blast Radius Computation",
    complexity: "O(|V| + |E|) Bounded by Max Depth",
    spaceComplexity: "O(|V|) Visited Hash Set",
    summary:
      "Traverses the graph level-by-level using a queue and visited set. Forward traversal reveals downstream dependencies; reverse traversal computes the blast radius of proposed code edits.",
    mathFormulaTitle: "Bidirectional Reachability Sets",
    mathFormulaLines: [
      "Dependents(s) = { u ∈ V | u ⇝ s }   [Computed via incomingEdges(s)]",
      "Dependencies(s) = { v ∈ V | s ⇝ v } [Computed via outgoingEdges(s)]",
      "depth(v) = min { k : ⟨ v₀=s, ..., vₖ=v ⟩ is a valid directed walk }",
    ],
    nomenclature: [
      { symbol: "s", definition: "Source root entity or file undergoing impact analysis." },
      { symbol: "incomingEdges(s)", definition: "Reverse edge index used to traverse upstream dependents (blast radius)." },
      { symbol: "outgoingEdges(s)", definition: "Forward edge index used to traverse downstream requirements." },
      { symbol: "depth(v)", definition: "Shortest hop distance from root node s to reached dependent node v." },
    ],
    useCase:
      "Calculates the exact blast radius (all files, functions, and API routes) affected if a shared function, class, or database schema is modified.",
    invariants: [
      "Level-by-level queue expansion ensures shortest path depth calculation for each reached node.",
      "Visited Set<string> guarantees termination in the presence of graph cycles.",
      "Configurable edge filters isolate specific relationship types (e.g., calls only).",
    ],
    codeLanguage: "typescript",
    codeSnippet: `// Breadth-First Impact & Dependency Traversal
export class GraphTraversal {
  constructor(private readonly graph: Graph) {}

  public traverse(options: {
    sourceId: string;
    direction: "incoming" | "outgoing";
    maxDepth?: number;
    relationshipTypes?: string[];
  }): TraversalResult {
    const { sourceId, direction, maxDepth = Infinity, relationshipTypes } = options;
    const visited = new Set<string>([sourceId]);
    const queue: Array<{ id: string; depth: number }> = [{ id: sourceId, depth: 0 }];
    const nodes: Array<{ id: string; depth: number }> = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.depth >= maxDepth) continue;

      const edges = direction === "incoming"
        ? this.graph.incomingEdges.get(current.id) || []
        : this.graph.outgoingEdges.get(current.id) || [];

      for (const edge of edges) {
        if (relationshipTypes && !relationshipTypes.includes(edge.type)) continue;
        const targetId = direction === "incoming" ? edge.sourceId : edge.targetId;

        if (!visited.has(targetId)) {
          visited.add(targetId);
          const nextDepth = current.depth + 1;
          queue.push({ id: targetId, depth: nextDepth });
          nodes.push({ id: targetId, depth: nextDepth });
        }
      }
    }

    return { sourceId, reachedNodes: nodes, totalCount: nodes.length };
  }
}`,
  },
  {
    id: "callpath-dfs",
    name: "Call Path DFS (Execution Chain Pathfinder)",
    category: "Path Search & Call Chain Verification",
    complexity: "O(|V| + |E|) Depth-First Path Search",
    spaceComplexity: "O(D) Recursion Call Stack (D = Max Depth)",
    summary:
      "Depth-first backtracking search specialized for 'calls' edges that discovers the direct or transitive invocation path connecting two functions.",
    mathFormulaTitle: "Directed Invocation Walk",
    mathFormulaLines: [
      "Path P(s, t) = ⟨ s = v₀, v₁, v₂, ..., vₖ = t ⟩",
      "such that (vᵢ, vᵢ₊₁) ∈ E_calls   ∀ 0 ≤ i < k",
      "Returns null if t ∉ Reachable(s) over E_calls",
    ],
    nomenclature: [
      { symbol: "s", definition: "Caller start symbol (origin of the call chain)." },
      { symbol: "t", definition: "Target destination callee symbol." },
      { symbol: "vᵢ", definition: "Intermediate symbol vertex along the execution invocation sequence." },
      { symbol: "E_calls", definition: "Subgraph restricted strictly to direct and member expression 'calls' edges." },
      { symbol: "null", definition: "Sentinel return value indicating no directed call path exists between s and t." },
    ],
    useCase:
      "Verifies whether an HTTP route controller directly or indirectly invokes a vulnerable or sensitive helper function.",
    invariants: [
      "Restricted strictly to directed edges of type 'calls'.",
      "Backtracking with visited set avoids infinite loop state on recursive function definitions.",
      "Returns deterministic execution sequences for call chain visualization.",
    ],
    codeLanguage: "typescript",
    codeSnippet: `// Call Path DFS Pathfinder Implementation
export class CallPathAnalyzer {
  constructor(private readonly graph: Graph) {}

  public analyze(sourceId: string, targetId: string): string[] | null {
    const visited = new Set<string>();
    const path: string[] = [];

    const dfs = (currentId: string): boolean => {
      path.push(currentId);
      visited.add(currentId);

      if (currentId === targetId) return true;

      const outEdges = this.graph.outgoingEdges.get(currentId) || [];
      for (const edge of outEdges) {
        if (edge.type !== "calls") continue;
        if (!visited.has(edge.targetId)) {
          if (dfs(edge.targetId)) return true;
        }
      }

      path.pop();
      return false;
    };

    const found = dfs(sourceId);
    return found ? path : null;
  }
}`,
  },
  {
    id: "fanin-fanout",
    name: "Fan-In / Fan-Out & Coupling Instability",
    category: "Coupling Degree & Structural Fragility",
    complexity: "O(1) Map Hash Set Reads",
    spaceComplexity: "O(1) Auxiliary Space",
    summary:
      "Measures afferent coupling (incoming edges, Ca) and efferent coupling (outgoing edges, Ce) to compute Robert C. Martin's architectural Instability Index (I).",
    mathFormulaTitle: "Coupling Degree & Instability Metric",
    mathFormulaLines: [
      "Ca = |incomingEdges(v)|   [Afferent Coupling / Responsibility]",
      "Ce = |outgoingEdges(v)|   [Efferent Coupling / Dependency]",
      "Instability I = Ce / (Ca + Ce)   where I ∈ [0, 1]",
    ],
    nomenclature: [
      { symbol: "Ca (Fan-In)", definition: "Count of external entities that depend on node v (higher = more responsible/concrete)." },
      { symbol: "Ce (Fan-Out)", definition: "Count of external entities that node v depends on (higher = more dependent)." },
      { symbol: "I = 0", definition: "Maximally stable component. Hard to change because many components depend on it." },
      { symbol: "I = 1", definition: "Maximally instable component. Easy to change; isolated entry point with no dependents." },
    ],
    useCase:
      "Pinpoints fragile modules, God-object singletons, and architectural bottlenecks across repositories.",
    invariants: [
      "Computed in O(1) time via the graph's synchronized incomingEdges and outgoingEdges hash maps.",
      "Identifies fan-out sprawl (Ce > 20) where a module depends on too many disparate components.",
      "Identifies high-centrality singletons (Ca > 30) where any single change introduces widespread regression risk.",
    ],
    codeLanguage: "typescript",
    codeSnippet: `// Fan-In / Fan-Out & Instability Metric Calculation
export class FanInOutAnalyzer {
  constructor(private readonly graph: Graph) {}

  public analyze(nodeId: string): {
    fanIn: number;
    fanOut: number;
    instability: number;
  } {
    const fanIn = (this.graph.incomingEdges.get(nodeId) || []).length;
    const fanOut = (this.graph.outgoingEdges.get(nodeId) || []).length;
    const total = fanIn + fanOut;

    // Instability Metric: I = Ce / (Ca + Ce)
    const instability = total === 0 ? 0 : Number((fanOut / total).toFixed(3));

    return { fanIn, fanOut, instability };
  }
}`,
  },
];

interface HealthDimensionDoc {
  id: string;
  name: string;
  symbol: string;
  weight: string;
  weightPercentage: number;
  description: string;
  formulaLines: string[];
  nomenclature: NomenclatureItem[];
  calibration: string;
}

const HEALTH_METRICS: HealthDimensionDoc[] = [
  {
    id: "cycle-health",
    name: "Cycle Health",
    symbol: "C",
    weight: "28% (0.28)",
    weightPercentage: 28,
    description:
      "Evaluates circular dependency structures across file-import, symbol-call, inheritance, implementation, and instantiation projections via Tarjan's SCC.",
    formulaLines: [
      "FileCycleRatio = |cyclicFileIds| / |totalFiles|",
      "SymbolCycleRatio = |cyclicSymbolIds| / |totalSymbols|",
      "CycleRatio = (FileCycleRatio + SymbolCycleRatio) / 2",
      "NormalizedRisk = min( CycleRatio / 0.10, 1.0 )",
      "CycleHealth (C) = 100 × (1 - NormalizedRisk)",
    ],
    nomenclature: [
      { symbol: "cyclicFileIds", definition: "Set of unique file node IDs participating in file-import SCCs." },
      { symbol: "cyclicSymbolIds", definition: "Set of unique symbol node IDs participating in symbol call/inheritance SCCs." },
      { symbol: "R_cycle = 0.10", definition: "Calibration cap: ≥10% cyclicity represents maximum modeled architectural risk (Score = 0)." },
      { symbol: "Score Scale", definition: "Linear normalization from 100 (0% cyclic nodes) to 0 (≥10% cyclic nodes)." },
    ],
    calibration: "Zero cycles yields 100/100. Linear degradation down to 0 at 10% cyclicity.",
  },
  {
    id: "coupling-health",
    name: "Coupling Health",
    symbol: "Co",
    weight: "23% (0.23)",
    weightPercentage: 23,
    description:
      "Measures overall structural degree (incoming + outgoing edges) per relevant node across all relationship types.",
    formulaLines: [
      "StructuralDegree(n) = |IncomingEdges(n)| + |OutgoingEdges(n)|",
      "AverageStructuralDegree = ( ∑_{n∈N} StructuralDegree(n) ) / |N|",
      "NormalizedRisk = 0.5 × AverageStructuralDegree",
      "CouplingHealth (Co) = 100 × ( 1 / (1 + NormalizedRisk) )",
    ],
    nomenclature: [
      { symbol: "N", definition: "Set of all relevant structural file and symbol nodes in the graph." },
      { symbol: "StructuralDegree(n)", definition: "Total number of directed edges (both inbound and outbound) touching node n." },
      { symbol: "1 / (1 + Risk)", definition: "Smooth asymptotic decay ensuring score asymptotically approaches 0 as connectivity surges." },
    ],
    calibration: "Measures overall interconnectedness. As average degree grows, score decays smoothly.",
  },
  {
    id: "fanout-health",
    name: "Fan-Out Health",
    symbol: "Fo",
    weight: "18% (0.18)",
    weightPercentage: 18,
    description:
      "Evaluates the concentration of outgoing relationships. Uses Root Mean Square (RMS) to heavily penalize outlier files that depend on excessive collaborators.",
    formulaLines: [
      "FanOut(n) = |OutgoingEdges(n)|",
      "RMSFanOut = sqrt( (1 / |N|) × ∑_{n∈N} FanOut(n)² )",
      "NormalizedRisk = 0.5 × RMSFanOut",
      "FanOutHealth (Fo) = 100 × ( 1 / (1 + NormalizedRisk) )",
    ],
    nomenclature: [
      { symbol: "FanOut(n)", definition: "Count of outgoing relationships originating from node n (import, call, instantiate)." },
      { symbol: "RMSFanOut", definition: "Root Mean Square metric: squares fan-out values to amplify outlier 'junk drawer' hubs." },
      { symbol: "0.5 × RMS", definition: "Risk coefficient mapping RMS degree into the asymptotic score function." },
    ],
    calibration: "Penalizes modules with sprawling outgoing dependency surfaces (God objects / orchestrators).",
  },
  {
    id: "fanin-health",
    name: "Fan-In Health",
    symbol: "Fi",
    weight: "14% (0.14)",
    weightPercentage: 14,
    description:
      "Evaluates incoming edge concentration. Uses Root Mean Square (RMS) to detect high-centrality single points of failure.",
    formulaLines: [
      "FanIn(n) = |IncomingEdges(n)|",
      "RMSFanIn = sqrt( (1 / |N|) × ∑_{n∈N} FanIn(n)² )",
      "NormalizedRisk = 0.5 × RMSFanIn",
      "FanInHealth (Fi) = 100 × ( 1 / (1 + NormalizedRisk) )",
    ],
    nomenclature: [
      { symbol: "FanIn(n)", definition: "Count of incoming relationships pointing into node n (files importing it, functions calling it)." },
      { symbol: "RMSFanIn", definition: "Root Mean Square metric: amplifies high-centrality bottleneck nodes." },
      { symbol: "Bottleneck Risk", definition: "High fan-in nodes represent high-blast-radius single points of failure." },
    ],
    calibration: "Detects singleton bottlenecks where breaking changes ripple across large portions of the codebase.",
  },
  {
    id: "dependency-health",
    name: "Dependency Health",
    symbol: "D",
    weight: "10% (0.10)",
    weightPercentage: 10,
    description:
      "Measures the density of external package dependencies (npm imports) relative to total repository source files.",
    formulaLines: [
      "AvgDepsPerFile = |File ⟶ Dependency Edges| / |File Nodes|",
      "NormalizedRisk = 0.5 × AvgDepsPerFile",
      "DependencyHealth (D) = 100 × ( 1 / (1 + NormalizedRisk) )",
    ],
    nomenclature: [
      { symbol: "File ⟶ Dependency", definition: "Graph edges connecting internal repository files to external npm package nodes." },
      { symbol: "File Nodes", definition: "Total number of source files discovered in the repository." },
      { symbol: "AvgDepsPerFile", definition: "Mean external package consumption rate across all files." },
    ],
    calibration: "Lower-weighted signal capturing third-party surface area and external coupling density.",
  },
  {
    id: "module-health",
    name: "Module Health",
    symbol: "M",
    weight: "7% (0.07)",
    weightPercentage: 7,
    description:
      "Evaluates graph completeness and composition by checking the proportion of virtual/module-level placeholder nodes in the graph.",
    formulaLines: [
      "ModuleRatio = |Module Nodes| / |Total Nodes|",
      "NormalizedRisk = 0.5 × ModuleRatio",
      "ModuleHealth (M) = 100 × ( 1 / (1 + NormalizedRisk) )",
    ],
    nomenclature: [
      { symbol: "Module Nodes", definition: "Module-level graph entities not directly mapped to concrete source files or symbols." },
      { symbol: "Total Nodes", definition: "Total count of all nodes (files + symbols + dependencies + modules)." },
      { symbol: "ModuleRatio", definition: "Fraction of graph representing non-file module placeholders." },
    ],
    calibration: "Diagnostic signal measuring resolution purity and module boundary cleanliness.",
  },
];

export default function AlgorithmsPage() {
  const [selectedAlgoId, setSelectedAlgoId] = useState<string>("tarjan-scc");
  const [copiedCode, setCopiedCode] = useState(false);

  const selectedAlgo =
    ALGORITHMS.find((a) => a.id === selectedAlgoId) || ALGORITHMS[0];

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
          <Cpu size={14} className="text-accent" />
          <span>GRAPH ALGORITHMS & HEALTH METRICS</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground tracking-tight">
          Graph Algorithms & Health Analysis
        </h1>
        <p className="text-sm md:text-base text-muted mt-2 max-w-3xl leading-relaxed">
          The mathematical algorithms, complexity bounds, and health indexing equations powering
          CodeGraph&apos;s static analysis and graph query engine.
        </p>
      </div>

      {/* ─── Algorithm Selector Pill Bar ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-heading text-foreground">
            Core Stateless Analyzers
          </h2>
          <span className="text-xs font-mono text-muted bg-surface-elevated px-2.5 py-1 rounded border border-border">
            5 Graph Analyzers
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {ALGORITHMS.map((algo) => {
            const isSelected = algo.id === selectedAlgoId;
            return (
              <button
                key={algo.id}
                onClick={() => setSelectedAlgoId(algo.id)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-surface-elevated border-accent text-foreground shadow-sm ring-1 ring-accent/20"
                    : "bg-surface border-border text-muted hover:border-border-highlight hover:text-foreground"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono uppercase text-subtle font-semibold">
                      {algo.category.split(" ")[0]}
                    </span>
                    {isSelected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    )}
                  </div>
                  <div className="text-xs font-bold font-heading line-clamp-1 leading-snug">
                    {algo.name}
                  </div>
                </div>
                <div className="mt-2 text-[10px] font-mono text-accent truncate">
                  {algo.complexity.split(" ")[0]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Selected Algorithm Deep Dive Panel ─── */}
      <div className="rounded-xl border border-border bg-surface p-5 md:p-6 space-y-6">
        {/* Panel Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono text-xs text-muted">
              <span className="px-2 py-0.5 rounded bg-surface-elevated border border-border text-foreground font-semibold">
                ALGORITHM
              </span>
              <span>{selectedAlgo.category}</span>
            </div>
            <h3 className="text-xl font-bold font-heading text-foreground pt-1">
              {selectedAlgo.name}
            </h3>
            <p className="text-sm text-muted max-w-3xl leading-relaxed mt-1">
              {selectedAlgo.summary}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3 py-1.5 rounded-lg border border-border bg-surface-elevated text-right">
              <div className="text-[10px] font-mono uppercase text-subtle">Time Complexity</div>
              <div className="text-xs font-mono font-bold text-accent">
                {selectedAlgo.complexity}
              </div>
            </div>
          </div>
        </div>

        {/* Mathematical Foundation & Nomenclature Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Formatted Mathematical Formula Box */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-muted">
              <Scale size={14} className="text-accent" />
              <span>MATHEMATICAL FOUNDATION & DEFINITIONS</span>
            </div>

            <div className="p-4 rounded-xl border border-border bg-background space-y-2.5">
              <div className="text-[11px] font-mono text-subtle uppercase tracking-wider font-semibold border-b border-border pb-1.5">
                {selectedAlgo.mathFormulaTitle}
              </div>
              <div className="space-y-1.5 font-mono text-xs text-accent">
                {selectedAlgo.mathFormulaLines.map((line, idx) => (
                  <div key={idx} className="p-2 rounded bg-surface-elevated/40 border border-border/50 break-all leading-relaxed">
                    {line}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-lg border border-border bg-surface-elevated/30 text-xs text-muted leading-relaxed">
              <span className="font-semibold text-foreground block mb-1">CodeGraph Application:</span>
              {selectedAlgo.useCase}
            </div>
          </div>

          {/* Right: Explicit Nomenclature / Variable Glossary */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-muted">
              <HelpCircle size={14} className="text-accent" />
              <span>NOMENCLATURE & VARIABLE GLOSSARY</span>
            </div>

            <div className="rounded-xl border border-border bg-surface-elevated/20 overflow-hidden">
              <div className="divide-y divide-border">
                {selectedAlgo.nomenclature.map((item, idx) => (
                  <div key={idx} className="p-3 text-xs flex items-start gap-3 hover:bg-surface-elevated/40 transition-colors">
                    <code className="font-mono font-semibold text-accent text-xs shrink-0 px-2 py-0.5 rounded bg-surface-elevated border border-border">
                      {item.symbol}
                    </code>
                    <span className="text-muted leading-relaxed">
                      {item.definition}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Invariants & Implementation Code */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
          {/* Left: Key Invariants */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted font-semibold">
              Algorithmic Invariants
            </h4>
            <ul className="space-y-2.5">
              {selectedAlgo.invariants.map((inv, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs text-muted p-3 rounded-lg border border-border bg-surface-elevated/30"
                >
                  <CheckCircle2 size={14} className="text-accent shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{inv}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Code Implementation */}
          <div className="lg:col-span-8 rounded-lg border border-border bg-background overflow-hidden">
            <div className="flex items-center justify-between px-3.5 py-2 border-b border-border bg-surface-elevated/50">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-border-highlight" />
                <span className="text-[11px] font-mono text-muted">
                  {selectedAlgo.id}.ts
                </span>
              </div>
              <button
                onClick={() => handleCopyCode(selectedAlgo.codeSnippet)}
                className="flex items-center gap-1 text-[11px] font-mono text-muted hover:text-foreground transition-colors cursor-pointer"
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
            <pre className="p-4 text-xs font-mono text-foreground/90 overflow-x-auto leading-relaxed max-h-[380px]">
              <code>{selectedAlgo.codeSnippet}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* ─── Health Index Formulations (Exact 6 Metrics & Aggregator) ─── */}
      <div className="space-y-5 pt-4">
        <div>
          <div className="flex items-center gap-2 text-muted text-xs font-mono mb-1">
            <Activity size={14} className="text-accent" />
            <span>WEIGHTED STRUCTURAL COMPOSITE SCORE</span>
          </div>
          <h2 className="text-lg font-bold font-heading text-foreground">
            CodeGraph Health Index Architecture
          </h2>
          <p className="text-xs text-muted mt-1 max-w-3xl leading-relaxed">
            The Health Index synthesizes six independent structural metrics into a single 0–100 score.
            Each metric computes raw graph measurements, applies bounded calibration normalization, and is weighted into the composite index.
          </p>
        </div>

        {/* Top-Level Master Aggregator Formula Banner */}
        <div className="p-5 rounded-xl border border-accent/30 bg-surface-elevated space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase font-bold text-foreground">
                Master Composite Aggregator Formula
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/10 border border-accent/30 text-accent font-semibold">
                ∑ Weights = 1.00
              </span>
            </div>
            <span className="text-xs font-mono text-muted">
              H ∈ [0, 100] (Higher is Healthier)
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-background border border-border font-mono text-xs md:text-sm text-accent text-center tracking-wide overflow-x-auto">
            H = (C × 0.28) + (Co × 0.23) + (Fo × 0.18) + (Fi × 0.14) + (D × 0.10) + (M × 0.07)
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1 text-[11px] font-mono text-muted text-center">
            <div className="p-2 rounded bg-surface border border-border">
              <span className="text-accent font-bold">C:</span> Cycle (28%)
            </div>
            <div className="p-2 rounded bg-surface border border-border">
              <span className="text-accent font-bold">Co:</span> Coupling (23%)
            </div>
            <div className="p-2 rounded bg-surface border border-border">
              <span className="text-accent font-bold">Fo:</span> Fan-Out (18%)
            </div>
            <div className="p-2 rounded bg-surface border border-border">
              <span className="text-accent font-bold">Fi:</span> Fan-In (14%)
            </div>
            <div className="p-2 rounded bg-surface border border-border">
              <span className="text-accent font-bold">D:</span> Dependency (10%)
            </div>
            <div className="p-2 rounded bg-surface border border-border">
              <span className="text-accent font-bold">M:</span> Module (7%)
            </div>
          </div>
        </div>

        {/* 6 Individual Health Dimensions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {HEALTH_METRICS.map((metric) => (
            <div
              key={metric.id}
              className="p-5 rounded-xl border border-border bg-surface space-y-3.5 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded bg-surface-elevated border border-border flex items-center justify-center font-mono text-xs font-bold text-accent">
                      {metric.symbol}
                    </span>
                    <h3 className="text-sm font-bold font-heading text-foreground">
                      {metric.name}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-accent font-semibold px-2 py-0.5 rounded bg-surface-elevated border border-border">
                    {metric.weight}
                  </span>
                </div>

                <p className="text-xs text-muted leading-relaxed">
                  {metric.description}
                </p>

                {/* Mathematical Formula Lines */}
                <div className="p-3 rounded-lg bg-background border border-border font-mono text-[11px] text-accent space-y-1">
                  {metric.formulaLines.map((line, idx) => (
                    <div key={idx} className="break-all">
                      {line}
                    </div>
                  ))}
                </div>

                {/* Nomenclature / Glossary */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-mono uppercase text-subtle font-semibold">
                    Variable Glossary:
                  </div>
                  <div className="space-y-1 text-[11px] text-muted">
                    {metric.nomenclature.map((n, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 leading-snug">
                        <code className="text-accent font-mono text-[10px] shrink-0 font-semibold">
                          {n.symbol}:
                        </code>
                        <span className="text-subtle text-[11px]">{n.definition}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Calibration footer */}
              <div className="pt-3 border-t border-border text-[10px] font-mono text-muted flex items-start gap-1">
                <span className="text-accent font-semibold shrink-0">Scale:</span>
                <span className="leading-snug">{metric.calibration}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Bottom Actions & Documentation Reference ─── */}
      <div className="p-6 rounded-xl border border-border bg-surface-elevated/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold font-heading text-foreground">
            Explore Architecture & Documentation
          </h3>
          <p className="text-xs text-muted mt-1 max-w-2xl leading-relaxed">
            Review the two-pass AST ingestion pipeline or inspect repository archetypes. For extensive technical documentation and architecture specifications, check out our docs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/dashboard/how-it-works"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background font-medium text-xs hover:bg-white transition-colors"
          >
            <span>How It Works</span>
            <ArrowRight size={13} />
          </Link>
          <Link
            href="/dashboard/explore"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-surface text-foreground font-medium text-xs hover:border-border-highlight transition-colors"
          >
            <span>Explore Archetypes</span>
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

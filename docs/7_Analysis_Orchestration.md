# 7. Analysis Orchestration

## Overview

The **Analytics Engine** sits downstream of the Graph Builder. Where the Graph Builder constructs the in-memory graph from the parsed repository data, the Analytics Engine *questions* that graph. It is the part of CodeGraph that turns raw connectivity information into actionable intelligence about the codebase.

```
ParsedRepository
      │
      ▼
 GraphBuilder ──────────────────────► Graph (nodes + edges)
                                            │
                                            ▼
                                    AnalysisEngine
                                    ┌───────────────────────────────────────┐
                                    │  GraphTraversal        (7.1)          │
                                    │  ImpactAnalyzer        (7.2)          │
                                    │  DependencyAnalyzer    (7.3)          │
                                    │  CycleAnalyzer         (7.4)          │
                                    │  DependencyOrderingAnalyzer  (7.5)    │
                                    │  FanInOutAnalyzer      (7.6)          │
                                    │  CallPathAnalyzer      (7.7)          │
                                    │  DeadCodeDetector      (7.8)  ★       │
                                    └───────────────────────────────────────┘
```

---

## Location

```
server/src/analytics/
└── AnalysisEngine.ts
```

---

## The `AnalysisEngine` Class

`AnalysisEngine` is the single entry point for all graph analysis. External layers (API routes, controllers) interact exclusively with this class — they never instantiate individual analyzers directly.

### Constructor

```ts
constructor(private readonly graph: Graph)
```

The constructor takes only a `Graph` instance and is responsible for wiring every analyzer:

```ts
constructor(private readonly graph: Graph) {
    this.graphTraversal           = new GraphTraversal(graph);
    this.impactAnalyzer           = new ImpactAnalyzer(this.graphTraversal);
    this.dependencyAnalyzer       = new DependencyAnalyzer(this.graphTraversal);
    this.cycleAnalyzer            = new CycleAnalyzer(graph);
    this.dependencyOrderingAnalyzer = new DependencyOrderingAnalyzer(graph);
    this.fanInOutAnalyzer         = new FanInOutAnalyzer(graph);
    this.callPathAnalyzer         = new CallPathAnalyzer(graph);
}
```

**Wiring rules:**
- `GraphTraversal` is constructed first because `ImpactAnalyzer` and `DependencyAnalyzer` both depend on it.
- All other analyzers receive the `Graph` directly — they manage their own traversal logic internally.

### Private Fields

| Field | Type | Purpose |
|-------|------|---------|
| `graph` | `Graph` | The immutable in-memory graph (passed in, stored via constructor shorthand). |
| `graphTraversal` | `GraphTraversal` | BFS primitive shared by `ImpactAnalyzer` and `DependencyAnalyzer`. |
| `impactAnalyzer` | `ImpactAnalyzer` | Backward traversal — who depends on X. |
| `dependencyAnalyzer` | `DependencyAnalyzer` | Forward traversal — what does X depend on. |
| `cycleAnalyzer` | `CycleAnalyzer` | Tarjan's SCC — cycle detection across five relationship projections. |
| `dependencyOrderingAnalyzer` | `DependencyOrderingAnalyzer` | Kahn's topological sort — initialization ordering. |
| `fanInOutAnalyzer` | `FanInOutAnalyzer` | O(1) edge-count measurement — connectivity degree. |
| `callPathAnalyzer` | `CallPathAnalyzer` | DFS path-finding — call chain between two symbols. |

---

## Public API

### `analyzeImpact`

```ts
analyzeImpact(sourceNodeId: string, options?: ImpactAnalysisOptions): ImpactAnalysisResult
```

Delegates to `ImpactAnalyzer.analyze(...)`. Traverses the graph **backward** (incoming edges) to find all nodes that would be affected if `sourceNodeId` were changed.

→ See [7.2 Impact Analyzer](./7.2_Impact_Analyzer.md)

---

### `analyzeDependencies`

```ts
analyzeDependencies(sourceNodeId: string, options?: DependencyAnalysisOptions): DependencyAnalysisResult
```

Delegates to `DependencyAnalyzer.analyze(...)`. Traverses the graph **forward** (outgoing edges) to find everything `sourceNodeId` depends on, directly or transitively.

→ See [7.3 Dependency Analyzer](./7.3_Dependency_Analyzer.md)

---

### `analyzeCycles`

```ts
analyzeCycles(options?: CycleAnalysisOptions): CycleAnalysisResult
```

Delegates to `CycleAnalyzer.analyze(...)`. Runs Tarjan's SCC algorithm across the configured cycle type projections. No `sourceNodeId` — this is a **global** graph-wide analysis.

→ See [7.4 Cycle Analyzer](./7.4_Cycle_Analyzer.md)

---

### `analyzeDependencyOrdering`

```ts
analyzeDependencyOrdering(sourceNodeId: string): DependencyOrderingResult
```

Delegates to `DependencyOrderingAnalyzer.analyze(...)`. Collects the dependency subgraph of `sourceNodeId` and produces a topological ordering via Kahn's algorithm.

→ See [7.5 Ordering Analyzer](./7.5_Ordering_Analyzer.md)

---

### `analyzeFanInOut`

```ts
analyzeFanInOut(nodeId: string): FanInOutResult
```

Delegates to `FanInOutAnalyzer.analyze(...)`. Returns the raw incoming and outgoing edge counts for a node in O(1) time.

→ See [7.6 Connectivity Analyzer](./7.6_Connectivity_Analyzer.md)

---

### `analyzeCallPath`

```ts
analyzeCallPath(sourceNodeId: string, targetNodeId: string): CallPathResult
```

Delegates to `CallPathAnalyzer.analyze(...)`. Runs a DFS over `"calls"` edges to find a call chain between two symbols, returning the path or `null` if none exists.

→ See [7.7 Call Path Analyzer](./7.7_Call_Path_Analyzer.md)

---

## Responsibilities

The orchestration layer is responsible for:

1. **Wiring** — instantiating each analyzer with its required dependencies (the `Graph` instance, or a `GraphTraversal` instance).
2. **Routing** — accepting a query from the API layer, selecting the correct analyzer, and forwarding the call.
3. **Combining** — where a single user query requires output from more than one analyzer (future use), the orchestrator will merge results before returning them.

---

## Architectural Principle

Every analyzer in the engine follows the same contract:

- It is a **class** with a single public entry point (`analyze(...)` or `traverse(...)`).
- It accepts a **typed options/parameter object**.
- It returns a **typed result object**.
- It has **no side effects** — it only reads from the `Graph`, never writes to it.
- It is **stateless per call** — all intermediate state (visited sets, queues, stacks) is local to the method invocation.

This makes every analyzer independently testable and composable. `AnalysisEngine` itself adds no logic — it is a pure facade.

---

## Dependency Graph of the Analyzers

```
Graph
 ├── GraphTraversal
 │     ├── ImpactAnalyzer              (wraps traversal, direction=incoming)
 │     └── DependencyAnalyzer          (wraps traversal, direction=outgoing)
 ├── CycleAnalyzer                     (reads Graph directly, runs Tarjan's SCC)
 ├── DependencyOrderingAnalyzer        (reads Graph directly, runs Kahn's toposort)
 ├── FanInOutAnalyzer                  (reads Graph directly, counts edge sets)
 └── CallPathAnalyzer                  (reads Graph directly, runs DFS path-find)
```

`GraphTraversal` is the only shared primitive. All other analyzers that need multi-hop reachability delegate to it. Analyzers that require finer graph-algorithm control (cycle detection, topological ordering, path-finding) take the `Graph` directly.

---

*See sections 7.1 – 7.8 for detailed documentation on each individual analyzer.*

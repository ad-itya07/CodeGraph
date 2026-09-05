# 7. Graph

## Overview

The **Graph layer** sits between the Parser and the Analytics Engine. It takes the raw data produced by the Parser — a flat collection of files, symbols, relationships, and metadata — and transforms it into a **queryable, indexed, in-memory graph** that all downstream analysis can operate on efficiently.

```
ParsedRepository
  (files, symbols, relationships, metadata)
        │
        ▼
   GraphBuilder  (7.1)
        │
        ▼
   Graph  ──────────────────────────► GraphQuery  (7.2)
   (nodes + edges + indexes)           (filtered, semantic lookups)
        │
        ▼
   Analytics Engine  (section 8)
```

---

## Location

```
server/src/graph/
├── GraphBuilder.ts
├── GraphQuery.ts
├── models/
│   ├── Graph.ts
│   ├── GraphEdge.ts
│   ├── GraphNode.ts
│   └── Nodes/
│       ├── FileNode.ts
│       ├── SymbolNode.ts
│       ├── DependencyNode.ts
│       └── ModuleNode.ts
└── utils/
    └── getGraphNodeId.ts
```

---

## The `Graph` Data Structure

The canonical `Graph` interface is the central data structure consumed by every downstream component.

```ts
interface Graph {
    nodes:         Map<string, GraphNode>;           // nodeId → Node object
    edges:         Map<string, GraphEdge>;           // edgeId → Edge object
    nodesByKind:   Map<GraphNodeKind, Set<string>>;  // kind   → Set of nodeIds
    outgoingEdges: Map<string, Set<string>>;         // nodeId → Set of outgoing edgeIds
    incomingEdges: Map<string, Set<string>>;         // nodeId → Set of incoming edgeIds
}
```

### Why Five Maps?

| Map | Purpose |
|-----|---------|
| `nodes` | Primary node store — O(1) lookup by ID |
| `edges` | Primary edge store — O(1) lookup by ID |
| `nodesByKind` | Efficiently enumerate all nodes of a specific kind (e.g., "all file nodes") without scanning all nodes |
| `outgoingEdges` | O(1) access to all edges leaving a node — used by forward traversal, DFS, and Kahn's sort |
| `incomingEdges` | O(1) access to all edges entering a node — used by backward traversal (impact analysis) and Tarjan's SCC |

Pre-indexing edges in both directions at build time means every traversal and query operation is O(1) per lookup, not O(E) per scan.

---

## Node Types

There are four kinds of nodes in the graph, each modeled separately:

| Kind | Type | Represents |
|------|------|-----------|
| `"file"` | `FileNode` | A source file (`.ts`, `.tsx`, `.js`, `.jsx`) |
| `"symbol"` | `SymbolNode` | A named declaration within a file |
| `"dependency"` | `DependencyNode` | An npm package listed in `package.json` |
| `"module"` | `ModuleNode` | An unresolved import (Node built-ins, unknown packages) |

### Node ID Convention

All node IDs are prefixed by kind using `getGraphNodeId`:

```ts
getGraphNodeId(kind, rawId) → `${kind}:${rawId}`
```

Examples:
```
file:    file:/abs/path/to/auth.ts
symbol:  symbol:/abs/path/to/auth.ts:12:4:validateToken
dependency: dependency:express
module:  module:fs
```

The prefix guarantees that IDs are globally unique even when the raw ID values (file paths, symbol IDs, package names) might collide across different kinds.

---

## Edge Model

```ts
interface GraphEdge {
    id:               string;           // Inherited from ParsedRelationship.id
    sourceId:         string;           // Prefixed node ID of the source
    targetId:         string;           // Prefixed node ID of the target
    relationshipKind: RelationshipKind; // "calls" | "imports" | "exports" | "extends" | "implements" | "instantiates"
}
```

Edge IDs are deterministic and come directly from the parser's `ParsedRelationship.id` format (`sourceId:kind:targetId`), which means re-building the graph from the same parse output always produces identical edge IDs.

---

## Layer Responsibilities

| Component | Responsibility |
|-----------|---------------|
| `GraphBuilder` | Constructs the `Graph` from a `ParsedRepository`. Creates all nodes and edges, builds all indexes, validates consistency. |
| `GraphQuery` | Provides semantic, filtered lookups over an existing `Graph` (e.g., "get all callers of this symbol"). Never mutates the graph. |

---

*See 7.1 for GraphBuilder detail and 7.2 for GraphQuery detail.*

import { GraphNode } from "@/graph/models/GraphNode.js";
import { GraphEdge } from "@/graph/models/GraphEdge.js";

export interface PersistedGraph {
    nodes: GraphNode[];
    edges: GraphEdge[];
}
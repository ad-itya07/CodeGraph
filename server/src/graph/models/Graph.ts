import { GraphNode, GraphNodeKind } from "./GraphNode.js";
import { GraphEdge } from "./GraphEdge.js";

export interface Graph {
    nodes: Map<string, GraphNode>;
    edges: Map<string, GraphEdge>;

    nodesByKind: Map<GraphNodeKind, Set<string>>;

    outgoingEdges: Map<string, Set<string>>;
    incomingEdges: Map<string, Set<string>>;
}
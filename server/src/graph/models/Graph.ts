import { GraphNode, GraphNodeKind } from "./GraphNode.js";
import { GraphEdge } from "./GraphEdge.js";

export interface Graph {
    nodes: Map<string, GraphNode>; // NodeId -> Node Object
    edges: Map<string, GraphEdge>; // EdgeId -> Edge Object

    nodesByKind: Map<GraphNodeKind, Set<string>>; // NodeKind -> Set of NodeIds

    outgoingEdges: Map<string, Set<string>>; // source NodeId -> Set of Outgoing EdgeIds
    incomingEdges: Map<string, Set<string>>; // target NodeId -> Set of Incoming EdgeIds
}
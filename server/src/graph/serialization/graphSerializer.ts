import { Graph } from "@/graph/models/Graph.js";
import { GraphEdge } from "@/graph/models/GraphEdge.js";
import { GraphNode, GraphNodeKind } from "@/graph/models/GraphNode.js";
import { PersistedGraph } from "./models/PersistedGraph.js";

export function serializeGraph(graph: Graph): PersistedGraph {
    return {
        nodes: Array.from(graph.nodes.values()),
        edges: Array.from(graph.edges.values()),
    };
}

export function deserializeGraph(data: PersistedGraph): Graph {
    const nodes = new Map(
        data.nodes.map((node) => [node.id, node])
    );

    const edges = new Map(
        data.edges.map((edge) => [edge.id, edge])
    );

    const nodesByKind = new Map<GraphNodeKind, Set<string>>();

    for (const node of data.nodes) {
        if (!nodesByKind.has(node.kind)) {
            nodesByKind.set(node.kind, new Set());
        }

        nodesByKind.get(node.kind)!.add(node.id);
    }

    const outgoingEdges = new Map<string, Set<string>>();
    const incomingEdges = new Map<string, Set<string>>();

    for (const edge of data.edges) {
        if (!outgoingEdges.has(edge.sourceId)) {
            outgoingEdges.set(edge.sourceId, new Set());
        }

        outgoingEdges.get(edge.sourceId)!.add(edge.id);

        if (!incomingEdges.has(edge.targetId)) {
            incomingEdges.set(edge.targetId, new Set());
        }

        incomingEdges.get(edge.targetId)!.add(edge.id);
    }

    return {
        nodes,
        edges,
        nodesByKind,
        outgoingEdges,
        incomingEdges,
    };
}
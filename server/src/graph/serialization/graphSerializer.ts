import { Graph } from "@/graph/models/Graph.js";
import { GraphNodeKind } from "@/graph/models/GraphNode.js";
import { PersistedGraph } from "./models/PersistedGraph.js";

export function serializeGraph(graph: Graph): PersistedGraph {
    return {
        nodes: Array.from(graph.nodes.values()),
        edges: Array.from(graph.edges.values()),

        outgoingEdges: Object.fromEntries(
            Array.from(graph.outgoingEdges.entries()).map(
                ([nodeId, edgeIds]) => [nodeId, Array.from(edgeIds)]
            )
        ),

        incomingEdges: Object.fromEntries(
            Array.from(graph.incomingEdges.entries()).map(
                ([nodeId, edgeIds]) => [nodeId, Array.from(edgeIds)]
            )
        ),
    };
}

export function deserializeGraph(data: PersistedGraph): Graph {
    const nodes = new Map(
        data.nodes.map((node) => [node.id, node])
    );

    const edges = new Map(
        data.edges.map((edge) => [edge.id, edge])
    );

    const outgoingEdges = new Map<string, Set<string>>(
        Object.entries(data.outgoingEdges).map(
            ([nodeId, edgeIds]) => [nodeId, new Set(edgeIds)]
        )
    );

    const incomingEdges = new Map<string, Set<string>>(
        Object.entries(data.incomingEdges).map(
            ([nodeId, edgeIds]) => [nodeId, new Set(edgeIds)]
        )
    );

    const nodesByKind = new Map<GraphNodeKind, Set<string>>();

    for (const node of data.nodes) {
        if (!nodesByKind.has(node.kind)) {
            nodesByKind.set(node.kind, new Set());
        }

        nodesByKind.get(node.kind)!.add(node.id);
    }

    return {
        nodes,
        edges,
        nodesByKind,
        outgoingEdges,
        incomingEdges,
    };
}
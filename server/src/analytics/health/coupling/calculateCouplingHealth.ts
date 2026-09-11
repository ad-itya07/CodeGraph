import { Graph } from "@/graph/models/Graph.js";

export interface CouplingHealthResult {
    score: number;
    averageStructuralDegree: number;
    normalizedRisk: number;
}

const COUPLING_FACTOR = 0.5;

export function calculateCouplingHealth(graph: Graph): CouplingHealthResult {
    const nodeIds = [
        ...(graph.nodesByKind.get("file") ?? new Set<string>()),
        ...(graph.nodesByKind.get("symbol") ?? new Set<string>()),
    ];

    if (nodeIds.length === 0) {
        return {
            score: 100,
            averageStructuralDegree: 0,
            normalizedRisk: 0,
        };
    }

    let totalDegree = 0;

    for (const nodeId of nodeIds) {
        const fanIn = graph.incomingEdges.get(nodeId)?.size ?? 0;

        const fanOut = graph.outgoingEdges.get(nodeId)?.size ?? 0;

        totalDegree += fanIn + fanOut;
    }

    const averageStructuralDegree = totalDegree / nodeIds.length;

    const normalizedRisk = COUPLING_FACTOR * averageStructuralDegree;

    const score = 100 / (1 + normalizedRisk);

    return {
        score,
        averageStructuralDegree,
        normalizedRisk,
    };
}
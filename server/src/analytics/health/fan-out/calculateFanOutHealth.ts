import { Graph } from "@/graph/models/Graph.js";

export interface FanOutHealthResult {
    score: number;
    averageFanOut: number;
    rootMeanSquareFanOut: number;
    maximumFanOut: number;
}

const FAN_OUT_FACTOR = 0.5;

export function calculateFanOutHealth(graph: Graph): FanOutHealthResult {
    const nodeIds = [
        ...(graph.nodesByKind.get("file") ?? new Set<string>()),
        ...(graph.nodesByKind.get("symbol") ?? new Set<string>()),
    ];

    if (nodeIds.length === 0) {
        return {
            score: 100,
            averageFanOut: 0,
            rootMeanSquareFanOut: 0,
            maximumFanOut: 0,
        };
    }

    let totalFanOut = 0;
    let squaredFanOut = 0;
    let maximumFanOut = 0;

    for (const nodeId of nodeIds) {
        const fanOut = graph.outgoingEdges.get(nodeId)?.size ?? 0;

        totalFanOut += fanOut;
        squaredFanOut += fanOut * fanOut;
        maximumFanOut = Math.max(maximumFanOut, fanOut);
    }

    const averageFanOut = totalFanOut / nodeIds.length;

    const rootMeanSquareFanOut = Math.sqrt(squaredFanOut / nodeIds.length);

    const normalizedRisk = FAN_OUT_FACTOR * rootMeanSquareFanOut;

    const score = 100 / (1 + normalizedRisk);

    return {
        score,
        averageFanOut,
        rootMeanSquareFanOut,
        maximumFanOut,
    };
}
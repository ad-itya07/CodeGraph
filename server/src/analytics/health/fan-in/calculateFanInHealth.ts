import { Graph } from "@/graph/models/Graph.js";

export interface FanInHealthResult {
    score: number;
    averageFanIn: number;
    rootMeanSquareFanIn: number;
    highestFanIn: number;
}

const FAN_IN_FACTOR = 0.5;

export function calculateFanInHealth(graph: Graph): FanInHealthResult {
    const nodeIds = [
        ...(graph.nodesByKind.get("file") ?? new Set<string>()),
        ...(graph.nodesByKind.get("symbol") ?? new Set<string>()),
    ];

    if (nodeIds.length === 0) {
        return {
            score: 100,
            averageFanIn: 0,
            rootMeanSquareFanIn: 0,
            highestFanIn: 0,
        };
    }

    let totalFanIn = 0;
    let squaredFanIn = 0;
    let highestFanIn = 0;

    for (const nodeId of nodeIds) {
        const fanIn = graph.incomingEdges.get(nodeId)?.size ?? 0;

        totalFanIn += fanIn;
        squaredFanIn += fanIn * fanIn;

        highestFanIn = Math.max(highestFanIn, fanIn);
    }

    const averageFanIn = totalFanIn / nodeIds.length;

    const rootMeanSquareFanIn = Math.sqrt(squaredFanIn / nodeIds.length);

    const normalizedRisk = FAN_IN_FACTOR * rootMeanSquareFanIn;

    const score = 100 / (1 + normalizedRisk);

    return {
        score,
        averageFanIn,
        rootMeanSquareFanIn,
        highestFanIn,
    };
}
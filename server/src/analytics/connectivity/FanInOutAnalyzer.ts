import { Graph } from "@/graph/models/Graph.js";

import { FanInOutResult } from "./models/FanInOutResult.js";

export class FanInOutAnalyzer {
    constructor(private readonly graph: Graph) { }

    analyze(nodeId: string): FanInOutResult {
        const incomingEdges = this.graph.incomingEdges.get(nodeId) ?? new Set();

        const outgoingEdges = this.graph.outgoingEdges.get(nodeId) ?? new Set();

        return {
            nodeId,
            fanIn: incomingEdges.size,
            fanOut: outgoingEdges.size,
        };
    }
}
import { Graph } from "@/graph/models/Graph.js";

import { CycleAnalyzer } from "@/analytics/cycles/CycleAnalyzer.js";

export interface CycleHealthResult {
    score: number;

    cycleCount: number;

    cyclicFileCount: number;
    cyclicSymbolCount: number;

    fileCycleRatio: number;
    symbolCycleRatio: number;
}

export function calculateCycleHealth(graph: Graph): CycleHealthResult {
    const cycleAnalyzer = new CycleAnalyzer(graph);

    const cycles = cycleAnalyzer.analyze().cycles;

    const cyclicFileIds = new Set<string>();
    const cyclicSymbolIds = new Set<string>();

    for (const cycle of cycles) {
        if (cycle.type === "file-import") {
            for (const nodeId of cycle.nodeIds) {
                cyclicFileIds.add(nodeId);
            }

            continue;
        }

        for (const nodeId of cycle.nodeIds) {
            cyclicSymbolIds.add(nodeId);
        }
    }

    const totalFiles =
        graph.nodesByKind.get("file")?.size ?? 0;

    const totalSymbols =
        graph.nodesByKind.get("symbol")?.size ?? 0;

    const fileCycleRatio =
        totalFiles === 0
            ? 0
            : cyclicFileIds.size / totalFiles;

    const symbolCycleRatio =
        totalSymbols === 0
            ? 0
            : cyclicSymbolIds.size / totalSymbols;

    const cycleRatio =
        (fileCycleRatio + symbolCycleRatio) / 2;

    /*
     * A repository with 10% or more of its files/symbols
     * participating in cycles receives the minimum
     * cycle-health score.
     */
    const normalizedRisk = Math.min(cycleRatio / 0.10, 1);

    const score = 100 * (1 - normalizedRisk);

    return {
        score,

        cycleCount: cycles.length,

        cyclicFileCount: cyclicFileIds.size,
        cyclicSymbolCount: cyclicSymbolIds.size,

        fileCycleRatio,
        symbolCycleRatio,
    };
}
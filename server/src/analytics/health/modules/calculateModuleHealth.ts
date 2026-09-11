import { Graph } from "@/graph/models/Graph.js";

export interface ModuleHealthResult {
    score: number;
    moduleCount: number;
    totalNodeCount: number;
    moduleRatio: number;
}

export function calculateModuleHealth(graph: Graph): ModuleHealthResult {
    const moduleCount = graph.nodesByKind.get("module")?.size ?? 0;

    const totalNodeCount = graph.nodes.size;

    if (totalNodeCount === 0) {
        return {
            score: 100,
            moduleCount: 0,
            totalNodeCount: 0,
            moduleRatio: 0,
        };
    }

    const moduleRatio = moduleCount / totalNodeCount;

    const score = 100 * (1 - moduleRatio);

    return {
        score,
        moduleCount,
        totalNodeCount,
        moduleRatio,
    };
}
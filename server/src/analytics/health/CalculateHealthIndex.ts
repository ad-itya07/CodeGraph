import { Graph } from "@/graph/models/Graph.js";

import { calculateCycleHealth, CycleHealthResult } from "./cycles/calculateCycleHealth.js";

import { calculateCouplingHealth, CouplingHealthResult } from "./coupling/calculateCouplingHealth.js";

import { calculateFanOutHealth, FanOutHealthResult } from "./fan-out/calculateFanOutHealth.js";

import { calculateFanInHealth, FanInHealthResult } from "./fan-in/calculateFanInHealth.js";

import { calculateDependencyHealth, DependencyHealthResult } from "./dependency/calculateDependencyHealth.js";

import { calculateModuleHealth, ModuleHealthResult } from "./modules/calculateModuleHealth.js";

const HEALTH_WEIGHTS = {
    cycles: 0.28,
    coupling: 0.23,
    fanOut: 0.18,
    fanIn: 0.14,
    dependency: 0.10,
    modules: 0.07,
} as const;

export interface RepositoryHealthResult {
    index: number;

    metrics: {
        cycles: CycleHealthResult;
        coupling: CouplingHealthResult;
        fanOut: FanOutHealthResult;
        fanIn: FanInHealthResult;
        dependency: DependencyHealthResult;
        modules: ModuleHealthResult;
    };
}

export function calculateHealthIndex(graph: Graph): RepositoryHealthResult {
    const cycles = calculateCycleHealth(graph);
    const coupling = calculateCouplingHealth(graph);
    const fanOut = calculateFanOutHealth(graph);
    const fanIn = calculateFanInHealth(graph);
    const dependency = calculateDependencyHealth(graph);
    const modules = calculateModuleHealth(graph);

    const index =
        cycles.score * HEALTH_WEIGHTS.cycles +
        coupling.score * HEALTH_WEIGHTS.coupling +
        fanOut.score * HEALTH_WEIGHTS.fanOut +
        fanIn.score * HEALTH_WEIGHTS.fanIn +
        dependency.score * HEALTH_WEIGHTS.dependency +
        modules.score * HEALTH_WEIGHTS.modules;

    return {
        index,
        metrics: {
            cycles,
            coupling,
            fanOut,
            fanIn,
            dependency,
            modules,
        },
    };
}
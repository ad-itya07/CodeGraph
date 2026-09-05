import { Graph } from "@/graph/models/Graph.js";

import { GraphTraversal } from "./traversal/GraphTraversal.js";

import { ImpactAnalyzer } from "./impact/ImpactAnalyzer.js";
import { ImpactAnalysisOptions } from "./impact/models/ImpactAnalysisOptions.js";
import { ImpactAnalysisResult } from "./impact/models/ImpactAnalysisResult.js";

import { DependencyAnalyzer } from "./dependency/DependencyAnalyzer.js";
import { DependencyAnalysisOptions } from "./dependency/models/DependencyAnalysisOptions.js";
import { DependencyAnalysisResult } from "./dependency/models/DependencyAnalysisResult.js";

import { CycleAnalyzer } from "./cycles/CycleAnalyzer.js";
import { CycleAnalysisOptions } from "./cycles/models/CycleAnalysisOptions.js";
import { CycleAnalysisResult } from "./cycles/models/CycleAnalysisResult.js";

import { DependencyOrderingAnalyzer } from "./ordering/DependencyOrderingAnalyzer.js";
import { DependencyOrderingResult } from "./ordering/models/DependencyOrderingResult.js";

import { FanInOutAnalyzer } from "./connectivity/FanInOutAnalyzer.js";
import { FanInOutResult } from "./connectivity/models/FanInOutResult.js";

import { CallPathAnalyzer } from "./paths/CallPathAnalyzer.js";
import { CallPathResult } from "./paths/models/CallPathResult.js";

export class AnalysisEngine {
    private readonly impactAnalyzer: ImpactAnalyzer;
    private readonly dependencyAnalyzer: DependencyAnalyzer;
    private readonly cycleAnalyzer: CycleAnalyzer;
    private readonly dependencyOrderingAnalyzer: DependencyOrderingAnalyzer;
    private readonly fanInOutAnalyzer: FanInOutAnalyzer;
    private readonly callPathAnalyzer: CallPathAnalyzer;
    private readonly graphTraversal: GraphTraversal;

    constructor(private readonly graph: Graph) {
        this.graphTraversal = new GraphTraversal(graph);
        this.impactAnalyzer = new ImpactAnalyzer(this.graphTraversal);
        this.dependencyAnalyzer = new DependencyAnalyzer(this.graphTraversal);
        this.cycleAnalyzer = new CycleAnalyzer(graph);
        this.dependencyOrderingAnalyzer = new DependencyOrderingAnalyzer(graph);
        this.fanInOutAnalyzer = new FanInOutAnalyzer(graph);
        this.callPathAnalyzer = new CallPathAnalyzer(graph);
    }

    analyzeImpact(sourceNodeId: string, options?: ImpactAnalysisOptions): ImpactAnalysisResult {
        return this.impactAnalyzer.analyze(sourceNodeId, options);
    }

    analyzeDependencies(sourceNodeId: string, options?: DependencyAnalysisOptions): DependencyAnalysisResult {
        return this.dependencyAnalyzer.analyze(sourceNodeId, options);
    }

    analyzeCycles(options?: CycleAnalysisOptions): CycleAnalysisResult {
        return this.cycleAnalyzer.analyze(options);
    }

    analyzeDependencyOrdering(sourceNodeId: string): DependencyOrderingResult {
        return this.dependencyOrderingAnalyzer.analyze(sourceNodeId);
    }

    analyzeFanInOut(nodeId: string): FanInOutResult {
        return this.fanInOutAnalyzer.analyze(nodeId);
    }

    analyzeCallPath(sourceNodeId: string, targetNodeId: string): CallPathResult {
        return this.callPathAnalyzer.analyze(sourceNodeId, targetNodeId);
    }
}
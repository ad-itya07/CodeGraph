import { GraphTraversal } from "../traversal/GraphTraversal.js";
import { ImpactAnalysisOptions } from "./models/ImpactAnalysisOptions.js";
import { ImpactAnalysisResult } from "./models/ImpactAnalysisResult.js";

export class ImpactAnalyzer {
    constructor(private readonly traversal: GraphTraversal) { }

    analyze(sourceNodeId: string, options: ImpactAnalysisOptions = {}): ImpactAnalysisResult {
        const traversalResult = this.traversal.traverse(sourceNodeId, {
            direction: "incoming",
            relationshipKinds: [
                "calls",
                "imports",
                "extends",
                "implements",
                "instantiates",
            ],
            maxDepth: options.maxDepth,
        });

        return {
            sourceNodeId,
            impactedNodeIds: traversalResult.nodes,
            depthByNode: traversalResult.depthByNode,
        };
    }
}
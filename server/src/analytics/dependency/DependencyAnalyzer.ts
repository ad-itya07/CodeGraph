import { GraphTraversal } from "../traversal/GraphTraversal.js";

import { DependencyAnalysisOptions } from "./models/DependencyAnalysisOptions.js";
import { DependencyAnalysisResult } from "./models/DependencyAnalysisResult.js";

export class DependencyAnalyzer {
    constructor(private readonly traversal: GraphTraversal) { }

    analyze(sourceNodeId: string, options: DependencyAnalysisOptions = {}): DependencyAnalysisResult {
        const traversalResult = this.traversal.traverse(sourceNodeId, {
            direction: "outgoing",
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
            dependencyNodeIds: traversalResult.nodes,
            depthByNode: traversalResult.depthByNode,
        };
    }
}
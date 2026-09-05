import { Graph } from "@/graph/models/Graph.js";

import { CallPathResult } from "./models/CallPathResult.js";

export class CallPathAnalyzer {
    constructor(private readonly graph: Graph) { }

    private buildPath(sourceNodeId: string, targetNodeId: string, parent: Map<string, string>): string[] {
        const path: string[] = [];

        let currentNodeId: string | undefined = targetNodeId;

        while (currentNodeId !== undefined) {
            path.push(currentNodeId);

            if (currentNodeId === sourceNodeId) break;

            currentNodeId = parent.get(currentNodeId);
        }

        path.reverse();

        return path;
    }

    analyze(sourceNodeId: string, targetNodeId: string): CallPathResult {
        if (sourceNodeId === targetNodeId) {
            return {
                sourceNodeId,
                targetNodeId,
                path: [sourceNodeId],
            };
        }

        const visited = new Set<string>();
        const parent = new Map<string, string>();

        const stack: string[] = [sourceNodeId];

        visited.add(sourceNodeId);

        while (stack.length > 0) {
            const currentNodeId = stack.pop()!;

            const edgeIds =
                this.graph.outgoingEdges.get(currentNodeId) ?? [];

            for (const edgeId of edgeIds) {
                const edge = this.graph.edges.get(edgeId);

                if (!edge) continue;

                if (edge.relationshipKind !== "calls") continue;

                const targetNode = this.graph.nodes.get(edge.targetId);

                if (!targetNode || targetNode.kind !== "symbol") continue;

                if (visited.has(edge.targetId)) continue;

                visited.add(edge.targetId);
                parent.set(edge.targetId, currentNodeId);

                if (edge.targetId === targetNodeId) {
                    return {
                        sourceNodeId,
                        targetNodeId,
                        path: this.buildPath(
                            sourceNodeId,
                            targetNodeId,
                            parent
                        ),
                    };
                }

                stack.push(edge.targetId);
            }
        }

        return {
            sourceNodeId,
            targetNodeId,
            path: null,
        };
    }
}
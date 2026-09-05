import { Graph } from "@/graph/models/Graph.js";

import { DependencyOrderingResult } from "./models/DependencyOrderingResult.js";

const dependencyRelationshipKinds = new Set([
    "calls",
    "extends",
    "implements",
    "instantiates",
]);

export class DependencyOrderingAnalyzer {
    constructor(private readonly graph: Graph) { }

    private collectDependencies(sourceNodeId: string): string[] {
        const dependencies: string[] = [];
        const visited = new Set<string>();
        const stack = [sourceNodeId];

        visited.add(sourceNodeId);

        while (stack.length > 0) {
            const currentNodeId = stack.pop()!;

            const edgeIds =
                this.graph.outgoingEdges.get(currentNodeId) ?? [];

            for (const edgeId of edgeIds) {
                const edge = this.graph.edges.get(edgeId);

                if (!edge) continue;

                if (!dependencyRelationshipKinds.has(edge.relationshipKind)) continue;

                const targetNode = this.graph.nodes.get(edge.targetId);

                if (!targetNode || targetNode.kind !== "symbol") continue;

                if (visited.has(edge.targetId)) continue;

                visited.add(edge.targetId);
                dependencies.push(edge.targetId);
                stack.push(edge.targetId);
            }
        }

        return dependencies;
    }

    analyze(sourceNodeId: string): DependencyOrderingResult {
        const dependencyNodeIds = this.collectDependencies(sourceNodeId);

        const relevantNodeIds = new Set([
            sourceNodeId,
            ...dependencyNodeIds,
        ]);

        // CodeGraph:
        //
        // A → B
        //
        // means:
        // A depends on B
        //
        // For dependency-first ordering we conceptually reverse it:
        //
        // B → A
        //
        // So the indegree represents:
        // "how many dependencies must be processed before this node?"

        const indegree = new Map<string, number>();

        for (const nodeId of relevantNodeIds) {
            indegree.set(nodeId, 0);
        }

        for (const nodeId of relevantNodeIds) {
            const edgeIds = this.graph.outgoingEdges.get(nodeId) ?? [];

            for (const edgeId of edgeIds) {
                const edge = this.graph.edges.get(edgeId);

                if (!edge) continue;

                if (!dependencyRelationshipKinds.has(edge.relationshipKind)) continue;

                if (!relevantNodeIds.has(edge.targetId)) continue;

                // Original:
                //
                // nodeId → edge.targetId
                //
                // Means:
                // nodeId depends on edge.targetId
                //
                // Therefore edge.targetId must come first.
                //
                // In the ordering graph:
                //
                // edge.targetId → nodeId

                indegree.set(
                    nodeId,
                    indegree.get(nodeId)! + 1
                );
            }
        }

        const queue: string[] = [];

        for (const [nodeId, degree] of indegree) {
            if (degree === 0) {
                queue.push(nodeId);
            }
        }

        const orderedNodeIds: string[] = [];

        let queueIndex = 0;

        while (queueIndex < queue.length) {
            const nodeId = queue[queueIndex++];

            orderedNodeIds.push(nodeId);

            // We need to find nodes that depend on this node.
            const incomingEdgeIds =
                this.graph.incomingEdges.get(nodeId) ?? [];

            for (const edgeId of incomingEdgeIds) {
                const edge = this.graph.edges.get(edgeId);

                if (!edge) continue;

                if (!dependencyRelationshipKinds.has(edge.relationshipKind)) {
                    continue;
                }

                if (!relevantNodeIds.has(edge.sourceId)) {
                    continue;
                }

                const dependentNodeId = edge.sourceId;

                const newIndegree =
                    indegree.get(dependentNodeId)! - 1;

                indegree.set(
                    dependentNodeId,
                    newIndegree
                );

                if (newIndegree === 0) {
                    queue.push(dependentNodeId);
                }
            }
        }

        return {
            sourceNodeId,
            orderedNodeIds,
            isOrderable: orderedNodeIds.length === relevantNodeIds.size,
        };
    }
}
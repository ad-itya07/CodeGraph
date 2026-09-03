import { Graph } from "@/graph/models/Graph.js";
import { TraversalOptions } from "./models/TraversalOptions.js";
import { TraversalResult } from "./models/TraversalResult.js";

interface TraversalQueueItem {
    nodeId: string;
    depth: number;
}

export class GraphTraversal {
    constructor(private readonly graph: Graph) { }

    traverse(startNodeId: string, options: TraversalOptions): TraversalResult {
        const nodes: string[] = [];
        const depthByNode = new Map<string, number>();

        const visited = new Set<string>();
        const queue: TraversalQueueItem[] = [];

        visited.add(startNodeId);
        queue.push({ nodeId: startNodeId, depth: 0 });

        let queueIndex = 0;
        while (queueIndex < queue.length) {
            const current = queue[queueIndex++];

            if (options.maxDepth !== undefined && current.depth >= options.maxDepth) continue;

            const edgeIds =
                options.direction === "outgoing"
                    ? this.graph.outgoingEdges.get(current.nodeId)
                    : this.graph.incomingEdges.get(current.nodeId);

            if (!edgeIds) continue;

            for (const edgeId of edgeIds) {
                const edge = this.graph.edges.get(edgeId);

                if (!edge) continue;

                if (
                    options.relationshipKinds &&
                    !options.relationshipKinds.includes(edge.relationshipKind)
                ) continue;

                const nextNodeId =
                    options.direction === "outgoing"
                        ? edge.targetId
                        : edge.sourceId;

                if (visited.has(nextNodeId)) continue;

                const nextDepth = current.depth + 1;

                visited.add(nextNodeId);

                nodes.push(nextNodeId);
                depthByNode.set(nextNodeId, nextDepth);

                queue.push({
                    nodeId: nextNodeId,
                    depth: nextDepth,
                });
            }
        }

        return {
            startNodeId,
            nodes,
            depthByNode,
        };
    }
}
import { Graph } from "@/graph/models/Graph.js";
import { GraphNodeKind } from "@/graph/models/GraphNode.js";
import { RelationshipKind } from "@/parser/models/ParsedRelationship.js";

import { Cycle } from "./models/Cycle.js";
import { CycleAnalysisOptions } from "./models/CycleAnalysisOptions.js";
import { CycleAnalysisResult } from "./models/CycleAnalysisResult.js";
import { CycleType } from "./models/CycleType.js";

interface CycleProjection {
    nodeKind: GraphNodeKind;
    relationshipKind: RelationshipKind;
}

const cycleProjections: Record<CycleType, CycleProjection> = {
    "file-import": {
        nodeKind: "file",
        relationshipKind: "imports",
    },

    "symbol-call": {
        nodeKind: "symbol",
        relationshipKind: "calls",
    },

    "symbol-inheritance": {
        nodeKind: "symbol",
        relationshipKind: "extends",
    },

    "symbol-implementation": {
        nodeKind: "symbol",
        relationshipKind: "implements",
    },

    "symbol-instantiation": {
        nodeKind: "symbol",
        relationshipKind: "instantiates",
    },
};

export class CycleAnalyzer {
    constructor(private readonly graph: Graph) { }

    private findCycles(type: CycleType): Cycle[] {
        const projection = cycleProjections[type];

        const indices = new Map<string, number>();
        const lowLinks = new Map<string, number>();

        const stack: string[] = [];
        const onStack = new Set<string>();

        const stronglyConnectedComponents: string[][] = [];

        let index = 0;

        const nodeIds = this.graph.nodesByKind.get(projection.nodeKind) ?? [];

        const strongConnect = (nodeId: string): void => {
            indices.set(nodeId, index);
            lowLinks.set(nodeId, index);
            index++;

            stack.push(nodeId);
            onStack.add(nodeId);

            const edgeIds = this.graph.outgoingEdges.get(nodeId) ?? [];

            for (const edgeId of edgeIds) {
                const edge = this.graph.edges.get(edgeId);

                if (!edge) continue;

                if (edge.relationshipKind !== projection.relationshipKind) {
                    continue;
                }

                const targetNode = this.graph.nodes.get(edge.targetId);

                if (!targetNode || targetNode.kind !== projection.nodeKind) {
                    continue;
                }

                const targetNodeId = targetNode.id;

                if (!indices.has(targetNodeId)) {
                    strongConnect(targetNodeId);

                    lowLinks.set(
                        nodeId,
                        Math.min(
                            lowLinks.get(nodeId)!,
                            lowLinks.get(targetNodeId)!
                        )
                    );
                }
                else if (onStack.has(targetNodeId)) {
                    lowLinks.set(
                        nodeId,
                        Math.min(
                            lowLinks.get(nodeId)!,
                            indices.get(targetNodeId)!
                        )
                    );
                }
            }

            if (lowLinks.get(nodeId) !== indices.get(nodeId)) {
                return;
            }

            const component: string[] = [];

            while (true) {
                const componentNodeId = stack.pop()!;

                onStack.delete(componentNodeId);
                component.push(componentNodeId);

                if (componentNodeId === nodeId) {
                    break;
                }
            }

            stronglyConnectedComponents.push(component);
        };

        for (const nodeId of nodeIds) {
            if (!indices.has(nodeId)) {
                strongConnect(nodeId);
            }
        }

        return stronglyConnectedComponents
            .filter((component) => this.isCyclic(component, projection.relationshipKind))
            .map((component) => ({ type, nodeIds: component }));
    }

    private isCyclic(component: string[], relationshipKind: RelationshipKind): boolean {
        if (component.length > 1) return true;

        const nodeId = component[0];

        const edgeIds = this.graph.outgoingEdges.get(nodeId) ?? [];

        return [...edgeIds].some((edgeId) => {
            const edge = this.graph.edges.get(edgeId);

            return (
                edge !== undefined &&
                edge.relationshipKind === relationshipKind &&
                edge.targetId === nodeId
            );
        });
    }

    analyze(options: CycleAnalysisOptions = {}): CycleAnalysisResult {
        const types = options.types ?? Object.keys(cycleProjections) as CycleType[];

        const cycles: Cycle[] = [];

        for (const type of types) {
            cycles.push(...this.findCycles(type));
        }

        return {
            cycles,
        };
    }
}
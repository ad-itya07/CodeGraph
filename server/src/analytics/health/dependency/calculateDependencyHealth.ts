import { Graph } from "@/graph/models/Graph.js";

export interface DependencyHealthResult {
    score: number;
    dependencyRelationshipCount: number;
    fileCount: number;
    averageDependenciesPerFile: number;
}

const DEPENDENCY_FACTOR = 0.5;

export function calculateDependencyHealth(graph: Graph): DependencyHealthResult {
    const fileIds = graph.nodesByKind.get("file") ?? new Set<string>();

    if (fileIds.size === 0) {
        return {
            score: 100,
            dependencyRelationshipCount: 0,
            fileCount: 0,
            averageDependenciesPerFile: 0,
        };
    }

    let dependencyRelationshipCount = 0;

    for (const fileId of fileIds) {
        const edgeIds = graph.outgoingEdges.get(fileId) ?? new Set<string>();

        for (const edgeId of edgeIds) {
            const edge = graph.edges.get(edgeId);

            if (!edge) continue;

            const targetNode = graph.nodes.get(edge.targetId);

            if (targetNode?.kind === "dependency") {
                dependencyRelationshipCount++;
            }
        }
    }

    const averageDependenciesPerFile = dependencyRelationshipCount / fileIds.size;

    const normalizedRisk = DEPENDENCY_FACTOR * averageDependenciesPerFile;

    const score = 100 / (1 + normalizedRisk);

    return {
        score,
        dependencyRelationshipCount,
        fileCount: fileIds.size,
        averageDependenciesPerFile,
    };
}
import { Graph } from "@/graph/models/Graph.js";
import { RepositoryOverview } from "./models/RepositoryOverview.js";
import { CycleAnalyzer } from "../cycles/CycleAnalyzer.js";
import { calculateHealthIndex } from "../health/CalculateHealthIndex.js";

export class RepositoryOverviewAnalyzer {
    constructor(private readonly graph: Graph) { }

    analyze(): RepositoryOverview {
        const fileIds =
            this.graph.nodesByKind.get("file") ?? new Set<string>();

        const symbolIds =
            this.graph.nodesByKind.get("symbol") ?? new Set<string>();

        const dependencyIds =
            this.graph.nodesByKind.get("dependency") ?? new Set<string>();

        const moduleIds =
            this.graph.nodesByKind.get("module") ?? new Set<string>();

        let mostConnectedFileId: string | null = null;
        let mostConnectedFileConnections = -1;

        for (const nodeId of fileIds) {
            const fanIn = this.graph.incomingEdges.get(nodeId)?.size ?? 0;
            const fanOut = this.graph.outgoingEdges.get(nodeId)?.size ?? 0;

            const connections = fanIn + fanOut;

            if (connections > mostConnectedFileConnections) {
                mostConnectedFileConnections = connections;
                mostConnectedFileId = nodeId;
            }
        }

        let mostConnectedSymbolId: string | null = null;
        let mostConnectedSymbolConnections = -1;

        let highestFanInSymbolId: string | null = null;
        let highestFanIn = -1;

        let highestFanOutSymbolId: string | null = null;
        let highestFanOut = -1;

        for (const nodeId of symbolIds) {
            const fanIn = this.graph.incomingEdges.get(nodeId)?.size ?? 0;
            const fanOut = this.graph.outgoingEdges.get(nodeId)?.size ?? 0;

            const connections = fanIn + fanOut;

            if (connections > mostConnectedSymbolConnections) {
                mostConnectedSymbolConnections = connections;
                mostConnectedSymbolId = nodeId;
            }

            if (fanIn > highestFanIn) {
                highestFanIn = fanIn;
                highestFanInSymbolId = nodeId;
            }

            if (fanOut > highestFanOut) {
                highestFanOut = fanOut;
                highestFanOutSymbolId = nodeId;
            }
        }

        const cycleAnalyzer = new CycleAnalyzer(this.graph);

        const cycleCount = cycleAnalyzer.analyze().cycles.length;

        const health = calculateHealthIndex(this.graph);

        return {
            statistics: {
                fileCount: fileIds.size,
                symbolCount: symbolIds.size,
                relationshipCount: this.graph.edges.size,
                dependencyCount: dependencyIds.size,
                moduleCount: moduleIds.size,
            },

            health,

            insights: {
                mostConnectedFileId,
                mostConnectedFileConnections,

                mostConnectedSymbolId,
                mostConnectedSymbolConnections,

                highestFanInSymbolId,
                highestFanIn,

                highestFanOutSymbolId,
                highestFanOut,

                cycleCount,
            },
        };
    }
}

export default RepositoryOverviewAnalyzer;
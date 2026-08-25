import { ParsedRepository } from "@/parser/models/ParsedRepository.js";
import { ParsedRelationship } from "@/parser/models/ParsedRelationship.js";

import { Graph } from "./models/Graph.js";
import { GraphNode } from "./models/GraphNode.js";
import { GraphEdge } from "./models/GraphEdge.js";

import { getGraphNodeId } from "./utils/getGraphNodeId.js";
import { FileNode } from "./models/Nodes/FileNode.js";
import { SymbolNode } from "./models/Nodes/SymbolNode.js";
import { DependencyNode } from "./models/Nodes/DependencyNode.js";
import { ModuleNode } from "./models/Nodes/ModuleNode.js";
import { GraphValidationError } from "@/errors/GraphValidationError.js";
import { GraphIndexError } from "@/errors/GraphIndexError.js";

export class GraphBuilder {

    // ============================================================
    // Node Construction
    // ============================================================

    // Creates a graph node for each parsed source file.
    private addFileNodes(graph: Graph, repository: ParsedRepository): void {
        for (const file of repository.files) {
            const node: FileNode = {
                id: getGraphNodeId("file", file.filePath),
                kind: "file",
                filePath: file.filePath,
            };

            this.addNode(graph, node);
        }
    }

    // Creates a graph node for each parsed symbol and associates it with the file that contains the symbol.
    private addSymbolNodes(graph: Graph, repository: ParsedRepository): void {
        for (const file of repository.files) {
            for (const symbol of file.symbols) {
                const node: SymbolNode = {
                    id: getGraphNodeId("symbol", symbol.id),
                    kind: "symbol",
                    name: symbol.name,
                    symbolKind: symbol.symbolKind,
                    fileId: getGraphNodeId("file", file.filePath),
                };

                this.addNode(graph, node);
            }
        }
    }

    // Creates dependency graph nodes from repository package metadata rather than relationships 
    private addDependencyNodes(graph: Graph, repository: ParsedRepository): void {
        const packageJsons = repository.metadata.packageJsons;

        for (const packageJson of packageJsons) {

            const dependencies = [
                ...packageJson.dependencies,
                ...packageJson.devDependencies,
            ];

            for (const dependency of dependencies) {
                const node: DependencyNode = {
                    id: getGraphNodeId("dependency", dependency.id),
                    kind: "dependency",
                    name: dependency.name,
                    version: dependency.version,
                    packageJsonPath: packageJson.filePath,
                };

                this.addNode(graph, node);
            }
        }
    }

    // Creates graph nodes for unresolved modules referenced by extracted relationships.
    private addModuleNodes(graph: Graph, repository: ParsedRepository): void {
        for (const relationship of repository.relationships) {
            if (relationship.targetKind !== "module") {
                continue;
            }

            const node: ModuleNode = {
                id: getGraphNodeId("module", relationship.targetId),
                kind: "module",
                name: relationship.targetId,
            };

            this.addNode(graph, node);
        }
    }

    // ============================================================
    // Edge Construction
    // ============================================================

    // Converts relationship metadata into edges, using normalized IDs.
    private addRelationshipEdges(graph: Graph, relationships: ParsedRelationship[]): void {
        for (const relationship of relationships) {
            const edge: GraphEdge = {
                id: relationship.id,
                sourceId: getGraphNodeId(relationship.sourceKind, relationship.sourceId),
                targetId: getGraphNodeId(relationship.targetKind, relationship.targetId),
                relationshipKind: relationship.relationshipKind,
            };

            this.addEdge(graph, edge);
        }
    }

    // ============================================================
    // Graph Mutation
    // ============================================================

    // Adds a node to the graph and updates the node-kind index, ignoring duplicates.
    private addNode(graph: Graph, node: GraphNode): void {
        if (graph.nodes.has(node.id)) return;

        graph.nodes.set(node.id, node);

        if (!graph.nodesByKind.has(node.kind)) {
            graph.nodesByKind.set(node.kind, new Set());
        }

        graph.nodesByKind.get(node.kind)!.add(node.id);
    }

    // Adds an edge to the graph and updates the incoming and outgoing edge indexes.
    private addEdge(graph: Graph, edge: GraphEdge): void {
        if (graph.edges.has(edge.id)) return;

        graph.edges.set(edge.id, edge);

        if (!graph.outgoingEdges.has(edge.sourceId)) {
            graph.outgoingEdges.set(edge.sourceId, new Set());
        }

        graph.outgoingEdges.get(edge.sourceId)!.add(edge.id);

        if (!graph.incomingEdges.has(edge.targetId)) {
            graph.incomingEdges.set(edge.targetId, new Set());
        }

        graph.incomingEdges.get(edge.targetId)!.add(edge.id);
    }

    // ============================================================
    // Graph Validation
    // ============================================================

    /**
     * Validates that every graph edge references existing source and
     * target nodes.
     *
     * Throws an error if an edge references a node that is not present in the graph.
     */
    private validateGraph(graph: Graph): void {
        for (const edge of graph.edges.values()) {

            if (!graph.nodes.has(edge.sourceId)) {
                throw new GraphValidationError(edge.id, edge.sourceId, edge.targetId);
            }

            if (!graph.nodes.has(edge.targetId)) {
                throw new GraphValidationError(edge.id, edge.sourceId, edge.targetId);
            }
        }
    }

    /**
     * Validates that graph indexes are consistent with the primary
     * node and edge stores.
     */
    private validateIndexes(graph: Graph): void {
        for (const node of graph.nodes.values()) {
            const nodeIds = graph.nodesByKind.get(node.kind);

            if (!nodeIds?.has(node.id)) {
                throw new GraphIndexError(`Node "${node.id}" is missing from nodesByKind index`);
            }
        }

        for (const edge of graph.edges.values()) {

            const outgoing = graph.outgoingEdges.get(edge.sourceId);
            if (!outgoing?.has(edge.id)) {
                throw new GraphIndexError(`Edge "${edge.id}" is missing from outgoingEdges index`);
            }

            const incoming = graph.incomingEdges.get(edge.targetId);
            if (!incoming?.has(edge.id)) {
                throw new GraphIndexError(`Edge "${edge.id}" is missing from incomingEdges index`);
            }
        }
    }

    // ============================================================
    // Graph Construction
    // ============================================================

    /**
     * Builds the canonical repository graph from the parsed repository.
     *
     * The builder first creates entity nodes and then converts the
     * extracted relationships into graph edges.
     */
    build(repository: ParsedRepository): Graph {
        const graph: Graph = {
            nodes: new Map(),
            edges: new Map(),

            nodesByKind: new Map(),

            outgoingEdges: new Map(),
            incomingEdges: new Map(),
        };

        this.addFileNodes(graph, repository);
        this.addSymbolNodes(graph, repository);
        this.addDependencyNodes(graph, repository);
        this.addModuleNodes(graph, repository);

        this.addRelationshipEdges(graph, repository.relationships);

        this.validateGraph(graph);
        this.validateIndexes(graph);

        return graph;
    }
}
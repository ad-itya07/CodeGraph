import { Graph } from "./models/Graph.js";
import { GraphEdge } from "./models/GraphEdge.js";
import { GraphNode, GraphNodeKind } from "./models/GraphNode.js";

const dependencyRelationshipKinds = new Set([
    "calls",
    "imports",
    "extends",
    "implements",
    "instantiates",
]);

export class GraphQuery {
    constructor(private readonly graph: Graph) { }

    // ============================================================
    // Primitive Graph Queries
    // ============================================================

    getOutgoingEdges(nodeId: string): GraphEdge[] {
        const edgeIds = this.graph.outgoingEdges.get(nodeId);

        if (!edgeIds) return [];

        return [...edgeIds]
            .map((edgeId) => this.graph.edges.get(edgeId))
            .filter((edge): edge is GraphEdge => edge !== undefined);
    }

    getIncomingEdges(nodeId: string): GraphEdge[] {
        const edgeIds = this.graph.incomingEdges.get(nodeId);

        if (!edgeIds) return [];

        return [...edgeIds]
            .map((edgeId) => this.graph.edges.get(edgeId))
            .filter((edge): edge is GraphEdge => edge !== undefined);
    }

    getNode(nodeId: string): GraphNode | undefined {
        return this.graph.nodes.get(nodeId);
    }

    getNodesByKind(kind: GraphNodeKind): GraphNode[] {
        const nodeIds = this.graph.nodesByKind.get(kind);

        if (!nodeIds) return [];

        return [...nodeIds]
            .map((nodeId) => this.graph.nodes.get(nodeId))
            .filter((node): node is GraphNode => node !== undefined);
    }

    // ============================================================
    // Derived Graph Queries
    // ============================================================

    // CALLED_BY
    getCallers(nodeId: string): GraphNode[] {
        const callers: GraphNode[] = [];
        for (const edgeId of this.graph.incomingEdges.get(nodeId) || []) {
            const edge = this.graph.edges.get(edgeId);

            if (!edge || edge.relationshipKind !== "calls") continue;

            const callerNodeId = edge.sourceId;
            const callerNode = this.graph.nodes.get(callerNodeId);

            if (callerNode && callerNode.kind === "symbol") callers.push(callerNode);
        }
        return callers;
    }

    // CALLS
    getCallees(nodeId: string): GraphNode[] {
        const callees: GraphNode[] = [];
        for (const edgeId of this.graph.outgoingEdges.get(nodeId) || []) {
            const edge = this.graph.edges.get(edgeId);

            if (!edge || edge.relationshipKind !== "calls") continue;

            const calleNodeId = edge.targetId;
            const calleNode = this.graph.nodes.get(calleNodeId);

            if (calleNode && calleNode.kind === "symbol") callees.push(calleNode);
        }
        return callees;
    }

    // get dependencies a node is dependent on
    getPackageDependencies(nodeId: string): GraphNode[] {
        const packageDependencies: GraphNode[] = [];
        for (const edgeId of this.graph.outgoingEdges.get(nodeId) || []) {
            const edge = this.graph.edges.get(edgeId);

            if (!edge || edge.relationshipKind !== "imports") continue;

            const dependencyNodeId = edge.targetId;
            const dependencyNode = this.graph.nodes.get(dependencyNodeId);

            if (dependencyNode && dependencyNode.kind === "dependency") packageDependencies.push(dependencyNode);
        }
        return packageDependencies;
    }

    // get nodes that depend on a dependency
    getImporters(nodeId: string): GraphNode[] {
        const importers: GraphNode[] = [];
        for (const edgeId of this.graph.incomingEdges.get(nodeId) || []) {
            const edge = this.graph.edges.get(edgeId);

            if (!edge || edge.relationshipKind !== "imports") continue;

            const importerNodeId = edge.sourceId;
            const importerNode = this.graph.nodes.get(importerNodeId);

            if (importerNode && importerNode.kind === "file") importers.push(importerNode);
        }
        return importers;
    }

    // get files that a node has imported
    getImportedFiles(nodeId: string): GraphNode[] {
        const importedFiles: GraphNode[] = [];

        for (const edgeId of this.graph.outgoingEdges.get(nodeId) || []) {
            const edge = this.graph.edges.get(edgeId);

            if (!edge || edge.relationshipKind !== "imports") continue;

            const importerNodeId = edge.targetId;
            const importerNode = this.graph.nodes.get(importerNodeId);

            if (importerNode && importerNode.kind === "file") importedFiles.push(importerNode);
        }
        return importedFiles;
    }

    // get child/base class of a node
    getBaseClasses(nodeId: string): GraphNode[] {
        const baseClasses: GraphNode[] = [];
        for (const edgeId of this.graph.outgoingEdges.get(nodeId) || []) {
            const edge = this.graph.edges.get(edgeId);

            if (!edge || edge.relationshipKind !== "extends") continue;

            const baseClassNodeId = edge.targetId;
            const baseClassNode = this.graph.nodes.get(baseClassNodeId);

            if (baseClassNode && baseClassNode.kind === "symbol") baseClasses.push(baseClassNode);
        }
        return baseClasses;
    }

    // get parent/sub class of a node 
    getSubclasses(nodeId: string): GraphNode[] {
        const subClasses: GraphNode[] = [];
        for (const edgeId of this.graph.incomingEdges.get(nodeId) || []) {
            const edge = this.graph.edges.get(edgeId);

            if (!edge || edge.relationshipKind !== "extends") continue;

            const subClassNodeId = edge.sourceId;
            const subClassNode = this.graph.nodes.get(subClassNodeId);

            if (subClassNode && subClassNode.kind === "symbol") subClasses.push(subClassNode);
        }
        return subClasses;
    }

    // get the implemented interface of a node
    getImplementedInterfaces(nodeId: string): GraphNode[] {
        const implementedInterfaces: GraphNode[] = [];
        for (const edgeId of this.graph.outgoingEdges.get(nodeId) || []) {
            const edge = this.graph.edges.get(edgeId);

            if (!edge || edge.relationshipKind !== "implements") continue;

            const implementedInterfaceId = edge.targetId;
            const implementedInterfaceNode = this.graph.nodes.get(implementedInterfaceId);

            if (implementedInterfaceNode && implementedInterfaceNode.kind === "symbol") implementedInterfaces.push(implementedInterfaceNode);
        }
        return implementedInterfaces;
    }

    // get the node that implements a specific interface
    getImplementations(nodeId: string): GraphNode[] {
        const implementations: GraphNode[] = [];
        for (const edgeId of this.graph.incomingEdges.get(nodeId) || []) {
            const edge = this.graph.edges.get(edgeId);

            if (!edge || edge.relationshipKind !== "implements") continue;

            const implementationNodeId = edge.sourceId;
            const implementationNode = this.graph.nodes.get(implementationNodeId);

            if (implementationNode && implementationNode.kind === "symbol") implementations.push(implementationNode);
        }
        return implementations;
    }

    // get nodes which this provided node directly depends on
    getDependentNodes(nodeId: string): GraphNode[] {
        const dependentNodes: GraphNode[] = [];
        for (const edgeId of this.graph.outgoingEdges.get(nodeId) || []) {
            const edge = this.graph.edges.get(edgeId);

            if (!edge || !dependencyRelationshipKinds.has(edge.relationshipKind)) continue;

            const dependentNode = this.graph.nodes.get(edge.targetId);

            if (dependentNode) dependentNodes.push(dependentNode);
        }

        return dependentNodes;
    }

    // get nodes which directly depends on this provided node
    getDependents(nodeId: string): GraphNode[] {
        const dependents: GraphNode[] = [];
        for (const edgeId of this.graph.incomingEdges.get(nodeId) || []) {
            const edge = this.graph.edges.get(edgeId);

            if (!edge || !dependencyRelationshipKinds.has(edge.relationshipKind)) continue;

            const dependentNode = this.graph.nodes.get(edge.sourceId);

            if (dependentNode) dependents.push(dependentNode);
        }

        return dependents;
    }

}
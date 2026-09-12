import { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma.js";
import { Graph } from "@/graph/models/Graph.js";
import { GraphEdge } from "@/graph/models/GraphEdge.js";
import { GraphNode } from "@/graph/models/GraphNode.js";
import { deserializeGraph, serializeGraph } from "@/graph/serialization/graphSerializer.js";
import { PersistedGraph } from "@/graph/serialization/models/PersistedGraph.js";
import { DatabaseError } from "@/errors/DatabaseError.js";
import { GraphNotFoundError } from "@/errors/GraphNotFoundError.js";

export async function createGraph(repositoryId: string, graph: Graph) {
    try {
        const persistedGraph = serializeGraph(graph);

        return await prisma.graph.create({
            data: {
                repositoryId,

                nodes: {
                    create: persistedGraph.nodes.map((node) => ({
                        id: node.id,
                        kind: node.kind,
                        data: node as unknown as Prisma.InputJsonValue,
                    })),
                },

                edges: {
                    create: persistedGraph.edges.map((edge) => ({
                        id: edge.id,
                        sourceId: edge.sourceId,
                        targetId: edge.targetId,
                        relationshipKind: edge.relationshipKind,
                    })),
                },
            },
        });
    } catch (err: any) {
        if (err instanceof GraphNotFoundError) {
            throw err;
        }
        throw new DatabaseError(err.message);
    }
}

export async function getGraph(repositoryId: string): Promise<Graph> {
    try {
        const graph = await prisma.graph.findUnique({
            where: {
                repositoryId,
            },
            include: {
                nodes: true,
                edges: true,
            },
        });

        if (!graph) {
            throw new GraphNotFoundError();
        }

        const persistedGraph: PersistedGraph = {
            nodes: graph.nodes.map(
                (node) => node.data as unknown as GraphNode
            ),

            edges: graph.edges.map((edge) => ({
                id: edge.id,
                sourceId: edge.sourceId,
                targetId: edge.targetId,
                relationshipKind: edge.relationshipKind as GraphEdge["relationshipKind"],
            })),
        };

        return deserializeGraph(persistedGraph);
    } catch (err: any) {
        throw new DatabaseError(err.message);
    }
}
import { GraphNodeKind } from "../models/GraphNode.js";

export function getGraphNodeId(kind: GraphNodeKind, id: string): string {
    return `${kind}:${id}`;
}
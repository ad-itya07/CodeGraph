export interface TraversalResult {
    startNodeId: string;
    nodes: string[];
    depthByNode: Map<string, number>;
}
export interface ImpactAnalysisResult {
    sourceNodeId: string;
    impactedNodeIds: string[];
    depthByNode: Map<string, number>;
}
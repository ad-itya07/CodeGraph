export interface DependencyAnalysisResult {
    sourceNodeId: string;
    dependencyNodeIds: string[];
    depthByNode: Map<string, number>;
}
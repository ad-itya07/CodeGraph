export interface DependencyOrderingResult {
    sourceNodeId: string;
    orderedNodeIds: string[];
    isOrderable: boolean;
}
// Shared TypeScript types mirroring the backend graph models

export type GraphNodeKind = "file" | "symbol" | "dependency" | "module";

export type SymbolKind =
  | "function"
  | "method"
  | "class"
  | "interface"
  | "variable"
  | "enum"
  | "typeAlias"
  | "objectProperty";

export type MethodKind = "get" | "set" | "method" | "private";

export type RelationshipKind =
  | "calls"
  | "imports"
  | "exports"
  | "extends"
  | "implements"
  | "instantiates"
  | "references";

export interface SymbolLocation {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

// Node types
export interface FileNode {
  id: string;
  kind: "file";
  filePath: string;
}

export interface SymbolNode {
  id: string;
  kind: "symbol";
  name: string;
  symbolKind: SymbolKind;
  methodKind?: MethodKind;
  location: SymbolLocation;
  fileId: string;
  parentSymbolId?: string;
}

export interface DependencyNode {
  id: string;
  kind: "dependency";
  name: string;
  version: string;
  packageJsonPath: string;
}

export interface ModuleNode {
  id: string;
  kind: "module";
  name: string;
}

export type GraphNode = FileNode | SymbolNode | DependencyNode | ModuleNode;

// Edge type
export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationshipKind: RelationshipKind;
}

// Serialized graph (what the API returns)
export interface SerializedGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Repository types
export interface Repository {
  id: string;
  url: string;
  name: string;
  commitSha: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  overview?: RepositoryOverview;
}

// Health types
export interface CycleHealthResult {
  score: number;
  cycleCount: number;
  cyclicFileCount: number;
  cyclicSymbolCount: number;
  fileCycleRatio: number;
  symbolCycleRatio: number;
}

export interface CouplingHealthResult {
  score: number;
  averageStructuralDegree: number;
}

export interface FanOutHealthResult {
  score: number;
  averageFanOut: number;
  rootMeanSquareFanOut: number;
  maximumFanOut: number;
}

export interface FanInHealthResult {
  score: number;
  averageFanIn: number;
  rootMeanSquareFanIn: number;
  highestFanIn: number;
}

export interface DependencyHealthResult {
  score: number;
  averageDependenciesPerFile: number;
}

export interface ModuleHealthResult {
  score: number;
  moduleCount: number;
  moduleRatio: number;
}

export interface RepositoryHealthResult {
  index: number;
  metrics: {
    cycles: CycleHealthResult;
    coupling: CouplingHealthResult;
    fanOut: FanOutHealthResult;
    fanIn: FanInHealthResult;
    dependency: DependencyHealthResult;
    modules: ModuleHealthResult;
  };
}

// Overview types
export interface RepositoryStatistics {
  fileCount: number;
  symbolCount: number;
  relationshipCount: number;
  dependencyCount: number;
  moduleCount: number;
}

export interface RepositoryInsights {
  mostConnectedFileId: string | null;
  mostConnectedFileConnections: number;
  mostConnectedSymbolId: string | null;
  mostConnectedSymbolConnections: number;
  highestFanInSymbolId: string | null;
  highestFanIn: number;
  highestFanOutSymbolId: string | null;
  highestFanOut: number;
  cycleCount: number;
}

export interface RepositoryOverview {
  id: string;
  repositoryId: string;
  statistics: RepositoryStatistics;
  health: RepositoryHealthResult;
  insights: RepositoryInsights;
}

// Analysis result types
export interface ImpactAnalysisResult {
  sourceNodeId: string;
  impactedNodeIds: string[];
  depthByNode: Record<string, number>;
}

export interface DependencyAnalysisResult {
  sourceNodeId: string;
  dependencyNodeIds: string[];
  depthByNode: Record<string, number>;
}

export interface CallPathResult {
  sourceNodeId: string;
  targetNodeId: string;
  path: string[] | null;
}

export type CycleType =
  | "file-import"
  | "symbol-call"
  | "symbol-inheritance"
  | "symbol-implementation"
  | "symbol-instantiation";

export interface Cycle {
  type: CycleType;
  nodeIds: string[];
}

export interface CycleAnalysisResult {
  cycles: Cycle[];
}

export interface DependencyOrderingResult {
  sourceNodeId: string;
  orderedNodeIds: string[];
  isOrderable: boolean;
}

export interface FanInOutResult {
  nodeId: string;
  fanIn: number;
  fanOut: number;
}

export type AnalysisType =
  | "home"
  | "cycles"
  | "impact"
  | "dependencies"
  | "ordering"
  | "connectivity"
  | "call-path";

// Auth types
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Recent Activity types
export interface AnalysisActivity {
  id: string;
  userId: string;
  repositoryId: string;
  analysisType: "impact" | "dependencies" | "call-path" | "cycles" | "ordering" | "connectivity";
  timestamp: string;
  entityId?: string;
  entityName?: string;
  entityKind?: string;
  entityPath?: string;
  targetEntityId?: string;
  targetEntityName?: string;
  targetEntityKind?: string;
  targetEntityPath?: string;
  details?: Record<string, any>;
}

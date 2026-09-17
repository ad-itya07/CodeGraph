import type {
  GraphNode,
  FileNode,
  DependencyNode,
  ModuleNode,
  GraphEdge,
  SymbolKind,
  MethodKind,
  SymbolLocation,
  RelationshipKind,
} from "@/types";

export interface ExplorerFileNode {
  isFolder: false;
  name: string;
  fullPath: string;
  fileId: string;
  extension: string;
}

export interface ExplorerFolderNode {
  isFolder: true;
  name: string;
  fullPath: string;
  children: Array<ExplorerFolderNode | ExplorerFileNode>;
}

export type FileTreeNode = ExplorerFolderNode | ExplorerFileNode;

export interface CodeEntityExplorerItem {
  id: string; // graph node id: "symbol:..."
  name: string;
  symbolKind: SymbolKind;
  methodKind?: MethodKind;
  location: SymbolLocation;
  fileId: string;
  parentSymbolId?: string;
  parentId?: string; // resolved parent entity id if any
  children: CodeEntityExplorerItem[];
}

export interface RelationshipExplorerItem {
  id: string;
  relationshipKind: RelationshipKind;
  sourceId: string;
  targetId: string;
  isOutgoing: boolean;
  relatedNodeId: string;
  relatedNode?: GraphNode;
  relatedFileId?: string;
}

export interface StructuralEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationshipKind: "contains";
  isStructural: true;
}

export interface NormalizedExplorerData {
  fileTree: ExplorerFolderNode;
  filesById: Map<string, FileNode>;
  filesByPath: Map<string, FileNode>;
  symbolsByFileId: Map<string, CodeEntityExplorerItem[]>;
  allSymbolsById: Map<string, CodeEntityExplorerItem>;
  dependenciesByFileId: Map<string, DependencyNode[]>;
  allDependenciesById: Map<string, DependencyNode>;
  modulesByFileId: Map<string, ModuleNode[]>;
  allModulesById: Map<string, ModuleNode>;
  outgoingEdgesByNodeId: Map<string, GraphEdge[]>;
  incomingEdgesByNodeId: Map<string, GraphEdge[]>;
  edgesById: Map<string, GraphEdge>;
  nodesById: Map<string, GraphNode>;
}

export type CenterTab = "symbols" | "relationships" | "dependencies" | "modules";
export type ContextPanelTab = "graph" | "inspector";

export const ALL_SYMBOL_KINDS: SymbolKind[] = [
  "function",
  "method",
  "class",
  "interface",
  "variable",
  "enum",
  "typeAlias",
  "objectProperty",
];

export const ALL_RELATIONSHIP_KINDS: RelationshipKind[] = [
  "calls",
  "imports",
  "exports",
  "extends",
  "implements",
  "instantiates",
  "references",
];

export interface GraphFilters {
  depth: number;
  relationshipKinds: Set<RelationshipKind>;
  showStructure: boolean;
  symbolsOnly: boolean;
  symbolKinds: Set<SymbolKind>;
}

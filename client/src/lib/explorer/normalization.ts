import type {
  SerializedGraph,
  GraphNode,
  FileNode,
  SymbolNode,
  DependencyNode,
  ModuleNode,
  GraphEdge,
  RelationshipKind,
  SymbolKind,
} from "@/types";
import type {
  ExplorerFolderNode,
  ExplorerFileNode,
  CodeEntityExplorerItem,
  NormalizedExplorerData,
  StructuralEdge,
} from "@/types/explorer";
import { getRepositoryRelativePath } from "./paths";

/**
 * Builds a hierarchical folder/file tree from a flat list of FileNodes.
 * Root folder is named after the repository, and paths are repository-relative.
 *
 * CANONICAL INVARIANT:
 * `fileId` on each file node retains the exact canonical backend node ID (e.g. `file:/...`).
 */
export function buildFileTree(
  files: FileNode[],
  repositoryName?: string | null,
  repositoryId?: string | null
): ExplorerFolderNode {
  const root: ExplorerFolderNode = {
    isFolder: true,
    name: repositoryName || "Repository",
    fullPath: "",
    children: [],
  };

  for (const file of files) {
    const relPath = getRepositoryRelativePath(file.filePath, repositoryId);
    const parts = relPath.split("/").filter(Boolean);
    let currentFolder = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join("/");

      if (isFile) {
        const dotIndex = part.lastIndexOf(".");
        const extension = dotIndex !== -1 ? part.slice(dotIndex + 1) : "";
        const fileNode: ExplorerFileNode = {
          isFolder: false,
          name: part,
          fullPath: relPath,
          fileId: file.id, // Preserves canonical backend ID
          extension,
        };
        currentFolder.children.push(fileNode);
      } else {
        let folderNode = currentFolder.children.find(
          (child): child is ExplorerFolderNode =>
            child.isFolder && child.name === part
        );

        if (!folderNode) {
          folderNode = {
            isFolder: true,
            name: part,
            fullPath: currentPath,
            children: [],
          };
          currentFolder.children.push(folderNode);
        }
        currentFolder = folderNode;
      }
    }
  }

  // Recursive alphabetical sort: folders first, then files
  function sortFolderChildren(folder: ExplorerFolderNode) {
    folder.children.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const child of folder.children) {
      if (child.isFolder) {
        sortFolderChildren(child);
      }
    }
  }

  sortFolderChildren(root);
  return root;
}

/**
 * Builds a hierarchical tree of code entities using parentSymbolId.
 */
export function buildSymbolHierarchy(
  symbolNodes: SymbolNode[]
): {
  hierarchical: CodeEntityExplorerItem[];
  allMap: Map<string, CodeEntityExplorerItem>;
} {
  const allMap = new Map<string, CodeEntityExplorerItem>();
  const rawItemMap = new Map<string, CodeEntityExplorerItem>();

  // Initialize item objects
  for (const sym of symbolNodes) {
    const item: CodeEntityExplorerItem = {
      id: sym.id, // Preserves canonical backend symbol ID
      name: sym.name,
      symbolKind: sym.symbolKind,
      methodKind: sym.methodKind,
      location: sym.location,
      fileId: sym.fileId,
      parentSymbolId: sym.parentSymbolId,
      children: [],
    };
    allMap.set(sym.id, item);

    // Also register raw symbol ID (without 'symbol:' prefix if present)
    const rawId = sym.id.startsWith("symbol:") ? sym.id.slice(7) : sym.id;
    rawItemMap.set(rawId, item);
    rawItemMap.set(sym.id, item);
  }

  const roots: CodeEntityExplorerItem[] = [];

  for (const sym of symbolNodes) {
    const item = allMap.get(sym.id)!;
    let parentFound = false;

    if (sym.parentSymbolId) {
      // Find candidate parent using raw ID or prefixed ID
      const parent =
        rawItemMap.get(sym.parentSymbolId) ||
        rawItemMap.get(`symbol:${sym.parentSymbolId}`);

      if (parent && parent.id !== item.id) {
        parent.children.push(item);
        item.parentId = parent.id;
        parentFound = true;
      }
    }

    if (!parentFound) {
      roots.push(item);
    }
  }

  // Sort children recursively by source line and column
  function sortItems(items: CodeEntityExplorerItem[]) {
    items.sort((a, b) => {
      if (a.location.startLine !== b.location.startLine) {
        return a.location.startLine - b.location.startLine;
      }
      return a.location.startColumn - b.location.startColumn;
    });

    for (const item of items) {
      if (item.children.length > 0) {
        sortItems(item.children);
      }
    }
  }

  sortItems(roots);
  return { hierarchical: roots, allMap };
}

/**
 * Normalizes a raw SerializedGraph into fast indexed lookup collections.
 */
export function normalizeGraph(
  graph: SerializedGraph,
  repositoryName?: string | null,
  repositoryId?: string | null
): NormalizedExplorerData {
  const filesById = new Map<string, FileNode>();
  const filesByPath = new Map<string, FileNode>();
  const rawSymbolsByFileId = new Map<string, SymbolNode[]>();
  const allDependenciesById = new Map<string, DependencyNode>();
  const allModulesById = new Map<string, ModuleNode>();
  const nodesById = new Map<string, GraphNode>();
  const edgesById = new Map<string, GraphEdge>();
  const outgoingEdgesByNodeId = new Map<string, GraphEdge[]>();
  const incomingEdgesByNodeId = new Map<string, GraphEdge[]>();

  // 1. Index nodes
  const rawFiles: FileNode[] = [];
  for (const node of graph.nodes) {
    nodesById.set(node.id, node);

    switch (node.kind) {
      case "file": {
        filesById.set(node.id, node);
        filesByPath.set(node.filePath, node);
        rawFiles.push(node);
        break;
      }
      case "symbol": {
        if (!rawSymbolsByFileId.has(node.fileId)) {
          rawSymbolsByFileId.set(node.fileId, []);
        }
        rawSymbolsByFileId.get(node.fileId)!.push(node);
        break;
      }
      case "dependency": {
        allDependenciesById.set(node.id, node);
        break;
      }
      case "module": {
        allModulesById.set(node.id, node);
        break;
      }
    }
  }

  // 2. Build file tree with repository name as root
  const fileTree = buildFileTree(rawFiles, repositoryName, repositoryId);

  // 3. Build symbol hierarchies per file
  const symbolsByFileId = new Map<string, CodeEntityExplorerItem[]>();
  const allSymbolsById = new Map<string, CodeEntityExplorerItem>();

  for (const [fileId, symbols] of rawSymbolsByFileId.entries()) {
    const { hierarchical, allMap } = buildSymbolHierarchy(symbols);
    symbolsByFileId.set(fileId, hierarchical);
    for (const [symId, item] of allMap.entries()) {
      allSymbolsById.set(symId, item);
    }
  }

  // 4. Index edges
  for (const edge of graph.edges) {
    edgesById.set(edge.id, edge);

    if (!outgoingEdgesByNodeId.has(edge.sourceId)) {
      outgoingEdgesByNodeId.set(edge.sourceId, []);
    }
    outgoingEdgesByNodeId.get(edge.sourceId)!.push(edge);

    if (!incomingEdgesByNodeId.has(edge.targetId)) {
      incomingEdgesByNodeId.set(edge.targetId, []);
    }
    incomingEdgesByNodeId.get(edge.targetId)!.push(edge);
  }

  // 5. Build dependencies and modules linked to files
  const dependenciesByFileId = new Map<string, DependencyNode[]>();
  const modulesByFileId = new Map<string, ModuleNode[]>();

  for (const file of rawFiles) {
    const depSet = new Map<string, DependencyNode>();
    const modSet = new Map<string, ModuleNode>();

    // Check direct file outgoing edges
    const directOutgoing = outgoingEdgesByNodeId.get(file.id) || [];
    for (const edge of directOutgoing) {
      const target = nodesById.get(edge.targetId);
      if (target?.kind === "dependency") {
        depSet.set(target.id, target);
      } else if (target?.kind === "module") {
        modSet.set(target.id, target);
      }
    }

    // Check symbol outgoing edges inside this file
    const fileSymbols = rawSymbolsByFileId.get(file.id) || [];
    for (const sym of fileSymbols) {
      const symOutgoing = outgoingEdgesByNodeId.get(sym.id) || [];
      for (const edge of symOutgoing) {
        const target = nodesById.get(edge.targetId);
        if (target?.kind === "dependency") {
          depSet.set(target.id, target);
        } else if (target?.kind === "module") {
          modSet.set(target.id, target);
        }
      }
    }

    dependenciesByFileId.set(file.id, Array.from(depSet.values()));
    modulesByFileId.set(file.id, Array.from(modSet.values()));
  }

  return {
    fileTree,
    filesById,
    filesByPath,
    symbolsByFileId,
    allSymbolsById,
    dependenciesByFileId,
    allDependenciesById,
    modulesByFileId,
    allModulesById,
    outgoingEdgesByNodeId,
    incomingEdgesByNodeId,
    edgesById,
    nodesById,
  };
}

/**
 * Extracts a bounded subgraph around a focus node up to `depth` hops.
 */
export function extractBoundedSubgraph({
  rootNodeId,
  depth,
  relationshipKinds,
  showStructure,
  symbolsOnly = false,
  symbolKinds,
  data,
}: {
  rootNodeId: string;
  depth: number;
  relationshipKinds: Set<RelationshipKind>;
  showStructure: boolean;
  symbolsOnly?: boolean;
  symbolKinds?: Set<SymbolKind>;
  data: NormalizedExplorerData;
}): {
  nodes: GraphNode[];
  edges: Array<GraphEdge | StructuralEdge>;
} {
  const rootNode = data.nodesById.get(rootNodeId);
  if (!rootNode) {
    return { nodes: [], edges: [] };
  }

  const visitedNodeIds = new Set<string>([rootNodeId]);
  const includedEdges = new Map<string, GraphEdge | StructuralEdge>();

  // Queue of { nodeId, currentDepth }
  let currentLevel = [rootNodeId];
  const maxDepth = Math.max(1, Math.min(3, depth));

  for (let d = 0; d < maxDepth; d++) {
    const nextLevel: string[] = [];

    for (const nodeId of currentLevel) {
      // 1. Traverse outgoing explicit edges
      const outgoing = data.outgoingEdgesByNodeId.get(nodeId) || [];
      for (const edge of outgoing) {
        if (!relationshipKinds.has(edge.relationshipKind)) continue;

        includedEdges.set(edge.id, edge);

        if (!visitedNodeIds.has(edge.targetId)) {
          visitedNodeIds.add(edge.targetId);
          nextLevel.push(edge.targetId);
        }
      }

      // 2. Traverse incoming explicit edges
      const incoming = data.incomingEdgesByNodeId.get(nodeId) || [];
      for (const edge of incoming) {
        if (!relationshipKinds.has(edge.relationshipKind)) continue;

        includedEdges.set(edge.id, edge);

        if (!visitedNodeIds.has(edge.sourceId)) {
          visitedNodeIds.add(edge.sourceId);
          nextLevel.push(edge.sourceId);
        }
      }

      // 3. Traverse structural containment edges if enabled
      if (showStructure) {
        const symbolItem = data.allSymbolsById.get(nodeId);
        if (symbolItem) {
          // Parent link
          if (symbolItem.parentId) {
            const parentId = symbolItem.parentId;
            const structEdgeId = `struct:${parentId}->${nodeId}`;
            if (!includedEdges.has(structEdgeId)) {
              includedEdges.set(structEdgeId, {
                id: structEdgeId,
                sourceId: parentId,
                targetId: nodeId,
                relationshipKind: "contains",
                isStructural: true,
              });
            }
            if (!visitedNodeIds.has(parentId)) {
              visitedNodeIds.add(parentId);
              nextLevel.push(parentId);
            }
          }

          // Children links
          for (const child of symbolItem.children) {
            const childId = child.id;
            const structEdgeId = `struct:${nodeId}->${childId}`;
            if (!includedEdges.has(structEdgeId)) {
              includedEdges.set(structEdgeId, {
                id: structEdgeId,
                sourceId: nodeId,
                targetId: childId,
                relationshipKind: "contains",
                isStructural: true,
              });
            }
            if (!visitedNodeIds.has(childId)) {
              visitedNodeIds.add(childId);
              nextLevel.push(childId);
            }
          }
        }
      }
    }

    currentLevel = nextLevel;
    if (currentLevel.length === 0) break;
  }

  // Filter collected nodes according to symbolsOnly and symbolKinds
  const nodes: GraphNode[] = [];
  const validNodeIds = new Set<string>();

  for (const nodeId of visitedNodeIds) {
    const node = data.nodesById.get(nodeId);
    if (!node) continue;

    // Root anchor node is always kept for graph context
    if (node.id === rootNodeId) {
      nodes.push(node);
      validNodeIds.add(node.id);
      continue;
    }

    // If symbolsOnly is active, filter out non-symbol nodes
    if (symbolsOnly && node.kind !== "symbol") {
      continue;
    }

    // If symbolKinds filter is active, filter symbols not in the allowed set
    if (node.kind === "symbol" && symbolKinds && !symbolKinds.has(node.symbolKind)) {
      continue;
    }

    nodes.push(node);
    validNodeIds.add(node.id);
  }

  // Filter edges to only connect nodes that survived the filter
  const validEdges = Array.from(includedEdges.values()).filter(
    (edge) => validNodeIds.has(edge.sourceId) && validNodeIds.has(edge.targetId)
  );

  return {
    nodes,
    edges: validEdges,
  };
}

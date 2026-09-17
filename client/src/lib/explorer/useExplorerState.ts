"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import type { RelationshipKind, SymbolKind } from "@/types";
import type {
  CenterTab,
  ContextPanelTab,
  GraphFilters,
  NormalizedExplorerData,
  ExplorerFolderNode,
} from "@/types/explorer";
import { ALL_SYMBOL_KINDS, ALL_RELATIONSHIP_KINDS } from "@/types/explorer";

export interface ExplorerState {
  selectedFileId: string | null;
  selectedEntityId: string | null;
  selectedRelationshipId: string | null;
  centerTab: CenterTab;
  contextPanelTab: ContextPanelTab;
  graphFilters: GraphFilters;
  fileSearch: string;
  symbolSearch: string;
  symbolKindFilter: SymbolKind | "all";
  relationshipSearch: string;
  relationshipKindFilter: RelationshipKind | "all";
  relationshipDirectionFilter: "all" | "incoming" | "outgoing";
  dependencySearch: string;
  moduleSearch: string;
  expandedFolders: Set<string>;
  expandedSymbols: Set<string>;
}

export function useExplorerState(data: NormalizedExplorerData | null) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Initial state derived from URL query parameters if present
  const initialFileId = searchParams.get("file");
  const initialEntityId = searchParams.get("entity");
  const initialTab = searchParams.get("tab") as CenterTab | null;
  const initialPanel = searchParams.get("panel") as ContextPanelTab | null;

  const [selectedFileId, setSelectedFileId] = useState<string | null>(initialFileId);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(initialEntityId);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null);

  const [centerTab, setCenterTabState] = useState<CenterTab>(
    initialTab && ["symbols", "relationships", "dependencies", "modules"].includes(initialTab)
      ? initialTab
      : "symbols"
  );

  const [contextPanelTab, setContextPanelTabState] = useState<ContextPanelTab>(
    initialPanel && ["graph", "inspector"].includes(initialPanel)
      ? initialPanel
      : "graph"
  );

  const [graphFilters, setGraphFilters] = useState<GraphFilters>({
    depth: 1,
    relationshipKinds: new Set<RelationshipKind>(ALL_RELATIONSHIP_KINDS),
    showStructure: true,
    symbolsOnly: false,
    symbolKinds: new Set<SymbolKind>(ALL_SYMBOL_KINDS),
  });

  // Search & filter states
  const [fileSearch, setFileSearch] = useState("");
  const [symbolSearch, setSymbolSearch] = useState("");
  const [symbolKindFilter, setSymbolKindFilter] = useState<SymbolKind | "all">("all");
  const [relationshipSearch, setRelationshipSearch] = useState("");
  const [relationshipKindFilter, setRelationshipKindFilter] = useState<RelationshipKind | "all">("all");
  const [relationshipDirectionFilter, setRelationshipDirectionFilter] = useState<"all" | "incoming" | "outgoing">("all");
  const [dependencySearch, setDependencySearch] = useState("");
  const [moduleSearch, setModuleSearch] = useState("");

  // Expansion state
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set([""]));
  const [expandedSymbols, setExpandedSymbols] = useState<Set<string>>(new Set());

  // Derive active file id (fallback to first file if none explicitly selected)
  const activeFileId = selectedFileId || (data && data.filesById.size > 0 ? Array.from(data.filesById.values())[0]?.id || null : null);

  // Expand parent folders of a file path
  const expandPathFolders = useCallback((filePath: string) => {
    const parts = filePath.split("/").filter(Boolean);
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      let current = "";
      for (let i = 0; i < parts.length - 1; i++) {
        current = current ? `${current}/${parts[i]}` : parts[i];
        next.add(current);
      }
      return next;
    });
  }, []);

  // Expand parent symbols of an entity
  const expandParentSymbols = useCallback(
    (entityId: string) => {
      if (!data) return;
      const entity = data.allSymbolsById.get(entityId);
      if (!entity) return;

      setExpandedSymbols((prev) => {
        const next = new Set(prev);
        let curr = entity;
        while (curr.parentId) {
          next.add(curr.parentId);
          const parent = data.allSymbolsById.get(curr.parentId);
          if (!parent) break;
          curr = parent;
        }
        return next;
      });
    },
    [data]
  );

  // Auto-expand and select target when graph data loads with initial URL search params
  useEffect(() => {
    if (!data) return;

    if (initialEntityId) {
      const entity = data.allSymbolsById.get(initialEntityId);
      const symbolNode = data.nodesById.get(initialEntityId);
      const targetFileId = entity?.fileId || (symbolNode?.kind === "symbol" ? symbolNode.fileId : null);

      if (targetFileId) {
        setSelectedFileId(targetFileId);
        const file = data.filesById.get(targetFileId);
        if (file) {
          expandPathFolders(file.filePath);
        }
      }

      setSelectedEntityId(initialEntityId);
      expandParentSymbols(initialEntityId);
    } else if (initialFileId) {
      setSelectedFileId(initialFileId);
      const file = data.filesById.get(initialFileId);
      if (file) {
        expandPathFolders(file.filePath);
      }
    }
  }, [data, initialEntityId, initialFileId, expandPathFolders, expandParentSymbols]);

  // Sync state to URL shallowly
  const updateUrl = useCallback(
    (file: string | null, entity: string | null, tab: CenterTab, panel: ContextPanelTab) => {
      const params = new URLSearchParams();
      if (file) params.set("file", file);
      if (entity) params.set("entity", entity);
      if (tab !== "symbols") params.set("tab", tab);
      if (panel !== "graph") params.set("panel", panel);

      const queryString = params.toString();
      const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
      window.history.replaceState(null, "", targetUrl);
    },
    [pathname]
  );

  // Selection Actions
  const selectFile = useCallback(
    (fileId: string) => {
      setSelectedFileId(fileId);
      setSelectedEntityId(null);
      setSelectedRelationshipId(null);
      setCenterTabState("symbols");

      const file = data?.filesById.get(fileId);
      if (file) {
        expandPathFolders(file.filePath);
      }

      updateUrl(fileId, null, "symbols", contextPanelTab);
    },
    [data, expandPathFolders, updateUrl, contextPanelTab]
  );

  const selectEntity = useCallback(
    (entityId: string) => {
      setSelectedEntityId(entityId);
      setSelectedRelationshipId(null);
      expandParentSymbols(entityId);

      updateUrl(activeFileId, entityId, centerTab, contextPanelTab);
    },
    [activeFileId, centerTab, contextPanelTab, expandParentSymbols, updateUrl]
  );

  const selectRelationship = useCallback((relationshipId: string) => {
    setSelectedRelationshipId(relationshipId);
  }, []);

  const setCenterTab = useCallback(
    (tab: CenterTab) => {
      setCenterTabState(tab);
      updateUrl(activeFileId, selectedEntityId, tab, contextPanelTab);
    },
    [activeFileId, selectedEntityId, contextPanelTab, updateUrl]
  );

  const setContextPanelTab = useCallback(
    (tab: ContextPanelTab) => {
      setContextPanelTabState(tab);
      updateUrl(activeFileId, selectedEntityId, centerTab, tab);
    },
    [activeFileId, selectedEntityId, centerTab, updateUrl]
  );

  const openInExplorer = useCallback(
    (entityId: string) => {
      if (!data) return;
      const entity = data.allSymbolsById.get(entityId);
      const symbolNode = data.nodesById.get(entityId);
      const fileNode = data.filesById.get(entityId);

      let targetFileId: string | null = null;

      if (entity) {
        targetFileId = entity.fileId;
      } else if (symbolNode && symbolNode.kind === "symbol") {
        targetFileId = symbolNode.fileId;
      } else if (symbolNode && symbolNode.kind === "file") {
        targetFileId = symbolNode.id;
      } else if (fileNode) {
        targetFileId = fileNode.id;
      }

      if (targetFileId) {
        const file = data.filesById.get(targetFileId);
        if (file) {
          expandPathFolders(file.filePath);
        }
        setSelectedFileId(targetFileId);
      }

      if (entity || (symbolNode && symbolNode.kind === "symbol")) {
        setSelectedEntityId(entityId);
        expandParentSymbols(entityId);
      } else {
        setSelectedEntityId(null);
      }

      setSelectedRelationshipId(null);
      setCenterTabState("symbols");

      updateUrl(
        targetFileId || activeFileId,
        entity || (symbolNode && symbolNode.kind === "symbol") ? entityId : null,
        "symbols",
        contextPanelTab
      );
    },
    [data, activeFileId, contextPanelTab, expandPathFolders, expandParentSymbols, updateUrl]
  );

  // Folder and symbol toggle methods
  const toggleFolder = useCallback((folderPath: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  }, []);

  const toggleSymbol = useCallback((symbolId: string) => {
    setExpandedSymbols((prev) => {
      const next = new Set(prev);
      if (next.has(symbolId)) {
        next.delete(symbolId);
      } else {
        next.add(symbolId);
      }
      return next;
    });
  }, []);

  const expandAllFolders = useCallback(() => {
    if (!data) return;
    const allPaths = new Set<string>();
    function collect(folder: ExplorerFolderNode) {
      allPaths.add(folder.fullPath);
      for (const child of folder.children) {
        if (child.isFolder) collect(child);
      }
    }
    collect(data.fileTree);
    setExpandedFolders(allPaths);
  }, [data]);

  const collapseAllFolders = useCallback(() => {
    setExpandedFolders(new Set([""]));
  }, []);

  return {
    selectedFileId: activeFileId,
    selectedEntityId,
    selectedRelationshipId,
    centerTab,
    contextPanelTab,
    graphFilters,
    fileSearch,
    symbolSearch,
    symbolKindFilter,
    relationshipSearch,
    relationshipKindFilter,
    relationshipDirectionFilter,
    dependencySearch,
    moduleSearch,
    expandedFolders,
    expandedSymbols,
    // Actions
    selectFile,
    selectEntity,
    selectRelationship,
    openInExplorer,
    setCenterTab,
    setContextPanelTab,
    setGraphFilters,
    setFileSearch,
    setSymbolSearch,
    setSymbolKindFilter,
    setRelationshipSearch,
    setRelationshipKindFilter,
    setRelationshipDirectionFilter,
    setDependencySearch,
    setModuleSearch,
    toggleFolder,
    toggleSymbol,
    expandAllFolders,
    collapseAllFolders,
  };
}

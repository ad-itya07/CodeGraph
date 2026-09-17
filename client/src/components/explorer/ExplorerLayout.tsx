"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileTree } from "./FileTree";
import { FileWorkspace } from "./FileWorkspace";
import { ContextPanel } from "./ContextPanel";
import type { Repository } from "@/types";
import type { NormalizedExplorerData } from "@/types/explorer";
import type { useExplorerState } from "@/lib/explorer/useExplorerState";

interface ExplorerLayoutProps {
  repository: Repository | null | undefined;
  data: NormalizedExplorerData;
  explorerState: ReturnType<typeof useExplorerState>;
}

export function ExplorerLayout({
  repository,
  data,
  explorerState,
}: ExplorerLayoutProps) {
  const [isContextPanelCollapsed, setIsContextPanelCollapsed] = useState(false);

  const selectedFile = explorerState.selectedFileId
    ? data.filesById.get(explorerState.selectedFileId)
    : undefined;

  return (
    <div className="flex-1 flex min-h-0 min-w-0 h-full overflow-hidden relative">
      {/* 1. Left Pane: File Explorer (Independent width) */}
      <div className="h-full w-64 lg:w-72 border-r border-border shrink-0 flex flex-col bg-surface">
        <FileTree
          rootFolder={data.fileTree}
          selectedFileId={explorerState.selectedFileId}
          onSelectFile={explorerState.selectFile}
          expandedFolders={explorerState.expandedFolders}
          onToggleFolder={explorerState.toggleFolder}
          onExpandAll={explorerState.expandAllFolders}
          onCollapseAll={explorerState.collapseAllFolders}
          searchQuery={explorerState.fileSearch}
          onSearchChange={explorerState.setFileSearch}
          totalFiles={data.filesById.size}
        />
      </div>

      {/* 2. Center Pane: File Workspace */}
      <div className="flex-1 min-w-0 min-h-0 h-full flex flex-col overflow-hidden bg-background">
        <FileWorkspace
          repository={repository}
          file={selectedFile}
          data={data}
          activeTab={explorerState.centerTab}
          onTabChange={explorerState.setCenterTab}
          selectedEntityId={explorerState.selectedEntityId}
          selectedRelationshipId={explorerState.selectedRelationshipId}
          onSelectEntity={explorerState.selectEntity}
          onSelectRelationship={explorerState.selectRelationship}
          symbolSearch={explorerState.symbolSearch}
          onSymbolSearchChange={explorerState.setSymbolSearch}
          symbolKindFilter={explorerState.symbolKindFilter}
          onSymbolKindFilterChange={explorerState.setSymbolKindFilter}
          expandedSymbols={explorerState.expandedSymbols}
          onToggleSymbol={explorerState.toggleSymbol}
          relationshipSearch={explorerState.relationshipSearch}
          onRelationshipSearchChange={explorerState.setRelationshipSearch}
          relationshipKindFilter={explorerState.relationshipKindFilter}
          onRelationshipKindFilterChange={explorerState.setRelationshipKindFilter}
          relationshipDirectionFilter={explorerState.relationshipDirectionFilter}
          onRelationshipDirectionFilterChange={explorerState.setRelationshipDirectionFilter}
          dependencySearch={explorerState.dependencySearch}
          onDependencySearchChange={explorerState.setDependencySearch}
          moduleSearch={explorerState.moduleSearch}
          onModuleSearchChange={explorerState.setModuleSearch}
        />
      </div>

      {/* 3. Right Pane: Context Panel (Graph / Inspector) */}
      <div
        className={cn(
          "h-full transition-all duration-200 shrink-0 relative flex flex-col",
          isContextPanelCollapsed
            ? "w-0 overflow-hidden border-l-0"
            : "w-80 lg:w-[400px] xl:w-[460px]"
        )}
      >
        <ContextPanel
          repository={repository}
          activeTab={explorerState.contextPanelTab}
          onTabChange={explorerState.setContextPanelTab}
          currentFileId={explorerState.selectedFileId}
          selectedEntityId={explorerState.selectedEntityId}
          selectedRelationshipId={explorerState.selectedRelationshipId}
          data={data}
          onSelectEntity={explorerState.selectEntity}
          onSelectRelationship={explorerState.selectRelationship}
          onOpenInExplorer={explorerState.openInExplorer}
          graphFilters={explorerState.graphFilters}
          onGraphFiltersChange={explorerState.setGraphFilters}
        />
      </div>

      {/* Context Panel Toggle Tab */}
      <button
        onClick={() => setIsContextPanelCollapsed((prev) => !prev)}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-4 h-12 bg-surface-elevated border border-border border-r-0 rounded-l-md flex items-center justify-center text-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer shadow-sm"
        title={isContextPanelCollapsed ? "Expand context panel" : "Collapse context panel"}
        style={{
          right: isContextPanelCollapsed ? 0 : undefined,
        }}
      >
        {isContextPanelCollapsed ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>
    </div>
  );
}

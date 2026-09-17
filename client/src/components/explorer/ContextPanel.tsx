"use client";

import { Network, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContextGraph } from "./graph/ContextGraph";
import { FileInspector } from "./inspector/FileInspector";
import { CodeEntityInspector } from "./inspector/CodeEntityInspector";
import { DependencyInspector } from "./inspector/DependencyInspector";
import { ModuleInspector } from "./inspector/ModuleInspector";
import { RelationshipInspector } from "./inspector/RelationshipInspector";
import type { Repository } from "@/types";
import type {
  ContextPanelTab,
  GraphFilters,
  NormalizedExplorerData,
} from "@/types/explorer";

interface ContextPanelProps {
  repository: Repository | null | undefined;
  activeTab: ContextPanelTab;
  onTabChange: (tab: ContextPanelTab) => void;
  currentFileId: string | null;
  selectedEntityId: string | null;
  selectedRelationshipId: string | null;
  data: NormalizedExplorerData;
  onSelectEntity: (entityId: string) => void;
  onSelectRelationship: (relationshipId: string) => void;
  onOpenInExplorer: (entityId: string) => void;
  graphFilters: GraphFilters;
  onGraphFiltersChange: (filters: GraphFilters) => void;
}

export function ContextPanel({
  repository,
  activeTab,
  onTabChange,
  currentFileId,
  selectedEntityId,
  selectedRelationshipId,
  data,
  onSelectEntity,
  onSelectRelationship,
  onOpenInExplorer,
  graphFilters,
  onGraphFiltersChange,
}: ContextPanelProps) {
  // Determine what entity or relationship to inspect
  const renderInspectorContent = () => {
    // 1. If relationship is selected
    if (selectedRelationshipId) {
      const edge = data.edgesById.get(selectedRelationshipId);
      if (edge) {
        return (
          <RelationshipInspector
            repository={repository}
            relationship={edge}
            data={data}
            onSelectEntity={onSelectEntity}
            onOpenInExplorer={onOpenInExplorer}
          />
        );
      }
    }

    // 2. If entity is selected
    if (selectedEntityId) {
      const entity = data.allSymbolsById.get(selectedEntityId);
      if (entity) {
        return (
          <CodeEntityInspector
            repository={repository}
            entity={entity}
            currentFileId={currentFileId}
            data={data}
            onSelectEntity={onSelectEntity}
            onSelectRelationship={onSelectRelationship}
            onOpenInExplorer={onOpenInExplorer}
          />
        );
      }

      const dep = data.allDependenciesById.get(selectedEntityId);
      if (dep) {
        return (
          <DependencyInspector
            dependency={dep}
            data={data}
            onSelectEntity={onSelectEntity}
          />
        );
      }

      const mod = data.allModulesById.get(selectedEntityId);
      if (mod) {
        return (
          <ModuleInspector
            module={mod}
            data={data}
            onSelectEntity={onSelectEntity}
          />
        );
      }

      const file = data.filesById.get(selectedEntityId);
      if (file) {
        return (
          <FileInspector
            repository={repository}
            file={file}
            data={data}
            onSelectEntity={onSelectEntity}
            onOpenInExplorer={onOpenInExplorer}
          />
        );
      }
    }

    // 3. Fallback to current file if selected
    if (currentFileId) {
      const file = data.filesById.get(currentFileId);
      if (file) {
        return (
          <FileInspector
            repository={repository}
            file={file}
            data={data}
            onSelectEntity={onSelectEntity}
            onOpenInExplorer={onOpenInExplorer}
          />
        );
      }
    }

    // 4. Empty State
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-xs text-muted">
        <Info size={24} className="mb-2 text-subtle" />
        <h4 className="font-semibold text-foreground text-sm mb-1">
          Select an item to inspect
        </h4>
        <p className="text-subtle text-[11px] max-w-xs">
          Choose a file, code entity, package, or graph edge to inspect its full composition and relationships.
        </p>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-surface select-none border-l border-border">
      {/* Panel Header Tabs */}
      <div className="flex items-center border-b border-border bg-surface-elevated/40 p-2 shrink-0">
        <div className="grid grid-cols-2 w-full gap-1 p-0.5 rounded-lg bg-surface border border-border">
          <button
            onClick={() => onTabChange("graph")}
            className={cn(
              "flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer",
              activeTab === "graph"
                ? "bg-surface-elevated text-foreground border border-border-highlight/80 shadow-xs"
                : "text-muted hover:text-foreground"
            )}
          >
            <Network size={13} className={activeTab === "graph" ? "text-accent" : "text-muted"} />
            <span>Context Graph</span>
          </button>

          <button
            onClick={() => onTabChange("inspector")}
            className={cn(
              "flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer",
              activeTab === "inspector"
                ? "bg-surface-elevated text-foreground border border-border-highlight/80 shadow-xs"
                : "text-muted hover:text-foreground"
            )}
          >
            <Info size={13} className={activeTab === "inspector" ? "text-accent" : "text-muted"} />
            <span>Inspector</span>
          </button>
        </div>
      </div>

      {/* Panel Body */}
      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto">
        {activeTab === "graph" ? (
          <ContextGraph
            currentFileId={currentFileId}
            selectedEntityId={selectedEntityId}
            selectedRelationshipId={selectedRelationshipId}
            data={data}
            onSelectEntity={onSelectEntity}
            onSelectRelationship={onSelectRelationship}
            onOpenInExplorer={onOpenInExplorer}
            graphFilters={graphFilters}
            onGraphFiltersChange={onGraphFiltersChange}
          />
        ) : (
          renderInspectorContent()
        )}
      </div>
    </div>
  );
}

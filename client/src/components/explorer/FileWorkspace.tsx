"use client";

import {
  Code2,
  Network,
  Package,
  FolderSymlink,
  ExternalLink,
  ChevronRight,
  FileCode2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatGitHubUrl } from "@/lib/explorer/github";
import { getBreadcrumbParts, getRepositoryRelativePath } from "@/lib/explorer/paths";
import { SymbolsView } from "./SymbolsView";
import { RelationshipsView } from "./RelationshipsView";
import { DependenciesView } from "./DependenciesView";
import { ModulesView } from "./ModulesView";
import type { Repository, FileNode, SymbolKind, RelationshipKind } from "@/types";
import type { CenterTab, NormalizedExplorerData } from "@/types/explorer";

interface FileWorkspaceProps {
  repository: Repository | null | undefined;
  file: FileNode | undefined;
  data: NormalizedExplorerData;
  activeTab: CenterTab;
  onTabChange: (tab: CenterTab) => void;
  selectedEntityId: string | null;
  selectedRelationshipId: string | null;
  onSelectEntity: (entityId: string) => void;
  onSelectRelationship: (relationshipId: string) => void;
  // Symbol filters
  symbolSearch: string;
  onSymbolSearchChange: (query: string) => void;
  symbolKindFilter: SymbolKind | "all";
  onSymbolKindFilterChange: (kind: SymbolKind | "all") => void;
  expandedSymbols: Set<string>;
  onToggleSymbol: (symbolId: string) => void;
  // Relationship filters
  relationshipSearch: string;
  onRelationshipSearchChange: (query: string) => void;
  relationshipKindFilter: RelationshipKind | "all";
  onRelationshipKindFilterChange: (kind: RelationshipKind | "all") => void;
  relationshipDirectionFilter: "all" | "incoming" | "outgoing";
  onRelationshipDirectionFilterChange: (dir: "all" | "incoming" | "outgoing") => void;
  // Dependency & Module search
  dependencySearch: string;
  onDependencySearchChange: (query: string) => void;
  moduleSearch: string;
  onModuleSearchChange: (query: string) => void;
}

export function FileWorkspace({
  repository,
  file,
  data,
  activeTab,
  onTabChange,
  selectedEntityId,
  selectedRelationshipId,
  onSelectEntity,
  onSelectRelationship,
  symbolSearch,
  onSymbolSearchChange,
  symbolKindFilter,
  onSymbolKindFilterChange,
  expandedSymbols,
  onToggleSymbol,
  relationshipSearch,
  onRelationshipSearchChange,
  relationshipKindFilter,
  onRelationshipKindFilterChange,
  relationshipDirectionFilter,
  onRelationshipDirectionFilterChange,
  dependencySearch,
  onDependencySearchChange,
  moduleSearch,
  onModuleSearchChange,
}: FileWorkspaceProps) {
  if (!file) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-background select-none">
        <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center text-muted mb-4">
          <FileCode2 size={24} />
        </div>
        <h3 className="text-base font-bold font-heading text-foreground mb-1">
          No file selected
        </h3>
        <p className="text-xs text-muted max-w-sm">
          Select a source file from the file tree on the left to explore its code entities, relationships, dependencies, and graph context.
        </p>
      </div>
    );
  }

  // Calculate counts for badges
  const symbols = data.symbolsByFileId.get(file.id) || [];
  let totalSymbolCount = 0;
  function countSyms(items: typeof symbols) {
    for (const item of items) {
      totalSymbolCount++;
      if (item.children.length > 0) countSyms(item.children);
    }
  }
  countSyms(symbols);

  const dependencies = data.dependenciesByFileId.get(file.id) || [];
  const modules = data.modulesByFileId.get(file.id) || [];

  // Normalized repository-relative breadcrumbs (e.g. Creditsea > server > src > middleware > auth.ts)
  const breadcrumbs = getBreadcrumbParts(file.filePath, repository?.name, repository?.id);
  const fileName = breadcrumbs[breadcrumbs.length - 1] || file.filePath.split("/").pop() || "file";
  const dirParts = breadcrumbs.slice(0, -1);
  const relativePath = getRepositoryRelativePath(file.filePath, repository?.id);

  // GitHub URL
  const githubUrl = formatGitHubUrl(
    repository?.url,
    repository?.commitSha,
    file.filePath,
    undefined,
    repository?.id
  );

  const tabs: Array<{ id: CenterTab; label: string; icon: any; count?: number }> = [
    { id: "symbols", label: "Symbols", icon: Code2, count: totalSymbolCount },
    { id: "relationships", label: "Relationships", icon: Network },
    { id: "dependencies", label: "Dependencies", icon: Package, count: dependencies.length },
    { id: "modules", label: "Modules", icon: FolderSymlink, count: modules.length },
  ];

  return (
    <div className="h-full flex flex-col bg-background min-w-0 min-h-0 overflow-hidden">
      {/* File Header */}
      <div className="px-5 py-3 border-b border-border bg-surface shrink-0">
        {/* Breadcrumb Path */}
        <div className="flex items-center gap-1 text-[11px] font-mono text-muted mb-1 overflow-x-auto whitespace-nowrap">
          {dirParts.map((part, index) => (
            <span key={index} className="flex items-center gap-1">
              <span className={cn(index === 0 ? "text-accent font-semibold" : "text-subtle hover:text-muted transition-colors")}>
                {part}
              </span>
              <ChevronRight size={12} className="text-subtle shrink-0" />
            </span>
          ))}
          <span className="text-foreground font-medium">{fileName}</span>
        </div>

        {/* File Title & Actions */}
        <div className="flex items-center justify-between gap-4 mt-0.5">
          <div className="min-w-0">
            <h1 className="text-base font-bold font-heading text-foreground truncate font-mono">
              {fileName}
            </h1>
            {relativePath && (
              <p className="text-[11px] text-subtle font-mono truncate mt-0.5" title={relativePath}>
                {relativePath}
              </p>
            )}
          </div>

          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono text-muted hover:text-foreground hover:bg-surface-elevated border border-border/80 transition-colors shrink-0 group"
              title="View source on GitHub"
            >
              <span>View on GitHub</span>
              <ExternalLink size={11} className="group-hover:translate-x-0.5 transition-transform shrink-0" />
            </a>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mt-3 border-t border-border/60 pt-2.5 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer shrink-0 border",
                  isActive
                    ? "bg-surface-elevated text-foreground border-border-highlight/80 shadow-xs"
                    : "text-muted hover:text-foreground hover:bg-surface-elevated/40 border-transparent"
                )}
              >
                <Icon
                  size={13}
                  className={cn("shrink-0", isActive ? "text-accent" : "text-muted")}
                />
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.2 rounded-full font-mono",
                      isActive ? "bg-accent/15 text-accent" : "bg-surface text-subtle"
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Center Tab Viewport */}
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
        {activeTab === "symbols" && (
          <SymbolsView
            symbols={symbols}
            selectedEntityId={selectedEntityId}
            onSelectEntity={onSelectEntity}
            searchQuery={symbolSearch}
            onSearchChange={onSymbolSearchChange}
            kindFilter={symbolKindFilter}
            onKindFilterChange={onSymbolKindFilterChange}
            expandedSymbols={expandedSymbols}
            onToggleSymbol={onToggleSymbol}
          />
        )}

        {activeTab === "relationships" && (
          <RelationshipsView
            currentFileId={file.id}
            selectedEntityId={selectedEntityId}
            selectedRelationshipId={selectedRelationshipId}
            data={data}
            onSelectEntity={onSelectEntity}
            onSelectRelationship={onSelectRelationship}
            searchQuery={relationshipSearch}
            onSearchChange={onRelationshipSearchChange}
            kindFilter={relationshipKindFilter}
            onKindFilterChange={onRelationshipKindFilterChange}
            directionFilter={relationshipDirectionFilter}
            onDirectionFilterChange={onRelationshipDirectionFilterChange}
          />
        )}

        {activeTab === "dependencies" && (
          <DependenciesView
            dependencies={dependencies}
            selectedEntityId={selectedEntityId}
            onSelectEntity={onSelectEntity}
            searchQuery={dependencySearch}
            onSearchChange={onDependencySearchChange}
          />
        )}

        {activeTab === "modules" && (
          <ModulesView
            modules={modules}
            selectedEntityId={selectedEntityId}
            onSelectEntity={onSelectEntity}
            searchQuery={moduleSearch}
            onSearchChange={onModuleSearchChange}
          />
        )}
      </div>
    </div>
  );
}

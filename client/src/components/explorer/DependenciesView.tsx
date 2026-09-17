"use client";

import { useMemo } from "react";
import { Package, Search, X, ExternalLink, FileJson } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DependencyNode } from "@/types";

interface DependenciesViewProps {
  dependencies: DependencyNode[];
  selectedEntityId: string | null;
  onSelectEntity: (entityId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function DependenciesView({
  dependencies,
  selectedEntityId,
  onSelectEntity,
  searchQuery,
  onSearchChange,
}: DependenciesViewProps) {
  const filteredDependencies = useMemo(() => {
    if (!searchQuery.trim()) return dependencies;
    const q = searchQuery.toLowerCase().trim();
    return dependencies.filter(
      (dep) =>
        dep.name.toLowerCase().includes(q) ||
        (dep.version && dep.version.toLowerCase().includes(q)) ||
        (dep.packageJsonPath && dep.packageJsonPath.toLowerCase().includes(q))
    );
  }, [dependencies, searchQuery]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Search Header */}
      <div className="p-3 border-b border-border flex items-center justify-between gap-3 shrink-0 bg-surface/50">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" size={13} />
          <input
            type="text"
            placeholder="Search package dependencies..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-8 pl-8 pr-7 rounded-md bg-surface-elevated/80 border border-border text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-border-highlight focus:ring-1 focus:ring-accent transition-all font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <span className="text-[11px] font-mono text-subtle px-2 shrink-0">
          {filteredDependencies.length} {filteredDependencies.length === 1 ? "package" : "packages"}
        </span>
      </div>

      {/* Dependency List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredDependencies.length > 0 ? (
          filteredDependencies.map((dep) => {
            const isSelected = selectedEntityId === dep.id;

            return (
              <div
                key={dep.id}
                onClick={() => onSelectEntity(dep.id)}
                className={cn(
                  "p-3 rounded-lg border font-mono text-xs transition-all cursor-pointer group flex items-center justify-between gap-3",
                  isSelected
                    ? "bg-surface-elevated border-border-highlight shadow-xs"
                    : "bg-surface/60 border-border hover:border-border-highlight/60 hover:bg-surface-elevated/40"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                    <Package size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground truncate text-[13px]">
                        {dep.name}
                      </span>
                      {dep.version && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface border border-border text-muted">
                          {dep.version}
                        </span>
                      )}
                    </div>
                    {dep.packageJsonPath && (
                      <div className="flex items-center gap-1 text-[10px] text-subtle mt-0.5 truncate">
                        <FileJson size={11} className="shrink-0" />
                        <span>{dep.packageJsonPath}</span>
                      </div>
                    )}
                  </div>
                </div>

                <span className="text-[10px] text-subtle font-mono uppercase shrink-0">
                  Dependency
                </span>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center text-xs text-muted flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-muted mb-3">
              <Package size={18} />
            </div>
            <h4 className="font-semibold text-foreground text-sm mb-1">
              No dependencies found
            </h4>
            <p className="text-subtle max-w-sm">
              {searchQuery
                ? "No dependencies match your search query."
                : "This file does not have any resolved package dependencies."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

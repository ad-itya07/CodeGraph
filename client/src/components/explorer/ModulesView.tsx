"use client";

import { useMemo } from "react";
import { FolderSymlink, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModuleNode } from "@/types";

interface ModulesViewProps {
  modules: ModuleNode[];
  selectedEntityId: string | null;
  onSelectEntity: (entityId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ModulesView({
  modules,
  selectedEntityId,
  onSelectEntity,
  searchQuery,
  onSearchChange,
}: ModulesViewProps) {
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return modules;
    const q = searchQuery.toLowerCase().trim();
    return modules.filter((mod) => mod.name.toLowerCase().includes(q));
  }, [modules, searchQuery]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Search Header */}
      <div className="p-3 border-b border-border flex items-center justify-between gap-3 shrink-0 bg-surface/50">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" size={13} />
          <input
            type="text"
            placeholder="Search module references..."
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
          {filteredModules.length} {filteredModules.length === 1 ? "module" : "modules"}
        </span>
      </div>

      {/* Module List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredModules.length > 0 ? (
          filteredModules.map((mod) => {
            const isSelected = selectedEntityId === mod.id;

            return (
              <div
                key={mod.id}
                onClick={() => onSelectEntity(mod.id)}
                className={cn(
                  "p-3 rounded-lg border font-mono text-xs transition-all cursor-pointer group flex items-center justify-between gap-3",
                  isSelected
                    ? "bg-surface-elevated border-border-highlight shadow-xs"
                    : "bg-surface/60 border-border hover:border-border-highlight/60 hover:bg-surface-elevated/40"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                    <FolderSymlink size={14} />
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-foreground truncate text-[13px] block">
                      {mod.name}
                    </span>
                    <span className="text-[10px] text-subtle mt-0.5 block">
                      External Module Target
                    </span>
                  </div>
                </div>

                <span className="text-[10px] text-subtle font-mono uppercase shrink-0">
                  Module
                </span>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center text-xs text-muted flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-muted mb-3">
              <FolderSymlink size={18} />
            </div>
            <h4 className="font-semibold text-foreground text-sm mb-1">
              No modules found
            </h4>
            <p className="text-subtle max-w-sm">
              {searchQuery
                ? "No modules match your search query."
                : "This file does not have any unresolved external module relationships."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
